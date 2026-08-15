"use server"

import { revalidatePath } from "next/cache"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type PortalSettings = {
  quote_email_subject: string
  quote_email_body: string
  signer_name: string
  paid_email_subject: string
  paid_email_body: string
  deposit_released_email_subject: string
  deposit_released_email_body: string
}

const SETTINGS_ID = 1

const DEFAULTS: PortalSettings = {
  quote_email_subject: "Vivid Events - Your quotation for {event_name} ({quote_number})",
  quote_email_body: `Hi {first_name},

Thanks for reaching out, it was great hearing what you have planned.

I've put together a quotation covering everything and attached it to this email as a PDF (quote {quote_number}). Please take a look when you get a chance.

Whenever you're ready, you can review, approve and (if you'd like) pay your deposit securely here:
{review_link}

If anything looks off or you'd like to tweak the package, just reply to this email, happy to adjust it. Looking forward to being part of the day.

Warm regards,

{signer_name}
Vivid Events`,
  signer_name: "Vivid Events",
  paid_email_subject: "Vivid Events - Payment received for {event_name} ({invoice_number})",
  paid_email_body: `Hi {first_name},

Just a quick note to say your payment came through — thank you! I've attached your paid invoice ({invoice_number}) for your records.

{receipt_link}

Your booking is now confirmed. I'll be in touch closer to the date to finalise timings, but in the meantime feel free to reply here with any questions at all.

Thanks again for choosing us — can't wait for the event.

All the best,
{signer_name}
Vivid Events`,
  deposit_released_email_subject: "Vivid Events - Your security deposit has been released ({invoice_number})",
  deposit_released_email_body: `Hi {first_name},

Great news — your event has wrapped up and we've released your security deposit of {deposit_refund_amount} back to your original payment method.

Depending on your bank, it can take 5–10 business days to appear on your statement.

Thanks again for choosing us for {event_name} — it was a pleasure being part of the day.

All the best,
{signer_name}
Vivid Events`,
}

async function requireSession() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return { supabase, user }
}

/** Read the owner's saved email template + signature. Falls back to sensible defaults. */
export async function getPortalSettings(): Promise<PortalSettings> {
  const session = await requireSession()
  if (!session) return DEFAULTS

  const { data, error } = await session.supabase
    .from("portal_settings")
    .select(
      "quote_email_subject, quote_email_body, signer_name, paid_email_subject, paid_email_body, deposit_released_email_subject, deposit_released_email_body",
    )
    .eq("id", SETTINGS_ID)
    .maybeSingle()

  if (error) {
    console.error("[v0] getPortalSettings failed:", error.message)
    return DEFAULTS
  }

  return {
    quote_email_subject: data?.quote_email_subject ?? DEFAULTS.quote_email_subject,
    quote_email_body: data?.quote_email_body ?? DEFAULTS.quote_email_body,
    signer_name: data?.signer_name ?? DEFAULTS.signer_name,
    paid_email_subject: data?.paid_email_subject ?? DEFAULTS.paid_email_subject,
    paid_email_body: data?.paid_email_body ?? DEFAULTS.paid_email_body,
    deposit_released_email_subject:
      data?.deposit_released_email_subject ?? DEFAULTS.deposit_released_email_subject,
    deposit_released_email_body: data?.deposit_released_email_body ?? DEFAULTS.deposit_released_email_body,
  }
}

/**
 * Server-side settings read for public / token-authenticated flows (payment
 * confirmation, deposit release) where there is no owner session. Uses the
 * service-role client so the customer-facing emails still use the owner's
 * saved templates. Falls back to defaults on any error.
 */
