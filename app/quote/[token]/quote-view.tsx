"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Loader2,
  Lock,
  Download,
  ShieldCheck,
  PenLine,
  CalendarDays,
  CreditCard,
  Clock,
  MapPin,
} from "lucide-react"
import { approveQuote, createQuoteCheckout, confirmQuotePayment } from "./actions"

type Item = {
  id: string
  name: string
  description: string | null
  quantity: number
  unit_price: number
  line_total: number
  item_type: string
}

type Quote = {
  quote_number: string
  client_name: string
  client_email: string
  event_name: string | null
  event_date: string | null
  event_start_time: string | null
  event_end_time: string | null
  event_address: string | null
  status: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  deposit_total: number
  deposit_required: boolean
  labor_total: number
  amount_paid: number
  invoice_number: string | null
  stripe_invoice_url: string | null
  approved_by_name: string | null
  approved_at: string | null
  paid_at: string | null
  notes: string | null
  valid_until: string | null
  created_at: string
}

const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)
const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }) : ""
const fmtTime = (t: string | null) => {
  const m = /^(\d{1,2}):(\d{2})/.exec((t ?? "").trim())
  if (!m) return ""
  let h = Number(m[1])
  const period = h >= 12 ? "PM" : "AM"
  h = h % 12 || 12
  return `${h}:${m[2]} ${period}`
}
const fmtTimeRange = (start: string | null, end: string | null) => {
  const s = fmtTime(start)
  if (!s) return ""
  const e = fmtTime(end)
  return e ? `${s}–${e}` : s
}

