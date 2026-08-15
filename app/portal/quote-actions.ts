"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isEmailConfigured, renderQuoteEmail, renderDepositReleasedEmail, saveGmailDraft, sendMail } from "@/lib/email"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import { generateQuotePdf } from "@/lib/quote-pdf"
import { getPortalSettings } from "@/app/portal/settings-actions"

export type ItemType = "equipment" | "labor" | "service"

export type ServiceItem = {
  id: string
  category: string
  name: string
  description: string | null
  unit: string
  unit_price: number
  item_type: ItemType
  deposit_amount: number
  active: boolean
  sort_order: number
}

export type QuoteLineInput = {
  service_item_id: string | null
  name: string
  description: string | null
  unit_price: number
  quantity: number
  item_type?: ItemType
  deposit_amount?: number
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
  deposit_required?: boolean | null
  /** Owner override for the required deposit total. null = use summed per-line deposits. */
  deposit_required_amount?: number | null
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
  labor_total: number
  deposit_total: number
  deposit_required: boolean
  deposit_required_amount: number | null
  deposit_refunded_at: string | null
  deposit_refund_amount: number | null
  stripe_payment_intent_id: string | null
  amount_paid: number
  public_token: string | null
  invoice_number: string | null
  stripe_invoice_url: string | null
  approved_at: string | null
  paid_at: string | null
  notes: string | null
  valid_until: string | null
  sent_at: string | null
  created_at: string
}

const TAX_RATE = 0.05 // GST default; owner can override per quote

const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

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

/** Fetch the FULL catalog (including inactive items) for the management screen. */
export async function getAllServiceItems(): Promise<ServiceItem[]> {
  const session = await requireSession()
  if (!session) return []
  const { data, error } = await session.supabase
    .from("service_items")
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
  if (error) {
    console.error("[v0] getAllServiceItems failed:", error.message)
    return []
  }
  return (data ?? []) as ServiceItem[]
}

export type ServiceItemInput = {
  id?: string
  category: string
  name: string
  description?: string | null
  unit: string
  unit_price: number
  item_type?: ItemType
  deposit_amount?: number
  active?: boolean
}

type CatalogResult = { success: boolean; error?: string }

const ITEM_TYPES: ItemType[] = ["equipment", "labor", "service"]

function validateItem(input: ServiceItemInput): string | null {
  if (!input.category?.trim()) return "Category is required."
  if (!input.name?.trim()) return "Item name is required."
  if (!input.unit?.trim()) return "Unit is required."
  const price = Number(input.unit_price)
  if (!Number.isFinite(price) || price < 0) return "Price must be zero or greater."
  const deposit = Number(input.deposit_amount ?? 0)
  if (!Number.isFinite(deposit) || deposit < 0) return "Deposit must be zero or greater."
  if (input.item_type && !ITEM_TYPES.includes(input.item_type)) return "Invalid item type."
  return null
}

/** Create or update a catalog item. */
export async function saveServiceItem(input: ServiceItemInput): Promise<CatalogResult> {
  const session = await requireSession()
  if (!session) return { success: false, error: "You are not signed in." }

  const validationError = validateItem(input)
  if (validationError) return { success: false, error: validationError }

  const itemType: ItemType = input.item_type && ITEM_TYPES.includes(input.item_type) ? input.item_type : "equipment"
  const payload = {
    category: input.category.trim(),
    name: input.name.trim(),
    description: input.description?.trim() || null,
    unit: input.unit.trim(),
    unit_price: Math.round(Number(input.unit_price) * 100) / 100,
    item_type: itemType,
    // Only equipment can carry a security deposit.
    deposit_amount: itemType === "equipment" ? Math.round(Number(input.deposit_amount ?? 0) * 100) / 100 : 0,
    active: input.active ?? true,
  }

  const { supabase } = session
  if (input.id) {
    const { error } = await supabase.from("service_items").update(payload).eq("id", input.id)
    if (error) {
      console.error("[v0] saveServiceItem update failed:", error.message)
      return { success: false, error: "Could not update the item." }
    }
  } else {
    // Place new item at the end of its category.
    const { data: last } = await supabase
      .from("service_items")
      .select("sort_order")
      .eq("category", payload.category)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()
    const sort_order = (last?.sort_order ?? 0) + 1
    const { error } = await supabase.from("service_items").insert({ ...payload, sort_order })
    if (error) {
      console.error("[v0] saveServiceItem insert failed:", error.message)
      return { success: false, error: "Could not create the item." }
    }
  }

  revalidatePath("/portal/catalog")
  revalidatePath("/portal/quote-builder")
  return { success: true }
}

