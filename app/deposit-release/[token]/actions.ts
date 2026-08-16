"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { isStripeConfigured } from "@/lib/stripe"
import { captureRentalForQuote } from "@/lib/capture"
import { isAuthorized, isCollected } from "@/lib/quote-status"

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
    releasedAt: (quote.captured_at ?? quote.deposit_refunded_at) as string | null,
  }

  // Already completed: rental captured (deposit released) or legacy refund done.
  if (quote.captured_at || quote.deposit_refunded_at) return { ...base, status: "already_released" }
  // Ready to complete: an active hold (authorized) or a legacy full charge, with a linked PI.
  if ((isAuthorized(quote.status) || isCollected(quote.status)) && quote.stripe_payment_intent_id) {
    return { ...base, status: "ready" }
  }
  return { ...base, status: "not_payable" }
}

type ReleaseResult = { success: boolean; error?: string; amount?: number }

/**
 * Complete the rental via the secure token from the owner's email (no login).
 * Captures only the rental fee, which automatically releases the held security
 * deposit back to the customer — no refund fees. Idempotent.
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

  const depositAmount = depositAmountOf(quote)

  // Capture the rental only (depositCaptureAmount: 0 → the whole deposit hold is released).
  const result = await captureRentalForQuote(admin, quote, { depositCaptureAmount: 0 })
  if (!result.success) return { success: false, error: result.error }

  revalidatePath("/portal/invoices")
  revalidatePath("/portal/dashboard")
  revalidatePath("/portal/calendar")
  return { success: true, amount: result.released ?? depositAmount }
}
