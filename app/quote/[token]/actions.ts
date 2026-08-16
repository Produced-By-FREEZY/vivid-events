"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import {
  isEmailConfigured,
  depositReleaseRequestEmail,
  bookingConfirmationEmail,
  sendMail,
} from "@/lib/email"
import { AUTHORIZED_STATUS, isSecured } from "@/lib/quote-status"

const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

type ActionResult = { success: boolean; error?: string; url?: string; status?: string }

async function getBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "https"
  if (host) return `${proto}://${host}`
  return "http://localhost:3000"
}

const cents = (n: number) => Math.round(Number(n) * 100)
const firstNameOf = (name: string) => (name ?? "").trim().split(/\s+/)[0] || name

/** "14:30[:00]" → "2:30 PM"; empty for missing/invalid input. */
function fmtTime12(t?: string | null): string {
  const m = /^(\d{1,2}):(\d{2})/.exec((t ?? "").trim())
  if (!m) return ""
  let h = Number(m[1])
  const period = h >= 12 ? "PM" : "AM"
  h = h % 12 || 12
  return `${h}:${m[2]} ${period}`
}

/** Compact time range: "2:30 PM–5:00 PM", "2:30 PM", or "" when no start time. */
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

/** Amount the customer actually pays: quote total plus the refundable deposit when required. */
function payableAmount(quote: any): number {
  const total = Number(quote.total)
  const deposit = effectiveDeposit(quote)
  return quote.deposit_required ? Math.round((total + deposit) * 100) / 100 : total
}

/**
 * Customer signs/approves the quote WITHOUT paying yet. Records the typed
 * signature and flips the quote to "approved" in Supabase.
 */
export async function approveQuote(token: string, signatureName: string): Promise<ActionResult> {
  const name = signatureName?.trim()
  if (!name || name.length < 2) return { success: false, error: "Please type your full name to approve." }

  const admin = createAdminClient()
  const { data: quote, error } = await admin.from("quotes").select("*").eq("public_token", token).maybeSingle()
  if (error || !quote) return { success: false, error: "This quote could not be found." }
  if (isSecured(quote.status)) {
    return { success: true, status: quote.status }
  }

  const { error: updErr } = await admin
    .from("quotes")
    .update({
      status: "approved",
      approved_at: quote.approved_at ?? new Date().toISOString(),
      approved_by_name: name,
      signature_name: name,
    })
    .eq("id", quote.id)

  if (updErr) {
    console.error("[v0] approveQuote failed:", updErr.message)
    return { success: false, error: "Could not record your approval. Please try again." }
  }

  revalidatePath(`/quote/${token}`)
  revalidatePath("/portal/invoices")
  revalidatePath("/portal/dashboard")
  return { success: true, status: "approved" }
}

