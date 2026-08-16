import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPortalSettingsAdmin } from "@/app/portal/settings-actions"
import { QuoteView } from "./quote-view"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Your Quotation · Vivid Events",
  robots: { index: false, follow: false },
}

export default async function PublicQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ session_id?: string; canceled?: string }>
}) {
  const { token } = await params
  const { session_id, canceled } = await searchParams

  const admin = createAdminClient()
  const { data: quote } = await admin.from("quotes").select("*").eq("public_token", token).maybeSingle()
  if (!quote) notFound()

  const { data: items } = await admin
    .from("quote_items")
    .select("*")
    .eq("quote_id", quote.id)
    .order("sort_order", { ascending: true })

  const settings = await getPortalSettingsAdmin()

  return (
    <QuoteView
      token={token}
      sessionId={session_id ?? null}
      canceled={canceled === "1"}
      terms={settings.quote_terms}
      quote={{
        quote_number: quote.quote_number,
        client_name: quote.client_name,
        client_email: quote.client_email,
        event_name: quote.event_name,
        event_date: quote.event_date,
        event_start_time: quote.event_start_time,
        event_end_time: quote.event_end_time,
        event_address: quote.event_address,
        status: quote.status,
        subtotal: Number(quote.subtotal),
        tax_rate: Number(quote.tax_rate),
        tax_amount: Number(quote.tax_amount),
        total: Number(quote.total),
        deposit_total:
          quote.deposit_required_amount != null
            ? Number(quote.deposit_required_amount)
            : Number(quote.deposit_total ?? 0),
        deposit_required: Boolean(quote.deposit_required),
        labor_total: Number(quote.labor_total ?? 0),
        amount_paid: Number(quote.amount_paid ?? 0),
        invoice_number: quote.invoice_number,
        stripe_invoice_url: quote.stripe_invoice_url,
        approved_by_name: quote.approved_by_name,
        approved_at: quote.approved_at,
        paid_at: quote.paid_at,
        notes: quote.notes,
        valid_until: quote.valid_until,
        created_at: quote.created_at,
      }}
      items={(items ?? []).map((it) => ({
        id: it.id,
        name: it.name,
        description: it.description,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        line_total: Number(it.line_total),
        item_type: it.item_type,
      }))}
    />
  )
}
