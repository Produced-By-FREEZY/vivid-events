"use server"

import { createClient as createSupabaseJsClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

type ActionResult = { success: boolean; error?: string }

function getPublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return { url, anonKey, configured: Boolean(url && anonKey) }
}

/**
 * Step 1 of sign-in. Verify the email + password WITHOUT establishing a
 * session, then email a 6-digit one-time code as the second factor.
 *
 * Password verification uses an in-memory (non-persisting) client so no
 * cookies are set until the 2FA code is confirmed in step 2.
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
    // Genericized to prevent account enumeration.
    return { success: false, error: "Invalid email or password." }
  }

  // Discard the verified session and send the 6-digit second-factor code.
  await verifier.auth.signOut()

  const { error: otpError } = await verifier.auth.signInWithOtp({
    email: normalizedEmail,
    options: { shouldCreateUser: false },
  })

  if (otpError) {
    console.error("[v0] Failed to send 2FA code:", otpError.message)
    return { success: false, error: "Could not send your verification code. Please try again." }
  }

  return { success: true }
}

/** Resend the 6-digit code during step 2. */
export async function resendCode(email: string): Promise<ActionResult> {
  const { url, anonKey, configured } = getPublicConfig()
  if (!configured) {
    return { success: false, error: "Supabase is not configured." }
  }

  const client = createSupabaseJsClient(url!, anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await client.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: false },
  })

  if (error) {
    return { success: false, error: "Could not resend the code. Please try again shortly." }
  }
  return { success: true }
}

/**
 * Step 2 of sign-in. Verify the 6-digit code. On success this establishes the
 * session via the SSR server client, which writes it as a *session* cookie
 * (cleared on browser close).
 */
export async function verifyCode(email: string, code: string): Promise<ActionResult> {
  const { configured } = getPublicConfig()
  if (!configured) {
    return { success: false, error: "Supabase is not configured." }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: code.trim(),
    type: "email",
  })

  if (error) {
    console.log("[v0] Code verification failed:", error.message)
    return { success: false, error: "That code is invalid or has expired." }
  }

  return { success: true }
}

/**
 * Change the signed-in owner's password. Re-verifies the current password
 * first (Supabase's updateUser does not), so a left-open session can't be
 * used to silently take over the account.
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

  // Re-verify the current password with an in-memory client.
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