/** Create a Stripe Checkout session for the quote and return its hosted URL. */
export async function createQuoteCheckout(token: string): Promise<ActionResult> {
  if (!isStripeConfigured()) return { success: false, error: "Payments are not set up yet." }

  const admin = createAdminClient()
  const { data: quote, error } = await admin.from("quotes").select("*").eq("public_token", token).maybeSingle()
  if (error || !quote) return { success: false, error: "This quote could not be found." }
  if (isSecured(quote.status)) return { success: false, error: "This quote is already confirmed." }

  const amount = payableAmount(quote)
  if (!(amount > 0)) return { success: false, error: "This quote has no payable amount." }

  const stripe = getStripe()
  const baseUrl = await getBaseUrl()
  const eventBit = quote.event_name ? ` — ${quote.event_name}` : ""

  const line_items: any[] = [
    {
      price_data: {
        currency: "cad",
        product_data: {
          name: `Vivid Events · Quote ${quote.quote_number}${eventBit}`,
          description: "Event production services (taxes included).",
        },
        unit_amount: cents(Number(quote.total)),
      },
      quantity: 1,
    },
  ]

  const depositAmount = effectiveDeposit(quote)
  if (quote.deposit_required && depositAmount > 0) {
    line_items.push({
      price_data: {
        currency: "cad",
        product_data: {
          name: "Refundable security deposit",
          description: "Returned in full after equipment is returned undamaged.",
        },
        unit_amount: cents(depositAmount),
      },
      quantity: 1,
    })
  }

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items,
        customer_email: quote.client_email,
        billing_address_collection: "auto",
        success_url: `${baseUrl}/quote/${token}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/quote/${token}?canceled=1`,
        metadata: { quote_id: quote.id, token, quote_number: quote.quote_number },
        payment_intent_data: {
          // Authorize (place a hold on) the FULL rental + deposit without
          // capturing. The rental is captured after the event, which releases
          // the uncaptured deposit — so Stripe fees are only paid on what's kept.
          capture_method: "manual",
          metadata: { quote_id: quote.id, token, quote_number: quote.quote_number },
        },
      },
      // Idempotency so a double-click can't open two charges for the same quote total.
      { idempotencyKey: `quote_${quote.id}_${amount}` },
    )

    await admin.from("quotes").update({ stripe_checkout_session_id: session.id }).eq("id", quote.id)
    return { success: true, url: session.url ?? undefined }
  } catch (e) {
    console.error("[v0] createQuoteCheckout failed:", e instanceof Error ? e.message : e)
    return { success: false, error: "Could not start checkout. Please try again." }
  }
}

/**
 * Confirm the card authorization on return from Stripe. With manual capture the
 * Checkout Session settles as an authorization (PaymentIntent = requires_capture),
 * NOT a payment — the full rental + deposit is held on the card but nothing is
 * captured yet. This records the hold, books the event, and emails booking
 * confirmations. The rental is captured later, after the event. Idempotent.
 */