export async function getPortalSettingsAdmin(): Promise<PortalSettings> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("portal_settings")
      .select(
        "quote_email_subject, quote_email_body, signer_name, paid_email_subject, paid_email_body, deposit_released_email_subject, deposit_released_email_body",
      )
      .eq("id", SETTINGS_ID)
      .maybeSingle()
    return {
      quote_email_subject: data?.quote_email_subject ?? DEFAULTS.quote_email_subject,
      quote_email_body: data?.quote_email_body ?? DEFAULTS.quote_email_body,
      signer_name: data?.signer_name ?? DEFAULTS.signer_name,
      paid_email_subject: data?.paid_email_subject ?? DEFAULTS.paid_email_subject,
      paid_email_body: data?.paid_email_body ?? DEFAULTS.paid_email_body,
      deposit_released_email_subject:
        data?.deposit_released_email_subject ?? DEFAULTS.deposit_released_email_subject,
      deposit_released_email_body: data?.deposit_released_email_body ?? DEFAULTS.deposit_released_email_body,
    }
  } catch (e) {
    console.error("[v0] getPortalSettingsAdmin failed:", e instanceof Error ? e.message : e)
    return DEFAULTS
  }
}

export type SaveSettingsResult = { success: boolean; error?: string }

/** Persist the owner's email template + signature (single settings row, id=1). */
export async function savePortalSettings(input: {
  quote_email_subject: string
  quote_email_body: string
  signer_name: string
}): Promise<SaveSettingsResult> {
  const session = await requireSession()
  if (!session) return { success: false, error: "You are not signed in." }

  const subject = input.quote_email_subject?.trim()
  const body = input.quote_email_body?.trim()
  const signer = input.signer_name?.trim()

  if (!subject) return { success: false, error: "The email subject can't be empty." }
  if (!body) return { success: false, error: "The email body can't be empty." }
  if (!signer) return { success: false, error: "The signature name can't be empty." }

  const { error } = await session.supabase.from("portal_settings").upsert(
    {
      id: SETTINGS_ID,
      quote_email_subject: subject,
      quote_email_body: body,
      signer_name: signer,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  )

  if (error) {
    console.error("[v0] savePortalSettings failed:", error.message)
    return { success: false, error: "Could not save your settings. Please try again." }
  }

  revalidatePath("/portal/settings")
  return { success: true }
}

/** Persist the owner's payment-confirmation email template (subject + body). */
export async function savePaidEmailSettings(input: {
  paid_email_subject: string
  paid_email_body: string
}): Promise<SaveSettingsResult> {
  const session = await requireSession()
  if (!session) return { success: false, error: "You are not signed in." }

  const subject = input.paid_email_subject?.trim()
  const body = input.paid_email_body?.trim()
  if (!subject) return { success: false, error: "The email subject can't be empty." }
  if (!body) return { success: false, error: "The email body can't be empty." }

  const { error } = await session.supabase.from("portal_settings").upsert(
    {
      id: SETTINGS_ID,
      paid_email_subject: subject,
      paid_email_body: body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  )

  if (error) {
    console.error("[v0] savePaidEmailSettings failed:", error.message)
    return { success: false, error: "Could not save your settings. Please try again." }
  }

  revalidatePath("/portal/settings")
  return { success: true }
}

/** Persist the owner's deposit-released customer notification template. */
export async function saveDepositReleasedEmailSettings(input: {
  deposit_released_email_subject: string
  deposit_released_email_body: string
}): Promise<SaveSettingsResult> {
  const session = await requireSession()
  if (!session) return { success: false, error: "You are not signed in." }

  const subject = input.deposit_released_email_subject?.trim()
  const body = input.deposit_released_email_body?.trim()
  if (!subject) return { success: false, error: "The email subject can't be empty." }
  if (!body) return { success: false, error: "The email body can't be empty." }

  const { error } = await session.supabase.from("portal_settings").upsert(
    {
      id: SETTINGS_ID,
      deposit_released_email_subject: subject,
      deposit_released_email_body: body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  )

  if (error) {
    console.error("[v0] saveDepositReleasedEmailSettings failed:", error.message)
    return { success: false, error: "Could not save your settings. Please try again." }
  }

  revalidatePath("/portal/settings")
  return { success: true }
}
