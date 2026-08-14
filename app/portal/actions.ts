"use server"

import { createHash, randomInt } from "node:crypto"
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isEmailConfigured, loginCodeEmail, sendMail } from "@/lib/email"
import { redirect } from "next/navigation"

type ActionResult = { success: boolean; error?: string }

const CODE_TTL_MINUTES = 10
const MAX_ATTEMPTS = 5

function getPublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return { url, anonKey, configured: Boolean(url && anonKey) }
}

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex")
}

/**
 * Generate a fresh 6-digit code, generate a real (un-emailed) Supabase OTP via
 * the Admin API, store both in `portal_login_codes`, and email OUR code from
 * the business Gmail. Returns false if anything upstream fails.
 */
async function issueLoginCode(email: string): Promise<ActionResult> {
  if (!isEmailConfigured()) {
    return { success: false, error: "Email is not configured yet. Please contact your administrator." }
  }

  const admin = createAdminClient()

  // Mint a genuine Supabase email OTP WITHOUT Supabase sending an email.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  })

  if (error || !data?.properties?.email_otp) {
    console.error("[v0] generateLink failed:", error?.message)
    return { success: false, error: "Could not start sign-in. Please try again." }
  }

  const supabaseOtp = data.properties.email_otp
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0")
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString()

  // Clear any previous pending codes for this email, then store the new one.
  await admin.from("portal_login_codes").delete().eq("email", email)
  const { error: insertError } = await admin.from("portal_login_codes").insert({
    email,
    code_hash: hashCode(code),
    supabase_token_hash: supabaseOtp,
    expires_at: expiresAt,
  })

  if (insertError) {
    console.error("[v0] Failed to store login code:", insertError.message)
    return { success: false, error: "Could not start sign-in. Please try again." }
  }

  try {
    const { subject, html, text } = loginCodeEmail(code)
    await sendMail({ to: email, subject, html, text })
  } catch (e) {
    console.error("[v0] Failed to email login code:", e instanceof Error ? e.message : e)
    return { success: false, error: "We couldn't send your code. Check the email address and try again." }
  }

  return { success: true }
}

/**
 * Step 1 of sign-in. Verify email + password WITHOUT establishing a session,
 * then email a 6-digit code as the second factor.
 */
export async function startSignIn(email: string, password: string): Promise<ActionResult> {
  const { url, anonKey, configured } = getPublicConfig()
  if (!configured) {
    return { success: false, error: "Sign-in is not available yet — Supabase is not configured." }
  }

  const normalizedEmail = email.trim().toLowerCase()

  // In-memory client: verifies credentials but never persists a session.
  const verifier = createSupabaseJsClient(url!, anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: passwordError } = await verifier.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  if (passwordError) {
    console.log("[v0] Password verification failed:", passwordError.message)
    return { success: false, error: "Invalid email or password." }
  }

  await verifier.auth.signOut()

  return issueLoginCode(normalizedEmail)
}

/** Resend the 6-digit code during step 2. */
export async function resendCode(email: string): Promise<ActionResult> {
  const { configured } = getPublicConfig()
  if (!configured) {
    return { success: false, error: "Supabase is not configured." }
  }
  return issueLoginCode(email.trim().toLowerCase())
}

/**
 * Step 2 of sign-in. Verify OUR 6-digit code against the stored hash, then
 * establish the Supabase session using the stored genuine OTP.
 */
export async function verifyCode(email: string, code: string): Promise<ActionResult> {
  const { configured } = getPublicConfig()
  if (!configured) {
    return { success: false, error: "Supabase is not configured." }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const trimmedCode = code.trim()
  const admin = createAdminClient()

  const { data: row, error: fetchError } = await admin
    .from("portal_login_codes")
    .select("*")
    .eq("email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError || !row) {
    return { success: false, error: "That code is invalid or has expired. Request a new one." }
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await admin.from("portal_login_codes").delete().eq("id", row.id)
    return { success: false, error: "That code has expired. Request a new one." }
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    await admin.from("portal_login_codes").delete().eq("id", row.id)
    return { success: false, error: "Too many attempts. Request a new code." }
  }

  if (hashCode(trimmedCode) !== row.code_hash) {
    await admin
      .from("portal_login_codes")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id)
    return { success: false, error: "That code is incorrect." }
  }

  // Code is valid — establish the real session with the stored genuine OTP.
  const supabase = await createServerClient()
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token: row.supabase_token_hash,
    type: "email",
  })

  // Single-use: remove the code regardless of outcome.
  await admin.from("portal_login_codes").delete().eq("email", normalizedEmail)

  if (verifyError) {
    console.error("[v0] Session establishment failed:", verifyError.message)
    return { success: false, error: "We couldn't complete sign-in. Please request a new code." }
  }

  return { success: true }
}

/**
 * Change the signed-in owner's password. Re-verifies the current password
 * first (Supabase's updateUser does not).
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<ActionResult> {
  const { url, anonKey, configured } = getPublicConfig()
  if (!configured) {
    return { success: false, error: "Supabase is not configured." }
  }

  if (newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters." }
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { success: false, error: "You are not signed in." }
  }

  const verifier = createSupabaseJsClient(url!, anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (verifyError) {
    return { success: false, error: "Your current password is incorrect." }
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) {
    console.error("[v0] Password update failed:", updateError.message)
    return { success: false, error: "Could not update your password. Please try again." }
  }

  return { success: true }
}

/** Sign the owner out and return to the login screen. */
export async function signOut() {
  const { configured } = getPublicConfig()
  if (configured) {
    const supabase = await createServerClient()
    await supabase.auth.signOut()
  }
  redirect("/portal/login")
}