/** Toggle an item active/inactive (hidden from the quote builder when inactive). */
export async function toggleServiceItem(id: string, active: boolean): Promise<CatalogResult> {
  const session = await requireSession()
  if (!session) return { success: false, error: "You are not signed in." }
  const { error } = await session.supabase.from("service_items").update({ active }).eq("id", id)
  if (error) {
    console.error("[v0] toggleServiceItem failed:", error.message)
    return { success: false, error: "Could not update the item." }
  }
  revalidatePath("/portal/catalog")
  revalidatePath("/portal/quote-builder")
  return { success: true }
}

/** Permanently delete a catalog item. Existing quotes keep their copied line data. */
export async function deleteServiceItem(id: string): Promise<CatalogResult> {
  const session = await requireSession()
  if (!session) return { success: false, error: "You are not signed in." }
  const { error } = await session.supabase.from("service_items").delete().eq("id", id)
  if (error) {
    console.error("[v0] deleteServiceItem failed:", error.message)
    return { success: false, error: "Could not delete the item." }
  }
  revalidatePath("/portal/catalog")
  revalidatePath("/portal/quote-builder")
  return { success: true }
}

function computeTotals(items: QuoteLineInput[], taxRate: number) {
  const cleanItems = items
    .filter((it) => it.name.trim() && Number(it.quantity) > 0)
    .map((it) => {
      const quantity = Math.max(0, Number(it.quantity) || 0)
      const unitPrice = Math.max(0, Number(it.unit_price) || 0)
      const itemType: ItemType = ITEM_TYPES.includes(it.item_type as ItemType)
        ? (it.item_type as ItemType)
        : "equipment"
      const depositEach = itemType === "equipment" ? Math.max(0, Number(it.deposit_amount) || 0) : 0
      return {
        ...it,
        item_type: itemType,
        quantity,
        unit_price: unitPrice,
        deposit_amount: depositEach,
        line_total: Math.round(quantity * unitPrice * 100) / 100,
        deposit_line_total: Math.round(quantity * depositEach * 100) / 100,
      }
    })
  const subtotal = Math.round(cleanItems.reduce((sum, it) => sum + it.line_total, 0) * 100) / 100
  const laborTotal =
    Math.round(cleanItems.filter((it) => it.item_type === "labor").reduce((s, it) => s + it.line_total, 0) * 100) / 100
  const depositTotal = Math.round(cleanItems.reduce((sum, it) => sum + it.deposit_line_total, 0) * 100) / 100
  const rate = Number.isFinite(taxRate) && taxRate >= 0 && taxRate <= 1 ? taxRate : TAX_RATE
  const taxAmount = Math.round(subtotal * rate * 100) / 100
  const total = Math.round((subtotal + taxAmount) * 100) / 100
  return { cleanItems, subtotal, laborTotal, depositTotal, rate, taxAmount, total }
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

  const { cleanItems, subtotal, laborTotal, depositTotal, rate, taxAmount, total } = computeTotals(
    input.items,
    input.tax_rate,
  )
  if (cleanItems.length === 0) {
    return { success: false, error: "Add at least one line item to the quote." }
  }

  // Equipment-only rentals (no on-site labour) require a refundable security
  // deposit to protect the gear. The owner can override this per quote.
  const depositRequired = input.deposit_required ?? (laborTotal === 0 && depositTotal > 0)

  // Owner may override the required deposit total. When provided (>= 0) it wins
  // over the summed per-line deposits; null means "use the summed amount".
  const overrideAmount = input.deposit_required_amount
  const depositRequiredAmount =
    overrideAmount != null && Number.isFinite(Number(overrideAmount)) && Number(overrideAmount) >= 0
      ? Math.round(Number(overrideAmount) * 100) / 100
      : null

  // Quotes always expire 30 days from now unless an explicit date is provided.
  const validUntil = input.valid_until || (() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })()

  const publicToken = crypto.randomUUID().replace(/-/g, "")

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
      labor_total: laborTotal,
      deposit_total: depositTotal,
      deposit_required: depositRequired,
      deposit_required_amount: depositRequiredAmount,
      public_token: publicToken,
      notes: input.notes?.trim() || null,
      valid_until: validUntil,
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
    item_type: it.item_type,
    deposit_amount: it.deposit_amount,
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

