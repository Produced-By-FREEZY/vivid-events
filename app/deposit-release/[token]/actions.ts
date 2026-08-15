"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import { isEmailConfigured, renderDepositReleasedEmail, sendMail } from "@/lib/email"
import { getPortalSettingsAdmin } from "@/app/portal/settings-actions"

const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)
const firstNameOf = (name: string) => (name ?? "").trim().split(/\s+/)[0] || name

function depositAmountOf(quote: any): number {
  return quote.deposit_required_amount != null
    ? Number(quote.deposit_required_amount)
    : Number(quote.deposit_total ?? 0)
}

export type ReleaseInfo = {
  found: boolean
  status?: "ready" | "already_released" | "not_payable"
  clientName?: string
  eventName?: string | null
  eventDate?: string | null
  invoiceNumber?: string | null
  quoteNumber?: string
  depositAmount?: number
  quotedTotal?: number
  releasedAt?: string | null
}

/** Look up a deposit-release request by its secure token (no login required). */
export async function getReleaseInfo(token: string): Promise<ReleaseInfo> {
  if (!token) return { found: false }
  const admin = createAdminClient()
  const { data: quote } = await admin.from("quotes").select("*").eq("deposit_release_token", token).maybeSingle()
  if (!quote) return { found: false }

  const depositAmount = depositAmountOf(quote)
  const base = {
    found: true as const,
    clientName: quote.client_name as string,
    eventName: quote.event_name as string | null,
    eventDate: quote.event_date as string | null,
    invoiceNumber: quote.invoice_number as string | null,
    quoteNumber: quote.quote_number as string,
    depositAmount,
    quotedTotal: Number(quote.total),
    releasedAt: quote.deposit_refunded_at as string | null,
  }

  if (quote.deposit_refunded_at) return { ...base, status: "already_released" }
  if (!["paid", "invoiced"].includes(quote.status) || !quote.paid_at || !quote.stripe_payment_intent_id) {
    return { ...base, status: "not_payable" }
  }
  return { ...base, status: "ready" }
}

type ReleaseResult = { success: boolean; error?: string; amount?: number }

/**
 * Release (refund) the refundable security deposit to the customer via Stripe,
 * authenticated only by the secure token from the owner's email. Idempotent.
 */
export async function releaseDepositByToken(token: string): Promise<ReleaseResult> {
  if (!token) return { success: false, error: "Invalid link." }
  if (!isStripeConfigured()) return { success: false, error: "Payments are not set up." }

  const admin = createAdminClient()
  const { data: quote, error } = await admin
    .from("quotes")
    .select("*")
    .eq("deposit_release_token", token)
    .maybeSingle()
  if (error || !quote) return { success: false, error: "This release link is not valid." }

  if (!quote.deposit_required) return { success: false, error: "This booking has no security deposit." }
  if (quote.deposit_refunded_at) return { success: true, amount: Number(quote.deposit_refund_amount ?? 0) } // idempotent
  if (!["paid", "invoiced"].includes(quote.status) || !quote.paid_at) {
    return { success: false, error: "The deposit can only be released after payment." }
  }
  if (!quote.stripe_payment_intent_id) {
    return { success: false, error: "No Stripe payment is linked to this booking." }
  }

  const depositAmount = depositAmountOf(quote)
  if (!(depositAmount > 0)) return { success: false, error: "There is no deposit amount to release." }

  const stripe = getStripe()
  let refundId: string
  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: quote.stripe_payment_intent_id,
        amount: Math.round(depositAmount * 100),
        metadata: { quote_id: quote.id, quote_number: quote.quote_number, kind: "security_deposit" },
      },
      { idempotencyKey: `deposit_refund_${quote.id}` },
    )
    refundId = refund.id
  } catch (e) {
    console.error("[v0] releaseDepositByToken stripe failed:", e instanceof Error ? e.message : e)
    return { success: false, error: "Stripe could not process the release. Please try again." }
  }

  const refundedAt = new Date().toISOString()
  const { error: updErr } = await admin
    .from("quotes")
    .update({
      deposit_refunded_at: refundedAt,
      deposit_refund_amount: depositAmount,
      stripe_deposit_refund_id: refundId,
    })
    .eq("id", quote.id)

  if (updErr) {
    console.error("[v0] releaseDepositByToken update failed:", updErr.message)
    return { success: false, error: "Release issued, but we could not record it. Check Stripe before retrying." }
  }

  // Notify the customer using the owner's editable template (best-effort).
  try {
    if (isEmailConfigured()) {
      const settings = await getPortalSettingsAdmin()
      const { subject, html, text } = renderDepositReleasedEmail(
        {
          subject: settings.deposit_released_email_subject,
          body: settings.deposit_released_email_body,
          signerName: settings.signer_name,
        },
        {
          first_name: firstNameOf(quote.client_name),
          event_name: quote.event_name || "your event",
          invoice_number: quote.invoice_number || quote.quote_number,
          deposit_refund_amount: money(depositAmount),
          signer_name: settings.signer_name,
        },
      )
      await sendMail({ to: quote.client_email, subject, html, text })
    }
  } catch (e) {
    console.error("[v0] releaseDepositByToken email failed:", e instanceof Error ? e.message : e)
  }

  revalidatePath("/portal/invoices")
  revalidatePath("/portal/dashboard")
  revalidatePath("/portal/calendar")
  return { success: true, amount: depositAmount }
}
