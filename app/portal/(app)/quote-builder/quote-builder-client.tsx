"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Send, Loader2, Check, Search, X, ShieldCheck, FileText } from "lucide-react"
import type { ServiceItem, ItemType, ClientRecord } from "@/app/portal/quote-actions"
import { saveQuote, sendQuote } from "@/app/portal/quote-actions"
import { PortalDatePicker } from "@/components/portal/portal-date-picker"

/** Today's date at local midnight, used to disable past dates and anchor defaults. */
function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** `yyyy-mm-dd` for a date N days from now (local time). */
function isoDaysFromNow(days: number): string {
  const d = startOfToday()
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

type Line = {
  key: string
  service_item_id: string | null
  name: string
  description: string | null
  unit_price: number
  quantity: number
  item_type: ItemType
  deposit_amount: number
}

const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

let keySeq = 0
const newKey = () => `line-${keySeq++}`

export function QuoteBuilderClient({
  catalog,
  clients = [],
  prefill,
}: {
  catalog: ServiceItem[]
  clients?: ClientRecord[]
  prefill?: { name: string; email: string; event: string }
}) {
  const router = useRouter()

  // If we arrive prefilled from a client's card, preselect them in the picker.
  const initialClientId =
    clients.find((c) => c.email.toLowerCase() === (prefill?.email ?? "").toLowerCase())?.id ?? ""

  const [selectedClientId, setSelectedClientId] = useState(initialClientId)
  const [clientName, setClientName] = useState(prefill?.name ?? "")
  const [clientEmail, setClientEmail] = useState(prefill?.email ?? "")
  const [clientPhone, setClientPhone] = useState("")
  const [company, setCompany] = useState("")
  const [eventName, setEventName] = useState(prefill?.event ?? "")
  const [eventDate, setEventDate] = useState("")
  const [eventStartTime, setEventStartTime] = useState("")
  const [eventEndTime, setEventEndTime] = useState("")
  const [eventAddress, setEventAddress] = useState("")
  // Quotes expire 30 days from creation by default (owner can still adjust).
  const [validUntil, setValidUntil] = useState(() => isoDaysFromNow(30))
  const [notes, setNotes] = useState("")
  const [taxRatePct, setTaxRatePct] = useState(5)

  const [lines, setLines] = useState<Line[]>([])
  const [catalogQuery, setCatalogQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("All")

  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedQuote, setSavedQuote] = useState<{ id: string; number: string } | null>(null)
  const [sentOk, setSentOk] = useState(false)
  const [draftedOk, setDraftedOk] = useState(false)

  const categories = useMemo(() => ["All", ...Array.from(new Set(catalog.map((c) => c.category)))], [catalog])

  const filteredCatalog = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase()
    return catalog.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory
      const matchesQuery =
        !q || item.name.toLowerCase().includes(q) || (item.description ?? "").toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [catalog, catalogQuery, activeCategory])

  const addCatalogItem = (item: ServiceItem) => {
    setSavedQuote(null)
    setSentOk(false)
    setDraftedOk(false)
    setLines((prev) => {
      const existing = prev.find((l) => l.service_item_id === item.id)
      if (existing) {
        return prev.map((l) => (l.service_item_id === item.id ? { ...l, quantity: l.quantity + 1 } : l))
      }
      return [
        ...prev,
        {
          key: newKey(),
          service_item_id: item.id,
          name: item.name,
          description: item.description,
          unit_price: Number(item.unit_price),
          quantity: 1,
          item_type: item.item_type ?? "equipment",
          deposit_amount: Number(item.deposit_amount ?? 0),
        },
      ]
    })
  }

  const addCustomLine = () => {
    setSavedQuote(null)
    setLines((prev) => [
      ...prev,
      {
        key: newKey(),
        service_item_id: null,
        name: "",
        description: null,
        unit_price: 0,
        quantity: 1,
        item_type: "equipment",
        deposit_amount: 0,
      },
    ])
  }

  const updateLine = (key: string, patch: Partial<Line>) => {
    setSavedQuote(null)
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key))

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + Math.max(0, l.quantity) * Math.max(0, l.unit_price), 0),
    [lines],
  )
  const laborTotal = useMemo(
    () =>
      lines
        .filter((l) => l.item_type === "labor")
        .reduce((sum, l) => sum + Math.max(0, l.quantity) * Math.max(0, l.unit_price), 0),
    [lines],
  )
  const depositTotal = useMemo(
    () =>
      lines
        .filter((l) => l.item_type === "equipment")
        .reduce((sum, l) => sum + Math.max(0, l.quantity) * Math.max(0, l.deposit_amount), 0),
    [lines],
  )
  const taxAmount = useMemo(() => subtotal * (taxRatePct / 100), [subtotal, taxRatePct])
  const total = subtotal + taxAmount

  // Equipment-only jobs (no on-site labour) auto-require a deposit; owner can override.
  const [depositOverride, setDepositOverride] = useState<boolean | null>(null)
  const autoDepositRequired = laborTotal === 0 && depositTotal > 0
  const depositRequired = depositOverride ?? autoDepositRequired

  // Owner may override the required deposit total independently of the summed
  // per-line Deposit $ values. Empty string = "use the auto-summed amount".
  const [depositAmountInput, setDepositAmountInput] = useState<string>("")
  const requiredDeposit =
    depositAmountInput.trim() !== "" && Number.isFinite(Number(depositAmountInput))
      ? Math.max(0, Number(depositAmountInput))
      : depositTotal

  // Pick an existing client from the dropdown → populate all contact fields.
  const selectClient = (id: string) => {
    setSelectedClientId(id)
    setSavedQuote(null)
    setSentOk(false)
    setDraftedOk(false)
    if (!id) return
    const c = clients.find((cl) => cl.id === id)
    if (!c) return
    setClientName(c.name)
    setClientEmail(c.email)
    setClientPhone(c.phone ?? "")
    setCompany(c.company ?? "")
  }

  // If the owner edits a field by hand, detach from the selected client.
  const clearSelectionOnEdit = () => {
    if (selectedClientId) setSelectedClientId("")
  }

  const buildInput = () => ({
    client_name: clientName,
    client_email: clientEmail,
    client_phone: clientPhone || null,
    company: company || null,
    event_name: eventName || null,
    event_date: eventDate || null,
    event_start_time: eventStartTime || null,
    event_end_time: eventEndTime || null,
    event_address: eventAddress || null,
    valid_until: validUntil || null,
    notes: notes || null,
    tax_rate: taxRatePct / 100,
    deposit_required: depositRequired,
    // Send the manual override only when the owner typed one; otherwise the
    // server falls back to the summed per-line deposits.
    deposit_required_amount:
      depositAmountInput.trim() !== "" && Number.isFinite(Number(depositAmountInput))
        ? Math.max(0, Number(depositAmountInput))
        : null,
    items: lines.map((l) => ({
      service_item_id: l.service_item_id,
      name: l.name,
      description: l.description,
      unit_price: l.unit_price,
      quantity: l.quantity,
      item_type: l.item_type,
      deposit_amount: l.deposit_amount,
    })),
  })

  // Ensure the quote is persisted, returning its id (or null on failure).
  const ensureSaved = async (): Promise<string | null> => {
    if (savedQuote?.id) return savedQuote.id
    const result = await saveQuote(buildInput())
    if (!result.success || !result.quoteId || !result.quoteNumber) {
      setError(result.error ?? "Could not save the quote.")
      return null
    }
    setSavedQuote({ id: result.quoteId, number: result.quoteNumber })
    return result.quoteId
  }

  // Send the quote + PDF straight to the client from the business inbox.
  const handleSend = async () => {
    setError(null)
    setDraftedOk(false)
    setSending(true)
    const quoteId = await ensureSaved()
    if (!quoteId) {
      setSending(false)
      return
    }
    const result = await sendQuote(quoteId, "send")
    setSending(false)
    if (result.success) {
      setSentOk(true)
      router.refresh()
    } else {
      setError(result.error ?? "Could not send the quote.")
    }
  }

  // Save the quote + PDF as an editable draft in the owner's Gmail.
  const handleDraft = async () => {
    setError(null)
    setSentOk(false)
    setDrafting(true)
    const quoteId = await ensureSaved()
    if (!quoteId) {
      setDrafting(false)
      return
    }
    const result = await sendQuote(quoteId, "draft")
    setDrafting(false)
    if (result.success) {
      setDraftedOk(true)
      router.refresh()
    } else {
      setError(result.error ?? "Could not create the Gmail draft.")
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#8c52ff] focus:outline-none"
  const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400"

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      {/* Left: builder */}
      <div className="space-y-6">
        {/* Client + event */}
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Client &amp; Event</h2>
          {clients.length > 0 && (
            <div className="mb-4">
              <label className={labelClass}>Select an existing client</label>
              <select
                className={inputClass}
                value={selectedClientId}
                onChange={(e) => selectClient(e.target.value)}
              >
                <option value="">— New client (enter details below) —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` · ${c.company}` : ""} — {c.email}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Choosing a client fills in their contact details automatically.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Client name *</label>
              <input className={inputClass} value={clientName} onChange={(e) => { setClientName(e.target.value); clearSelectionOnEdit() }} placeholder="Jane Doe" />
            </div>
            <div>
              <label className={labelClass}>Client email *</label>
              <input className={inputClass} type="email" value={clientEmail} onChange={(e) => { setClientEmail(e.target.value); clearSelectionOnEdit() }} placeholder="jane@company.com" />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={clientPhone} onChange={(e) => { setClientPhone(e.target.value); clearSelectionOnEdit() }} placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className={labelClass}>Company</label>
              <input className={inputClass} value={company} onChange={(e) => { setCompany(e.target.value); clearSelectionOnEdit() }} placeholder="Company Inc." />
            </div>
            <div>
              <label className={labelClass}>Event name</label>
              <input className={inputClass} value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Annual Gala" />
            </div>
            <div>
              <label className={labelClass}>Event date</label>
              <PortalDatePicker
                value={eventDate}
                onChange={setEventDate}
                placeholder="Pick the event date"
                fromDate={startOfToday()}
                clearable
              />
            </div>
            <div>
              <label className={labelClass}>Start time</label>
              <input
                type="time"
                className={`${inputClass} [color-scheme:dark]`}
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>End time</label>
              <input
                type="time"
                className={`${inputClass} [color-scheme:dark] disabled:opacity-50`}
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                disabled={!eventStartTime}
                title={eventStartTime ? undefined : "Set a start time first"}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Event address</label>
              <input
                className={inputClass}
                value={eventAddress}
                onChange={(e) => setEventAddress(e.target.value)}
                placeholder="123 Main St, Calgary, AB"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            The start time drives how the booking is blocked out on your calendar. Time and address are shared with the
            client on the quote and in their booking confirmation.
          </p>
        </section>

        {/* Catalog */}
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white">Add Services</h2>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="w-48 rounded-lg border border-slate-700 bg-slate-900/60 py-1.5 pl-8 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-[#8c52ff] focus:outline-none"
                value={catalogQuery}
                onChange={(e) => setCatalogQuery(e.target.value)}
                placeholder="Search catalog"
              />
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeCategory === cat ? "bg-[#8c52ff] text-white" : "bg-slate-900/60 text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {filteredCatalog.map((item) => (
              <button
                key={item.id}
                onClick={() => addCatalogItem(item)}
                className="group flex items-start justify-between gap-3 rounded-lg border border-slate-700/60 bg-slate-900/40 p-3 text-left transition-colors hover:border-[#8c52ff]/60 hover:bg-slate-900/70"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white">{item.name}</span>
                  <span className="block text-xs text-slate-500">
                    {money(Number(item.unit_price))} / {item.unit}
                  </span>
                </span>
                <span className="mt-0.5 shrink-0 rounded-md bg-slate-800 p-1 text-slate-400 transition-colors group-hover:bg-[#8c52ff] group-hover:text-white">
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            ))}
            {filteredCatalog.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-slate-500">No catalog items match your search.</p>
            )}
          </div>

          <button
            onClick={addCustomLine}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-[#8c52ff]"
          >
            <Plus className="h-3.5 w-3.5" /> Add custom line item
          </button>
        </section>

        {/* Line items */}
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Line Items</h2>
          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Select services above to start building this quote.
            </p>
          ) : (
            <div className="space-y-2">
              {lines.map((line) => (
                <div key={line.key} className="grid grid-cols-[1fr_auto] items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
                  <div className="min-w-0 space-y-2">
                    <input
                      className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-white placeholder:text-slate-500 focus:border-slate-700 focus:bg-slate-900/60 focus:outline-none"
                      value={line.name}
                      onChange={(e) => updateLine(line.key, { name: e.target.value })}
                      placeholder="Item name"
                    />
                    <input
                      className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-xs text-slate-400 placeholder:text-slate-600 focus:border-slate-700 focus:bg-slate-900/60 focus:outline-none"
                      value={line.description ?? ""}
                      onChange={(e) => updateLine(line.key, { description: e.target.value })}
                      placeholder="Description (optional)"
                    />
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <label className="flex items-center gap-1.5 text-xs text-slate-500">
                        Type
                        <select
                          className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-sm text-white focus:border-[#8c52ff] focus:outline-none"
                          value={line.item_type}
                          onChange={(e) =>
                            updateLine(line.key, {
                              item_type: e.target.value as ItemType,
                              deposit_amount: e.target.value === "equipment" ? line.deposit_amount : 0,
                            })
                          }
                        >
                          <option value="equipment">Equipment</option>
                          <option value="labor">Labour</option>
                          <option value="service">Service</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-500">
                        {line.item_type === "labor" ? "Hrs" : "Qty"}
                        <input
                          type="number"
                          min={0}
                          step={line.item_type === "labor" ? "0.5" : "1"}
                          className="w-16 rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-sm text-white focus:border-[#8c52ff] focus:outline-none"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) })}
                        />
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-500">
                        {line.item_type === "labor" ? "$/hr" : "Unit $"}
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className="w-24 rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-sm text-white focus:border-[#8c52ff] focus:outline-none"
                          value={line.unit_price}
                          onChange={(e) => updateLine(line.key, { unit_price: Number(e.target.value) })}
                        />
                      </label>
                      {line.item_type === "equipment" && (
                        <label className="flex items-center gap-1.5 text-xs text-slate-500">
                          Deposit $
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="w-24 rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-sm text-white focus:border-[#8c52ff] focus:outline-none"
                            value={line.deposit_amount}
                            onChange={(e) => updateLine(line.key, { deposit_amount: Number(e.target.value) })}
                          />
                        </label>
                      )}
                      <span className="ml-auto text-sm font-semibold text-white">
                        {money(Math.max(0, line.quantity) * Math.max(0, line.unit_price))}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeLine(line.key)}
                    className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Remove line item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Notes */}
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Notes &amp; Terms</h2>
          <textarea
            className={`${inputClass} min-h-24 resize-y`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Delivery details, setup times, payment terms…"
          />
        </section>
      </div>

      {/* Right: summary */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-4 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
          <h2 className="text-sm font-semibold text-white">Summary</h2>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="text-white">{money(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <label className="flex items-center gap-1.5">
                Tax
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  className="w-14 rounded-md border border-slate-700 bg-slate-900/60 px-1.5 py-0.5 text-xs text-white focus:border-[#8c52ff] focus:outline-none"
                  value={taxRatePct}
                  onChange={(e) => setTaxRatePct(Number(e.target.value))}
                />
                %
              </label>
              <span className="text-white">{money(taxAmount)}</span>
            </div>
            {laborTotal > 0 && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Labour included</span>
                <span className="text-slate-300">{money(laborTotal)}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-slate-700 pt-3 text-base font-semibold">
              <span className="text-white">Total</span>
              <span style={{ color: "#8c52ff" }}>{money(total)}</span>
            </div>
          </div>

          {/* Security deposit control */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={depositRequired}
                onChange={(e) => setDepositOverride(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#8c52ff]"
              />
              <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-[#c4a7ff]" />
                Require security deposit
              </span>
            </label>

            {depositRequired && (
              <div className="mt-3 space-y-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Required deposit amount
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={depositAmountInput}
                      onChange={(e) => setDepositAmountInput(e.target.value)}
                      placeholder={depositTotal.toFixed(2)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/60 py-2 pl-7 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-[#8c52ff] focus:outline-none"
                    />
                  </div>
                </label>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {depositAmountInput.trim() !== ""
                      ? "Manual override"
                      : `Auto from line items · ${money(depositTotal)}`}
                  </span>
                  {depositAmountInput.trim() !== "" && (
                    <button
                      type="button"
                      onClick={() => setDepositAmountInput("")}
                      className="font-medium text-[#c4a7ff] hover:text-white"
                    >
                      Reset to {money(depositTotal)}
                    </button>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-slate-500">
                  Charged up front with the quote as a refundable hold of{" "}
                  <span className="font-semibold text-[#c4a7ff]">{money(requiredDeposit)}</span>, then returned via
                  Stripe after the event once all gear is back.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Valid until</label>
            <PortalDatePicker
              value={validUntil}
              onChange={setValidUntil}
              placeholder="Quote expiry date"
              fromDate={startOfToday()}
            />
            <p className="mt-1 text-xs text-slate-500">Defaults to 30 days from today.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {savedQuote && !sentOk && !draftedOk && (
            <p className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-xs text-slate-300">
              Saved as <span className="font-semibold text-white">{savedQuote.number}</span>. Send it to the client or
              save a Gmail draft below.
            </p>
          )}

          {sentOk && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              <Check className="h-4 w-4 shrink-0" />
              Quote {savedQuote?.number} sent to {clientEmail}.
            </div>
          )}

          {draftedOk && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              <Check className="h-4 w-4 shrink-0" />
              Draft for {savedQuote?.number} saved to your Gmail — review and send it to {clientEmail} from Gmail.
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              onClick={handleSend}
              disabled={sending || drafting}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: "linear-gradient(to right, #8c52ff, #6b3acc)" }}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending…" : "Send to Client"}
            </button>
            <button
              onClick={handleDraft}
              disabled={drafting || sending}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {drafting ? "Saving draft…" : "Save as Draft (Gmail)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