/** Resolve the public origin so review links in the email point at the live app. */
async function getBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "https"
  if (host) return `${proto}://${host}`
  return "http://localhost:3000"
}

const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] || name

/**
 * Deliver a saved quote to the customer: a person-typed note with the branded
 * quotation PDF attached and a secure link to review, approve and pay online.
 *
 * mode "send"  → email is sent straight to the client from the business inbox.
 * mode "draft" → email + PDF are saved to the owner's Gmail Drafts to review
 *                and send by hand.
 */
export async function sendQuote(
  quoteId: string,
  mode: "send" | "draft" = "send",
): Promise<{ success: boolean; error?: string }> {
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

  // Ensure a public token exists (older quotes may predate this column).
  let publicToken: string = quote.public_token
  if (!publicToken) {
    publicToken = crypto.randomUUID().replace(/-/g, "")
    await supabase.from("quotes").update({ public_token: publicToken }).eq("id", quoteId)
  }

  const { data: items } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("sort_order", { ascending: true })

  const baseUrl = await getBaseUrl()
  const reviewUrl = `${baseUrl}/quote/${publicToken}`
  // Effective deposit = owner override when set, otherwise the summed per-line deposits.
  const depositTotal =
    quote.deposit_required_amount != null
      ? Number(quote.deposit_required_amount)
      : Number(quote.deposit_total ?? 0)
  const depositRequired = Boolean(quote.deposit_required)
  const total = Number(quote.total)
  const amountDue = depositRequired ? Math.round((total + depositTotal) * 100) / 100 : total

  try {
    const pdf = await generateQuotePdf({
      kind: "quote",
      number: quote.quote_number,
      issuedDate: new Date(quote.created_at ?? Date.now()).toLocaleDateString("en-CA"),
      clientName: quote.client_name,
      clientEmail: quote.client_email,
      eventName: quote.event_name,
      eventDate: quote.event_date,
      items: (items ?? []).map((it) => ({
        name: it.name,
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unit_price),
        lineTotal: Number(it.line_total),
        itemType: it.item_type,
      })),
      subtotal: Number(quote.subtotal),
      taxRate: Number(quote.tax_rate),
      taxAmount: Number(quote.tax_amount),
      total,
      depositTotal,
      depositRequired,
      amountDue,
      notes: quote.notes,
      validUntil: quote.valid_until,
    })

    const settings = await getPortalSettings()
    const { subject, html, text } = renderQuoteEmail(
      {
        subject: settings.quote_email_subject,
        body: settings.quote_email_body,
        signerName: settings.signer_name,
      },
      {
        first_name: firstNameOf(quote.client_name),
        event_name: quote.event_name || "your event",
        quote_number: quote.quote_number,
        review_link: reviewUrl,
        signer_name: settings.signer_name,
      },
    )
    const payload = {
      to: quote.client_email,
      subject,
      html,
      text,
      attachments: [{ filename: `Quotation-${quote.quote_number}.pdf`, content: pdf }],
    }
    if (mode === "draft") {
      // Save into the owner's Gmail Drafts (PDF attached) to review + send by hand.
      await saveGmailDraft(payload)
    } else {
      // Send straight to the client from the business inbox.
      await sendMail(payload)
    }
  } catch (e) {
    console.error(`[v0] sendQuote ${mode} failed:`, e instanceof Error ? e.message : e)
    return {
      success: false,
      error:
        mode === "draft"
          ? "Could not save the quote to your Gmail drafts. Please try again."
          : "Could not send the quote to the client. Please try again.",
    }
  }

  // Don't downgrade an already-approved/paid quote back to "sent".
  const keepStatus = ["approved", "paid", "invoiced"].includes(quote.status)
  await supabase
    .from("quotes")
    .update({ status: keepStatus ? quote.status : "sent", sent_at: new Date().toISOString() })
    .eq("id", quoteId)

  revalidatePath("/portal/invoices")
  revalidatePath("/portal/dashboard")
  return { success: true }
}

