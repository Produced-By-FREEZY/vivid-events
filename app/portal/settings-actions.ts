"use server"

import { revalidatePath } from "next/cache"
import { createClient as createServerClient } from "@/lib/supabase/server"

export type PortalSettings = {
  quote_email_subject: string
  quote_email_body: string
  signer_name: string
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
    .select("quote_email_subject, quote_email_body, signer_name")
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
  }
}

export type SaveSettingsResult = { success: boolean; error?: string }

/** Persist the owner's email template + signature (single settings row, id=1). */
export async function savePortalSettings(input: PortalSettings): Promise<SaveSettingsResult> {
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
