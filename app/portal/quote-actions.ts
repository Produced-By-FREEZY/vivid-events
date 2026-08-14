"use server"

import { revalidatePath } from "next/cache"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isEmailConfigured, quoteEmail, sendMail } from "@/lib/email"

export type ServiceItem = {
  id: string
  category: string
  name: string
  description: string | null
  unit: string
  unit_price: number
  active: boolean
  sort_order: number
}

export type QuoteLineInput = {
  service_item_id: string | null
  name: string
  description: string | null
  unit_price: number
  quantity: number
}

export type QuoteInput = {
  client_name: string
  client_email: string
  client_phone?: string | null
  company?: string | null
  event_name?: string | null
  event_date?: string | null
  notes?: string | null
  valid_until?: string | null
  tax_rate: number
  items: QuoteLineInput[]
}

export type QuoteRecord = {
  id: string
  quote_number: string
  client_name: string
  client_email: string
  event_name: string | null
  event_date: string | null
  status: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  notes: string | null
  valid_until: string | null
  sent_at: string | null
  created_at: string
}

const TAX_RATE = 0.05 // GST default; owner can override per quote

async function requireSession() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return { supabase, user }
}

/** Fetch the active service catalog for the quote builder. */
export async function getServiceItems(): Promise<ServiceItem[]> {
  const session = await requireSession()
  if (!session) return []
  const { data, error } = await session.supabase
    .from("service_items")
    .select("*")
    .eq("active", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
  if (error) {
    console.error("[v0] getServiceItems failed:", error.message)
    return []
  }
  return (data ?? []) as ServiceItem[]
}

function computeTotals(items: QuoteLineInput[], taxRate: number) {
  const cleanItems = items
    .filter((it) => it.name.trim() && Number(it.quantity) > 0)
    .map((it) => {
      const quantity = Math.max(0, Number(it.quantity) || 0)
      const unitPrice = Math.max(0, Number(it.unit_price) || 0)
      return {
        ...it,
        quantity,
        unit_price: unitPrice,
        line_total: Math.round(quantity * unitPrice * 100) / 100,
      }
    })
  const subtotal = Math.round(cleanItems.reduce((sum, it) => sum + it.line_total, 0) * 100) / 100
  const rate = Number.isFinite(taxRate) && taxRate >= 0 && taxRate <= 1 ? taxRate : TAX_RATE
  const taxAmount = Math.round(subtotal * rate * 100) / 100
  const total = Math.round((subtotal + taxAmount) * 100) / 100
  return { cleanItems, subtotal, rate, taxAmount, total }
}

type SaveResult = { success: boolean; error?: string; quoteId?: string; quoteNumber?: string }

/**
 * Create a quote (header + line items). Recomputes all totals server-side and
 * upserts the client into the clients table.
 */
export async function saveQuote(input: QuoteInput): Promise<SaveResult> {
  const session = await requireSession()
  if (!session) return { success: false, error: "You are not signed in." }

  const clientName = input.client_name?.trim()
  const clientEmail = input.client_email?.trim().toLowerCase()
  if (!clientName) return { success: false, error: "Client name is required." }
  if (!clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return { success: false, error: "A valid client email is required." }
  }

  const { cleanItems, subtotal, rate, taxAmount, total } = computeTotals(input.items, input.tax_rate)
  if (cleanItems.length === 0) {
    return { success: false, error: "Add at least one line item to the quote." }
  }

  const { supabase } = session

  // Upsert client (match on email).
  let clientId: string | null = null
  const { data: existingClient } = await supabase.from("clients").select("id").eq("email", clientEmail).maybeSingle()
  if (existingClient) {
    clientId = existingClient.id
    await supabase
      .from("clients")
      .update({
        name: clientName,
        phone: input.client_phone ?? null,
        company: input.company ?? null,
      })
      .eq("id", clientId)
  } else {
    const { data: newClient } = await supabase
      .from("clients")
      .insert({
        name: clientName,
        email: clientEmail,
        phone: input.client_phone ?? null,
        company: input.company ?? null,
      })
      .select("id")
      .single()
    clientId = newClient?.id ?? null
  }

  // Generate a sequential quote number via the SECURITY DEFINER function (admin).
  const admin = createAdminClient()
  const { data: numberData, error: numberError } = await admin.rpc("next_quote_number")
  if (numberError || !numberData) {
    console.error("[v0] next_quote_number failed:", numberError?.message)
    return { success: false, error: "Could not generate a quote number. Please try again." }
  }
  const quoteNumber = numberData as string

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      quote_number: quoteNumber,
      client_id: clientId,
      client_name: clientName,
      client_email: clientEmail,
      event_name: input.event_name?.trim() || null,
      event_date: input.event_date || null,
      status: "draft",
      subtotal,
      tax_rate: rate,
      tax_amount: taxAmount,
      total,
      notes: input.notes?.trim() || null,
      valid_until: input.valid_until || null,
    })
    .select("*")
    .single()

  if (quoteError || !quote) {
    console.error("[v0] saveQuote insert failed:", quoteError?.message)
    return { success: false, error: "Could not save the quote. Please try again." }
  }

  const rows = cleanItems.map((it, i) => ({
    quote_id: quote.id,
    service_item_id: it.service_item_id,
    name: it.name.trim(),
    description: it.description?.trim() || null,
    unit_price: it.unit_price,
    quantity: it.quantity,
    line_total: it.line_total,
    sort_order: i,
  }))
  const { error: itemsError } = await supabase.from("quote_items").insert(rows)
  if (itemsError) {
    console.error("[v0] saveQuote items failed:", itemsError.message)
    // Roll back the header so we don't leave an empty quote.
    await supabase.from("quotes").delete().eq("id", quote.id)
    return { success: false, error: "Could not save the quote line items. Please try again." }
  }

  revalidatePath("/portal/invoices")
  revalidatePath("/portal/dashboard")
  revalidatePath("/portal/client-list")
  return { success: true, quoteId: quote.id, quoteNumber }
}

/** Email a saved quote to the customer from the business Gmail. */
export async function sendQuote(quoteId: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireSession()
  if (!session) return { success: false, error: "You are not signed in." }
  if (!isEmailConfigured()) {
    return { success: false, error: "Email is not configured yet." }
  }

  const { supabase } = session
  const { data: quote, error } = await supabase.from("quotes").select("*").eq("id", quoteId).single()
  if (error || !quote) {
    return { success: false, error: "Quote not found." }
  }

  const { data: items } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("sort_order", { ascending: true })

  try {
    const { subject, html, text } = quoteEmail({
      quoteNumber: quote.quote_number,
      clientName: quote.client_name,
      eventName: quote.event_name,
      eventDate: quote.event_date,
      items: (items ?? []).map((it) => ({
        name: it.name,
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unit_price),
        lineTotal: Number(it.line_total),
      })),
      subtotal: Number(quote.subtotal),
      taxRate: Number(quote.tax_rate),
      taxAmount: Number(quote.tax_amount),
      total: Number(quote.total),
      notes: quote.notes,
      validUntil: quote.valid_until,
    })
    await sendMail({ to: quote.client_email, subject, html, text })
  } catch (e) {
    console.error("[v0] sendQuote email failed:", e instanceof Error ? e.message : e)
    return { success: false, error: "Could not send the quote email. Please try again." }
  }

  await supabase.from("quotes").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", quoteId)

  revalidatePath("/portal/invoices")
  revalidatePath("/portal/dashboard")
  return { success: true }
}