type MutationResult = { success: boolean; error?: string }

/**
 * Permanently delete a quote/invoice and its line items. quote_items are
 * removed automatically by the ON DELETE CASCADE foreign key.
 */
export async function deleteQuote(quoteId: string): Promise<MutationResult> {
  const session = await requireSession()
  if (!session) return { success: false, error: "You are not signed in." }

  const { error } = await session.supabase.from("quotes").delete().eq("id", quoteId)
  if (error) {
    console.error("[v0] deleteQuote failed:", error.message)
    return { success: false, error: "Could not delete the quote." }
  }

  revalidatePath("/portal/invoices")
  revalidatePath("/portal/dashboard")
  revalidatePath("/portal/client-list")
  return { success: true }
}

/**
 * Return the refundable security deposit to the customer after the event.
 * Issues a Stripe partial refund of the deposit amount against the original
 * payment, leaving only the quoted total collected. Idempotent and safe to
 * click once the invoice has been reviewed and all gear is back.
 */
export async function refundDeposit(quoteId: string): Promise<MutationResult> {
  const session = await requireSession()
  if (!session) return { success: false, error: "You are not signed in." }
  if (!isStripeConfigured()) return { success: false, error: "Payments are not set up yet." }

  const { supabase } = session
  const { data: quote, error } = await supabase.from("quotes").select("*").eq("id", quoteId).single()
  if (error || !quote) return { success: false, error: "Quote not found." }

  if (!quote.deposit_required) return { success: false, error: "This quote has no security deposit." }
  if (!["paid", "invoiced"].includes(quote.status) || !quote.paid_at) {
    return { success: false, error: "The deposit can only be returned after the quote is paid." }
  }
  if (quote.deposit_refunded_at) return { success: true } // already returned — idempotent
  if (!quote.stripe_payment_intent_id) {
    return { success: false, error: "No Stripe payment is linked to this quote." }
  }

  const depositAmount =
    quote.deposit_required_amount != null ? Number(quote.deposit_required_amount) : Number(quote.deposit_total ?? 0)
  if (!(depositAmount > 0)) return { success: false, error: "There is no deposit amount to refund." }

  const stripe = getStripe()
  let refundId: string
  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: quote.stripe_payment_intent_id,
        amount: Math.round(depositAmount * 100),
        metadata: { quote_id: quote.id, quote_number: quote.quote_number, kind: "security_deposit" },
      },
      // Idempotency so a double-click can't issue two refunds.
      { idempotencyKey: `deposit_refund_${quote.id}` },
    )
    refundId = refund.id
  } catch (e) {
    console.error("[v0] refundDeposit stripe failed:", e instanceof Error ? e.message : e)
    return { success: false, error: "Stripe could not process the refund. Please try again." }
  }

  const refundedAt = new Date().toISOString()
  const { error: updErr } = await supabase
    .from("quotes")
    .update({
      deposit_refunded_at: refundedAt,
      deposit_refund_amount: depositAmount,
      stripe_deposit_refund_id: refundId,
    })
    .eq("id", quote.id)

  if (updErr) {
    console.error("[v0] refundDeposit update failed:", updErr.message)
    return { success: false, error: "Refund issued, but we could not record it. Check Stripe before retrying." }
  }

  // Best-effort confirmation email to the customer using the owner's editable
  // template (refund is already issued).
  try {
    if (isEmailConfigured()) {
      const settings = await getPortalSettings()
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
    console.error("[v0] refundDeposit email failed:", e instanceof Error ? e.message : e)
  }

  revalidatePath("/portal/invoices")
  revalidatePath("/portal/dashboard")
  return { success: true }
}

export type ClientInput = {
  name: string
  email: string
  phone?: string | null
  company?: string | null
}

export type ClientRecord = {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
}

