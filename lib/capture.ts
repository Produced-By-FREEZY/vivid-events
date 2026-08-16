import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import { generateQuotePdf, type PdfLine } from "@/lib/quote-pdf"
import { isEmailConfigured, renderPaidEmail, renderDepositReleasedEmail, sendMail } from "@/lib/email"
import { getPortalSettingsAdmin } from "@/app/portal/settings-actions"
import { CAPTURED_STATUS, isAuthorized, isCollected } from "@/lib/quote-status"

const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)
const firstNameOf = (name: string) => (name ?? "").trim().split(/\s+/)[0] || name
const roundCents = (n: number) => Math.round(Number(n) * 100)

/** "14:30[:00]" → "2:30 PM"; empty for missing/invalid input. */
function fmtTime12(t?: string | null): string {
  const m = /^(\d{1,2}):(\d{2})/.exec((t ?? "").trim())
  if (!m) return ""
  let h = Number(m[1])
  const period = h >= 12 ? "PM" : "AM"
  h = h % 12 || 12
  return `${h}:${m[2]} ${period}`
}
function fmtTimeRange(start?: string | null, end?: string | null): string {
  const s = fmtTime12(start)
  if (!s) return ""
  const e = fmtTime12(end)
  return e ? `${s}–${e}` : s
}

/** Effective required deposit: owner override when set, otherwise summed per-line deposits. */
function effectiveDeposit(quote: any): number {
  return quote.deposit_required_amount != null
    ? Number(quote.deposit_required_amount)
    : Number(quote.deposit_total ?? 0)
}

export type CaptureOptions = {
  /** Dollars of the security deposit to KEEP for damages. 0 = release the whole deposit. */
  depositCaptureAmount?: number
}

export type CaptureResult = {
  success: boolean
  error?: string
  /** Total dollars captured (rental + any kept deposit). */
  captured?: number
  /** Dollars of the deposit released back to the customer. */
  released?: number
}

/**
 * Complete a rental after the event: partially capture the authorized hold so
 * only the rental fee (plus any deposit kept for damages) is charged, and the
 * uncaptured remainder of the deposit is released automatically — no refund,
 * so Stripe fees are only ever paid on money actually collected.
 *
 * Works against ANY Supabase client (admin for the one-click token flow, the
 * RLS session client for the owner dashboard). Idempotent per quote.
 *
 * Back-compat: for legacy quotes that were fully charged under the old flow
 * (PaymentIntent already `succeeded`), it falls back to a Stripe refund of the
 * released portion so those bookings still settle correctly.
 */
