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
  quote_terms: string
}

const SETTINGS_ID = 1

/** Sensible default terms & conditions for an AV / lighting event rental company. */
const DEFAULT_QUOTE_TERMS = `Terms & Conditions
1. Scope of Services
This quotation covers the equipment, staffing and services specifically listed above for the stated event date, times and location. Any changes to the run sheet, added gear, extra hours, or a change of venue may affect pricing and availability and will be confirmed in writing before they take effect.

2. Booking & Deposit
Dates are held on a first-come basis and are only confirmed once this quote is approved and payment is received. For equipment-only rentals a refundable security deposit is collected up front (see section 4). Approving this quote confirms you have the authority to book on behalf of the event.

3. Payment Terms
Full payment of the quoted total is due at the time of approval to secure your booking, unless a separate payment schedule has been agreed in writing. Bookings made within 7 days of the event are due in full immediately. All prices are in CAD and include applicable taxes where shown.

4. Refundable Security Deposit
Equipment-only rentals (no on-site staff) require a refundable security deposit collected with payment. It is returned in full within 3 business days of the equipment being returned on time and undamaged. The cost of any loss, damage, or missing items will be deducted from the deposit, and you remain responsible for costs exceeding the deposit.

5. Cancellations & Rescheduling
Cancellations made 14 or more days before the event receive a full refund of amounts paid, less the security deposit handling where applicable. Cancellations within 14 days may be subject to a charge of up to 50% of the total, and within 48 hours up to 100%, to cover reserved gear and crew. We will always work with you to reschedule where our calendar allows.

6. Equipment Care & Liability
All equipment remains the property of Vivid Events at all times. The client is responsible for the safe use and security of the gear from delivery/setup until collection, including protection from weather, liquids, theft and misuse. Vivid Events is not liable for delays or losses caused by circumstances beyond our reasonable control, including venue restrictions or power failures.

7. Setup, Access & Power
The client is responsible for providing safe, timely venue access, adequate and stable power, and a suitable weather-protected space for the equipment. Delays caused by venue access, power issues, or incomplete information may reduce setup time and are not grounds for a refund.

8. Force Majeure
Neither party is liable for failure to perform due to events beyond reasonable control (e.g. severe weather, power outages, illness, government restrictions). In such cases we will make every reasonable effort to reschedule or provide a fair credit.

9. Quote Validity
This quotation is valid for the number of days shown on the quote from the date of issue. Prices, equipment and crew availability are subject to change if the booking is confirmed after this period.`

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
  quote_terms: DEFAULT_QUOTE_TERMS,
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
      "quote_email_subject, quote_email_body, signer_name, paid_email_subject, paid_email_body, deposit_released_email_subject, deposit_released_email_body, quote_terms",
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
    quote_terms: data?.quote_terms ?? DEFAULTS.quote_terms,
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
        "quote_email_subject, quote_email_body, signer_name, paid_email_subject, paid_email_body, deposit_released_email_subject, deposit_released_email_body, quote_terms",
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
      quote_terms: data?.quote_terms ?? DEFAULTS.quote_terms,
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

/**
 * Persist the owner's default quote terms & conditions. These are rendered at
 * the bottom of the customer-facing quote and the quotation PDF that is sent.
 */
export async function saveQuoteTermsSettings(input: {
  quote_terms: string
}): Promise<SaveSettingsResult> {
  const session = await requireSession()
  if (!session) return { success: false, error: "You are not signed in." }

  const terms = input.quote_terms?.trim()
  if (!terms) return { success: false, error: "The quote terms can't be empty." }

  const { error } = await session.supabase.from("portal_settings").upsert(
    {
      id: SETTINGS_ID,
      quote_terms: terms,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  )

  if (error) {
    console.error("[v0] saveQuoteTermsSettings failed:", error.message)
    return { success: false, error: "Could not save your quote terms. Please try again." }
  }

  revalidatePath("/portal/settings")
  return { success: true }
}