/** List all saved clients for pickers (quote builder, etc.). */
export async function getClients(): Promise<ClientRecord[]> {
  const session = await requireSession()
  if (!session) return []
  const { data, error } = await session.supabase
    .from("clients")
    .select("id, name, email, phone, company")
    .order("name", { ascending: true })
  if (error) {
    console.error("[v0] getClients failed:", error.message)
    return []
  }
  return (data ?? []) as ClientRecord[]
}

/**
 * Create a client directly (no quote required). Returns the created record so
 * callers can immediately select it. If a client with the same email already
 * exists, their details are updated instead of creating a duplicate.
 */
export async function addClient(
  input: ClientInput,
): Promise<{ success: boolean; error?: string; client?: ClientRecord }> {
  const session = await requireSession()
  if (!session) return { success: false, error: "You are not signed in." }

  const name = input.name?.trim()
  const email = input.email?.trim().toLowerCase()
  if (!name) return { success: false, error: "Client name is required." }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "A valid email is required." }
  }

  const row = {
    name,
    email,
    phone: input.phone?.trim() || null,
    company: input.company?.trim() || null,
  }

  // No unique constraint on email, so check-then-insert/update to avoid dupes.
  const { data: existing } = await session.supabase
    .from("clients")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  const query = existing
    ? session.supabase.from("clients").update(row).eq("id", existing.id)
    : session.supabase.from("clients").insert(row)

  const { data, error } = await query.select("id, name, email, phone, company").single()

  if (error) {
    console.error("[v0] addClient failed:", error.message)
    return { success: false, error: "Could not save the client." }
  }

  revalidatePath("/portal/client-list")
  revalidatePath("/portal/dashboard")
  return { success: true, client: data as ClientRecord }
}

/** Update a client's contact details. */
export async function updateClient(id: string, input: ClientInput): Promise<MutationResult> {
  const session = await requireSession()
  if (!session) return { success: false, error: "You are not signed in." }

  const name = input.name?.trim()
  const email = input.email?.trim().toLowerCase()
  if (!name) return { success: false, error: "Client name is required." }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "A valid email is required." }
  }

  const { error } = await session.supabase
    .from("clients")
    .update({
      name,
      email,
      phone: input.phone?.trim() || null,
      company: input.company?.trim() || null,
    })
    .eq("id", id)

  if (error) {
    console.error("[v0] updateClient failed:", error.message)
    return { success: false, error: "Could not update the client." }
  }

  revalidatePath("/portal/client-list")
  revalidatePath("/portal/dashboard")
  return { success: true }
}

/**
 * Delete a client. When `withPaperwork` is true, also permanently removes all
 * of their quotes and invoices (matched by client id and by email), letting the
 * owner wipe a customer back to scratch. quote_items cascade automatically.
 */
export async function deleteClient(id: string, withPaperwork = true): Promise<MutationResult> {
  const session = await requireSession()
  if (!session) return { success: false, error: "You are not signed in." }
  const { supabase } = session

  const { data: client } = await supabase.from("clients").select("email").eq("id", id).maybeSingle()

  if (withPaperwork) {
    const email = (client?.email as string | undefined)?.toLowerCase()
    // Remove quotes linked by foreign key...
    const { error: byIdError } = await supabase.from("quotes").delete().eq("client_id", id)
    if (byIdError) {
      console.error("[v0] deleteClient quotes-by-id failed:", byIdError.message)
      return { success: false, error: "Could not delete the client's quotes." }
    }
    // ...and any older quotes matched only by the stored email.
    if (email) {
      const { error: byEmailError } = await supabase.from("quotes").delete().eq("client_email", email)
      if (byEmailError) {
        console.error("[v0] deleteClient quotes-by-email failed:", byEmailError.message)
        return { success: false, error: "Could not delete the client's quotes." }
      }
    }
  }

  const { error } = await supabase.from("clients").delete().eq("id", id)
  if (error) {
    console.error("[v0] deleteClient failed:", error.message)
    return { success: false, error: "Could not delete the client." }
  }

  revalidatePath("/portal/client-list")
  revalidatePath("/portal/invoices")
  revalidatePath("/portal/dashboard")
  return { success: true }
}