export async function captureRentalForQuote(
  db: SupabaseClient,
  quote: any,
  opts: CaptureOptions = {},
): Promise<CaptureResult> {
  if (!isStripeConfigured()) return { success: false, error: "Payments are not set up yet." }
  if (!quote) return { success: false, error: "Quote not found." }

  // Idempotent: already captured/collected.
  if (isCollected(quote.status) && quote.captured_at) {
    return {
      success: true,
      captured: Number(quote.captured_amount ?? quote.amount_paid ?? 0),
      released: Number(quote.deposit_released_amount ?? 0),
    }
  }

  if (!quote.stripe_payment_intent_id) {
    return { success: false, error: "No Stripe payment is linked to this booking." }
  }
  if (!isAuthorized(quote.status) && !isCollected(quote.status)) {
    return { success: false, error: "Payment must be authorized before it can be captured." }
  }

  const rental = Number(quote.total)
  const depositAmount = quote.deposit_required ? effectiveDeposit(quote) : 0
  const requestedDepositKeep = Math.max(0, Number(opts.depositCaptureAmount ?? 0))
  const depositKept = Math.min(requestedDepositKeep, depositAmount)
  const depositReleased = Math.max(0, depositAmount - depositKept)

  const rentalCents = roundCents(rental)
  const authorizedCents =
    quote.authorized_amount != null ? roundCents(Number(quote.authorized_amount)) : roundCents(rental + depositAmount)
  // Never try to capture more than was authorized.
  const captureCents = Math.min(rentalCents + roundCents(depositKept), authorizedCents)
  const capturedDollars = captureCents / 100

  const stripe = getStripe()

  // Inspect the live PaymentIntent so we pick capture vs. legacy-refund correctly.
  let pi: any
  try {
    pi = await stripe.paymentIntents.retrieve(quote.stripe_payment_intent_id)
  } catch (e) {
    console.error("[v0] capture retrieve PI failed:", e instanceof Error ? e.message : e)
    return { success: false, error: "Could not reach Stripe. Please try again." }
  }

  let chargeId: string | null = null
  let receiptUrl: string | null = null

  try {
    if (pi.status === "requires_capture") {
      // The intended path: partial capture releases the uncaptured deposit.
      const captured = await stripe.paymentIntents.capture(
        quote.stripe_payment_intent_id,
        { amount_to_capture: captureCents },
        { idempotencyKey: `capture_${quote.id}` },
      )
      chargeId = typeof captured.latest_charge === "string" ? captured.latest_charge : captured.latest_charge?.id ?? null
    } else if (pi.status === "succeeded") {
      // Legacy: already charged in full under the old flow — refund the released
      // portion of the deposit so the customer still gets their money back.
      chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id ?? null
      if (depositReleased > 0) {
        await stripe.refunds.create(
          {
            payment_intent: quote.stripe_payment_intent_id,
            amount: roundCents(depositReleased),
            metadata: { quote_id: quote.id, quote_number: quote.quote_number, kind: "security_deposit" },
          },
          { idempotencyKey: `deposit_refund_${quote.id}` },
        )
      }
    } else {
      return { success: false, error: `This payment can't be captured (status: ${pi.status}).` }
    }
  } catch (e) {
    console.error("[v0] capture stripe failed:", e instanceof Error ? e.message : e)
    return { success: false, error: "Stripe could not process the capture. Please try again." }
  }

  // Fetch the receipt for the customer's records.
  try {
    if (chargeId) {
      const charge = await stripe.charges.retrieve(chargeId)
      receiptUrl = charge.receipt_url ?? null
    }
  } catch {
    // Non-fatal — capture already succeeded.
  }

  const nowIso = new Date().toISOString()
  const { error: updErr } = await db
    .from("quotes")
    .update({
      status: CAPTURED_STATUS,
      captured_at: nowIso,
      captured_amount: capturedDollars,
      deposit_captured_amount: depositKept,
      deposit_released_amount: depositReleased,
      amount_paid: capturedDollars,
      paid_at: quote.paid_at ?? nowIso,
      invoiced_at: quote.invoiced_at ?? nowIso,
      stripe_capture_charge_id: chargeId,
      stripe_invoice_url: receiptUrl ?? quote.stripe_invoice_url ?? null,
      // Legacy fields kept in sync so existing calendar/badge logic still works.
      deposit_refunded_at: depositAmount > 0 ? nowIso : quote.deposit_refunded_at,
      deposit_refund_amount: depositReleased,
    })
    .eq("id", quote.id)

  if (updErr) {
    console.error("[v0] capture DB update failed:", updErr.message)
    return { success: false, error: "Payment captured, but we could not record it. Check Stripe before retrying." }
  }

  const invoiceNumber = quote.invoice_number || quote.quote_number
  const settings = await getPortalSettingsAdmin()

  // Paid-invoice PDF to the customer, reflecting the amount actually captured.
  try {
    if (isEmailConfigured()) {
      const { data: items } = await db
        .from("quote_items")
        .select("*")
        .eq("quote_id", quote.id)
        .order("sort_order", { ascending: true })

      const pdfLines: PdfLine[] = (items ?? []).map((it: any) => ({
        name: it.name,
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unit_price),
        lineTotal: Number(it.line_total),
        itemType: it.item_type,
      }))

      const pdf = await generateQuotePdf({
        kind: "invoice",
        number: quote.quote_number,
        invoiceNumber,
        issuedDate: new Date().toLocaleDateString("en-CA"),
        clientName: quote.client_name,
        clientEmail: quote.client_email,
        eventName: quote.event_name,
        eventDate: quote.event_date,
        eventTime: fmtTimeRange(quote.event_start_time, quote.event_end_time) || null,
        eventAddress: quote.event_address,
        items: pdfLines,
        subtotal: Number(quote.subtotal),
        taxRate: Number(quote.tax_rate),
        taxAmount: Number(quote.tax_amount),
        total: Number(quote.total),
        depositTotal: depositAmount,
        depositRequired: Boolean(quote.deposit_required),
        amountDue: capturedDollars,
        paid: true,
        paidAt: new Date(nowIso).toLocaleDateString("en-CA"),
        terms: settings.quote_terms,
      })

      const { subject, html, text } = renderPaidEmail(
        {
          subject: settings.paid_email_subject,
          body: settings.paid_email_body,
          signerName: settings.signer_name,
        },
        {
          first_name: firstNameOf(quote.client_name),
          event_name: quote.event_name || "your event",
          invoice_number: invoiceNumber,
          receipt_link: receiptUrl ?? "",
          signer_name: settings.signer_name,
        },
      )
      await sendMail({
        to: quote.client_email,
        subject,
        html,
        text,
        attachments: [{ filename: `Invoice-${invoiceNumber}.pdf`, content: pdf }],
      })
    }
  } catch (e) {
    console.error("[v0] capture invoice email failed:", e instanceof Error ? e.message : e)
  }

  // Deposit-released confirmation (only when some deposit was actually returned).
  try {
    if (isEmailConfigured() && depositReleased > 0) {
      const { subject, html, text } = renderDepositReleasedEmail(
        {
          subject: settings.deposit_released_email_subject,
          body: settings.deposit_released_email_body,
          signerName: settings.signer_name,
        },
        {
          first_name: firstNameOf(quote.client_name),
          event_name: quote.event_name || "your event",
          invoice_number: invoiceNumber,
          deposit_refund_amount: money(depositReleased),
          signer_name: settings.signer_name,
        },
      )
      await sendMail({ to: quote.client_email, subject, html, text })
    }
  } catch (e) {
    console.error("[v0] capture deposit-released email failed:", e instanceof Error ? e.message : e)
  }

  return { success: true, captured: capturedDollars, released: depositReleased }
}