export function QuoteView({
  token,
  sessionId,
  canceled,
  quote: initialQuote,
  items,
}: {
  token: string
  sessionId: string | null
  canceled: boolean
  quote: Quote
  items: Item[]
}) {
  const router = useRouter()
  const [quote, setQuote] = useState(initialQuote)
  const [signature, setSignature] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [approvePending, startApprove] = useTransition()
  const [payPending, setPayPending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const confirmedRef = useRef(false)

  const isPaid = quote.status === "paid" || quote.status === "invoiced"
  const isApproved = quote.status === "approved" || isPaid
  const amountDue = quote.deposit_required ? quote.total + quote.deposit_total : quote.total

  // On return from Stripe, verify + convert to invoice.
  useEffect(() => {
    if (!sessionId || isPaid || confirmedRef.current) return
    confirmedRef.current = true
    setConfirming(true)
    confirmQuotePayment(token, sessionId).then((res) => {
      setConfirming(false)
      if (res.success) {
        setQuote((q) => ({ ...q, status: "paid" }))
        router.replace(`/quote/${token}`)
        router.refresh()
      } else {
        setError(res.error ?? "We could not verify your payment.")
      }
    })
  }, [sessionId, isPaid, token, router])

  const handleApprove = () => {
    setError(null)
    startApprove(async () => {
      const res = await approveQuote(token, signature)
      if (res.success) {
        setQuote((q) => ({
          ...q,
          status: q.status === "paid" ? q.status : "approved",
          approved_by_name: signature.trim(),
          approved_at: new Date().toISOString(),
        }))
      } else {
        setError(res.error ?? "Could not record your approval.")
      }
    })
  }

  const handlePay = async () => {
    setError(null)
    setPayPending(true)
    const res = await createQuoteCheckout(token)
    if (res.success && res.url) {
      window.location.href = res.url
    } else {
      setError(res.error ?? "Could not start checkout.")
      setPayPending(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 py-6 md:py-12">
      <div className="mx-auto w-full max-w-3xl px-4">
        {/* Status ribbon */}
        {isPaid ? (
          <Banner tone="green" icon={<Check className="h-4 w-4" />}>
            Paid on {fmtDate(quote.paid_at)}
            {quote.invoice_number ? ` · Invoice ${quote.invoice_number}` : ""}
          </Banner>
        ) : isApproved ? (
          <Banner tone="purple" icon={<PenLine className="h-4 w-4" />}>
            Approved{quote.approved_by_name ? ` by ${quote.approved_by_name}` : ""} — complete payment below to confirm
          </Banner>
        ) : canceled ? (
          <Banner tone="amber" icon={<CreditCard className="h-4 w-4" />}>
            Checkout canceled — you can pick up where you left off whenever you&apos;re ready.
          </Banner>
        ) : null}

        {confirming && (
          <Banner tone="purple" icon={<Loader2 className="h-4 w-4 animate-spin" />}>
            Confirming your payment…
          </Banner>
        )}

        {/* Document */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-300/50 ring-1 ring-slate-200">
          {/* Letterhead */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <img
                src="/images/vivid-events-logo.png"
                alt="Vivid Events — Audio, Video, Lighting, Production"
                className="h-12 w-auto md:h-14"
              />
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {isPaid ? "Invoice" : "Quotation"}
              </p>
              <p className="font-mono text-sm font-semibold text-white">
                {isPaid && quote.invoice_number ? quote.invoice_number : quote.quote_number}
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {/* Greeting */}
            <div className="mb-6">
              <h1 className="text-pretty text-2xl font-bold text-slate-900">
                {isPaid ? "Thank you, " : "Hi "}
                {quote.client_name.split(" ")[0]}
                {isPaid ? "!" : ","}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {isPaid
                  ? "Your payment is confirmed and your booking is locked in. A paid invoice has been emailed to you."
                  : "Here is your quotation for review. When you're happy, add your signature to approve and pay securely below."}
              </p>
            </div>

            {/* Meta */}
            <div className="mb-6 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
              <Meta label="Event">{quote.event_name || "—"}</Meta>
              <Meta label="Event date" icon={<CalendarDays className="h-3.5 w-3.5" />}>
                {quote.event_date ? fmtDate(quote.event_date) : "TBD"}
              </Meta>
              <Meta label="Time" icon={<Clock className="h-3.5 w-3.5" />}>
                {fmtTimeRange(quote.event_start_time, quote.event_end_time) || "TBD"}
              </Meta>
              <Meta label="Location" icon={<MapPin className="h-3.5 w-3.5" />}>
                {quote.event_address || "TBD"}
              </Meta>
              <Meta label="Prepared for">{quote.client_email}</Meta>
            </div>

            {/* Line items */}
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2.5 font-semibold">Item</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Qty</th>
                    <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">Rate</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          {it.name}
                          {it.item_type === "labor" && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                              Staff
                            </span>
                          )}
                        </div>
                        {it.description && <p className="mt-0.5 text-xs text-slate-500">{it.description}</p>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                        {it.item_type === "labor" ? `${it.quantity} hr` : it.quantity}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-right text-slate-600 sm:table-cell">
                        {money(it.unit_price)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                        {money(it.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-5 ml-auto w-full max-w-xs space-y-2 text-sm">
              <Row label="Subtotal" value={money(quote.subtotal)} />
              <Row label={`Tax (${(quote.tax_rate * 100).toFixed(0)}%)`} value={money(quote.tax_amount)} />
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                <span>{isPaid ? "Total" : "Quote total"}</span>
                <span style={{ color: "#8c52ff" }}>{money(quote.total)}</span>
              </div>
              {quote.deposit_required && quote.deposit_total > 0 && (
                <>
                  <Row
                    label="Refundable deposit"
                    value={money(quote.deposit_total)}
                    hint="Returned after gear is back"
                  />
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold">
                    <span className="text-slate-900">{isPaid ? "Amount paid" : "Due today"}</span>
                    <span className={isPaid ? "text-emerald-600" : "text-slate-900"}>{money(amountDue)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Deposit explainer */}
            {quote.deposit_required && quote.deposit_total > 0 && !isPaid && (
              <div className="mt-6 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#8c52ff]" />
                <p className="text-xs leading-relaxed text-slate-600">
                  Because this is an equipment-only rental, a{" "}
                  <span className="font-semibold text-slate-800">refundable security deposit</span> of{" "}
                  {money(quote.deposit_total)} is collected up front. It&apos;s returned in full within 3 business days
                  of the equipment being returned undamaged.
                </p>
              </div>
            )}

            {quote.notes && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{quote.notes}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Action area */}
            {!isPaid && (
              <div className="mt-8 rounded-2xl border-2 border-dashed border-slate-200 p-5 md:p-6">
                {!isApproved ? (
                  <>
                    <div className="mb-4 flex items-center gap-2">
                      <PenLine className="h-4 w-4 text-[#8c52ff]" />
                      <h2 className="text-sm font-bold text-slate-900">Approve this quote</h2>
                    </div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                      Type your full name to sign
                    </label>
                    <input
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="e.g. Jordan Alvarez"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-lg text-slate-900 outline-none transition-colors focus:border-[#8c52ff] focus:ring-2 focus:ring-[#8c52ff]/20"
                      style={{ fontFamily: "cursive" }}
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      By signing, you agree to the services and pricing in this quotation.
                    </p>
                    <button
                      onClick={handleApprove}
                      disabled={approvePending || signature.trim().length < 2}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: "#8c52ff" }}
                    >
                      {approvePending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Approve &amp; sign
                    </button>
                  </>
                ) : (
                  <div className="mb-1 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <Check className="h-4 w-4" />
                    Signed by {quote.approved_by_name}. One last step — payment below.
                  </div>
                )}

                <button
                  onClick={handlePay}
                  disabled={payPending || !isApproved}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {payPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Pay {money(amountDue)} securely
                </button>
                {!isApproved && (
                  <p className="mt-2 text-center text-xs text-slate-400">Sign above to enable payment</p>
                )}
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <Lock className="h-3 w-3" />
                  Secure payment powered by Stripe
                </div>
              </div>
            )}

            {/* Paid state actions */}
            {isPaid && quote.stripe_invoice_url && (
              <a
                href={quote.stripe_invoice_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                View your payment receipt
              </a>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Questions? Just reply to the email we sent — we&apos;re happy to help.
        </p>
      </div>
    </main>
  )
}

function Banner({
  tone,
  icon,
  children,
}: {
  tone: "green" | "purple" | "amber"
  icon: React.ReactNode
  children: React.ReactNode
}) {
  const tones = {
    green: "bg-emerald-600 text-white",
    purple: "bg-[#8c52ff] text-white",
    amber: "bg-amber-500 text-white",
  }
  return (
    <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${tones[tone]}`}>
      {icon}
      <span>{children}</span>
    </div>
  )
}

function Meta({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-medium text-slate-900">{children}</p>
    </div>
  )
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>
        {label}
        {hint && <span className="ml-1 text-xs text-slate-400">({hint})</span>}
      </span>
      <span className="text-slate-900">{value}</span>
    </div>
  )
}