export async function confirmQuotePayment(token: string, sessionId: string): Promise<ActionResult> {
  if (!isStripeConfigured()) return { success: false, error: "Payments are not set up." }

  const admin = createAdminClient()
  const { data: quote, error } = await admin.from("quotes").select("*").eq("public_token", token).maybeSingle()
  if (error || !quote) return { success: false, error: "Quote not found." }

  // Already confirmed (hold placed or captured) — nothing to do.
  if (isSecured(quote.status) && quote.invoice_number) {
    return { success: true, status: quote.status }
  }

  const stripe = getStripe()
  let session: any
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    })
  } catch (e) {
    console.error("[v0] confirmQuotePayment retrieve failed:", e instanceof Error ? e.message : e)
    return { success: false, error: "Could not verify payment." }
  }

  // Guard: the session must belong to THIS quote.
  if (session.metadata?.quote_id !== quote.id) return { success: false, error: "Payment does not match this quote." }

  const paymentIntent = typeof session.payment_intent === "object" ? session.payment_intent : null
  const piStatus: string | null = paymentIntent?.status ?? null

  // With manual capture, a completed checkout leaves the PaymentIntent in
  // "requires_capture" (the hold is placed). "succeeded" would mean it was
  // already captured. Anything else means the customer hasn't finished.
  const isAuthorizedHold = piStatus === "requires_capture"
  const isAlreadyCaptured = piStatus === "succeeded" || session.payment_status === "paid"
  if (!isAuthorizedHold && !isAlreadyCaptured) {
    return { success: false, error: "Payment is not complete yet." }
  }

  const payerName: string | null = session.customer_details?.name ?? null
  const authorizedAmount = (session.amount_total ?? paymentIntent?.amount ?? 0) / 100

  // Generate a sequential invoice/booking number.
  const { data: invNum } = await admin.rpc("next_invoice_number")
  const invoiceNumber = (invNum as string) ?? `INV-${quote.quote_number}`
  const nowIso = new Date().toISOString()

  const { error: updErr } = await admin
    .from("quotes")
    .update({
      status: AUTHORIZED_STATUS,
      authorized_at: nowIso,
      authorized_amount: authorizedAmount,
      approved_at: quote.approved_at ?? nowIso,
      approved_by_name: quote.approved_by_name ?? payerName,
      signature_name: quote.signature_name ?? payerName,
      invoice_number: invoiceNumber,
      invoiced_at: quote.invoiced_at ?? nowIso,
      stripe_payment_intent_id: paymentIntent?.id ?? null,
      stripe_checkout_session_id: session.id,
    })
    .eq("id", quote.id)

  if (updErr) {
    console.error("[v0] confirmQuotePayment update failed:", updErr.message)
    return { success: false, error: "Card authorized but we could not finalize the booking." }
  }

  const paidAtIso = nowIso

  // Security deposit held → email the OWNER a one-click "complete & release" link.
  const depositAmount = effectiveDeposit(quote)
  if (quote.deposit_required && depositAmount > 0) {
    try {
      const releaseToken = quote.deposit_release_token || crypto.randomUUID().replace(/-/g, "")
      await admin
        .from("quotes")
        .update({
          deposit_release_token: releaseToken,
          deposit_release_requested_at: quote.deposit_release_requested_at ?? paidAtIso,
        })
        .eq("id", quote.id)

      const ownerAddress = process.env.GMAIL_USER
      if (isEmailConfigured() && ownerAddress && !quote.deposit_refunded_at) {
        const baseUrl = await getBaseUrl()
        const { subject, html, text } = depositReleaseRequestEmail({
          clientName: quote.client_name,
          eventName: quote.event_name,
          eventDate: quote.event_date,
          invoiceNumber,
          depositAmount,
          quotedTotal: Number(quote.total),
          releaseUrl: `${baseUrl}/deposit-release/${releaseToken}`,
        })
        await sendMail({ to: ownerAddress, subject, html, text })
      }
    } catch (e) {
      console.error("[v0] confirmQuotePayment deposit-release email failed:", e instanceof Error ? e.message : e)
    }
  }

  // Event has a date → send calendar booking confirmations (client + owner) with .ics.
  if (quote.event_date && !quote.calendar_confirmation_sent_at) {
    try {
      if (isEmailConfigured()) {
        const client = bookingConfirmationEmail({
          audience: "client",
          clientName: quote.client_name,
          eventName: quote.event_name,
          eventDate: quote.event_date,
          eventStartTime: quote.event_start_time,
          eventEndTime: quote.event_end_time,
          eventAddress: quote.event_address,
          invoiceNumber,
          quoteNumber: quote.quote_number,
        })
        await sendMail({
          to: quote.client_email,
          subject: client.subject,
          html: client.html,
          text: client.text,
          attachments: [{ filename: client.icsFilename, content: Buffer.from(client.ics), contentType: "text/calendar" }],
        })

        const ownerAddress = process.env.GMAIL_USER
        if (ownerAddress) {
          const owner = bookingConfirmationEmail({
            audience: "owner",
            clientName: quote.client_name,
            eventName: quote.event_name,
            eventDate: quote.event_date,
            eventStartTime: quote.event_start_time,
            eventEndTime: quote.event_end_time,
            eventAddress: quote.event_address,
            invoiceNumber,
            quoteNumber: quote.quote_number,
          })
          await sendMail({
            to: ownerAddress,
            subject: owner.subject,
            html: owner.html,
            text: owner.text,
            attachments: [{ filename: owner.icsFilename, content: Buffer.from(owner.ics), contentType: "text/calendar" }],
          })
        }
      }
      await admin.from("quotes").update({ calendar_confirmation_sent_at: paidAtIso }).eq("id", quote.id)
    } catch (e) {
      console.error("[v0] confirmQuotePayment calendar email failed:", e instanceof Error ? e.message : e)
    }
  }

  revalidatePath(`/quote/${token}`)
  revalidatePath("/portal/invoices")
  revalidatePath("/portal/dashboard")
  revalidatePath("/portal/calendar")
  return { success: true, status: AUTHORIZED_STATUS }
}
