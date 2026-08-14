"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, Loader2, Check, FileText, Link2, ExternalLink, Trash2, ShieldCheck, RotateCcw } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { sendQuote, deleteQuote, refundDeposit } from "@/app/portal/quote-actions"
import type { QuoteRecord } from "@/app/portal/quote-actions"

/** Effective refundable deposit: owner override when set, otherwise summed per-line deposits. */
const depositAmountOf = (q: QuoteRecord) =>
  q.deposit_required_amount != null ? Number(q.deposit_required_amount) : Number(q.deposit_total ?? 0)

const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

const statusStyles: Record<string, string> = {
  draft: "bg-slate-700/60 text-slate-300",
  sent: "bg-[#8c52ff]/20 text-[#c4a7ff]",
  approved: "bg-amber-500/15 text-amber-300",
  accepted: "bg-emerald-500/15 text-emerald-300",
  paid: "bg-emerald-500/20 text-emerald-300",
  invoiced: "bg-emerald-500/20 text-emerald-300",
  declined: "bg-red-500/15 text-red-300",
}

const statusLabel: Record<string, string> = {
  paid: "Paid",
  invoiced: "Paid",
  approved: "Signed",
}

export function QuotesTable({ quotes }: { quotes: QuoteRecord[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [sentId, setSentId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<QuoteRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [refundTarget, setRefundTarget] = useState<QuoteRecord | null>(null)
  const [refunding, setRefunding] = useState(false)

  const handleRefund = async () => {
    if (!refundTarget) return
    setRefunding(true)
    setError(null)
    const result = await refundDeposit(refundTarget.id)
    setRefunding(false)
    if (result.success) {
      setRefundTarget(null)
      router.refresh()
    } else {
      setError(result.error ?? "Could not refund the deposit.")
      setRefundTarget(null)
    }
  }

  const handleSend = async (id: string) => {
    setError(null)
    setBusyId(id)
    const result = await sendQuote(id)
    setBusyId(null)
    if (result.success) {
      setSentId(id)
      router.refresh()
      setTimeout(() => setSentId(null), 4000)
    } else {
      setError(result.error ?? "Could not send the quote.")
    }
  }

  const handleCopyLink = async (token: string | null, id: string) => {
    if (!token) return
    const url = `${window.location.origin}/quote/${token}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt("Copy the customer link:", url)
    }
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setError(null)
    const result = await deleteQuote(deleteTarget.id)
    setDeleting(false)
    if (result.success) {
      setDeleteTarget(null)
      router.refresh()
    } else {
      setError(result.error ?? "Could not delete the quote.")
      setDeleteTarget(null)
    }
  }

  if (quotes.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-10 text-center">
        <FileText className="mx-auto h-8 w-8 text-slate-600" />
        <p className="mt-3 text-sm text-slate-400">No quotes yet. Build your first one in the Quote Builder.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40">
        <div className="hidden grid-cols-[110px_1fr_1fr_120px_100px_300px] gap-3 border-b border-slate-700/50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-400 md:grid">
          <span>Quote</span>
          <span>Client</span>
          <span>Event</span>
          <span className="text-right">Total</span>
          <span className="text-center">Status</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-slate-700/50">
          {quotes.map((q) => {
            const isPaid = q.status === "paid" || q.status === "invoiced"
            return (
              <div
                key={q.id}
                className="grid grid-cols-2 gap-3 px-5 py-4 text-sm md:grid-cols-[110px_1fr_1fr_120px_100px_300px] md:items-center"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-white">{q.quote_number}</span>
                  {isPaid && q.invoice_number && (
                    <span className="block truncate text-xs text-emerald-400">{q.invoice_number}</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-white">{q.client_name}</span>
                  <span className="block truncate text-xs text-slate-500">{q.client_email}</span>
                </span>
                <span className="min-w-0 truncate text-slate-400">{q.event_name ?? "—"}</span>
                <span className="font-semibold text-white md:text-right">
                  {money(Number(q.total))}
                  {q.deposit_required && Number(q.deposit_total) > 0 && (
                    <span className="block text-xs font-normal text-slate-500">
                      +{money(Number(q.deposit_total))} dep.
                    </span>
                  )}
                </span>
                <span className="md:text-center">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusStyles[q.status] ?? statusStyles.draft}`}
                  >
                    {statusLabel[q.status] ?? q.status}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-1.5 md:justify-end">
                  {q.public_token && (
                    <>
                      <button
                        onClick={() => handleCopyLink(q.public_token, q.id)}
                        title="Copy customer link"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-[#8c52ff]/60 hover:text-white"
                      >
                        {copiedId === q.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Link2 className="h-3.5 w-3.5" />
                        )}
                        {copiedId === q.id ? "Copied" : "Link"}
                      </button>
                      <a
                        href={`/quote/${q.public_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open customer view"
                        className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/60 p-1.5 text-slate-200 transition-colors hover:border-[#8c52ff]/60 hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </>
                  )}
                  {!isPaid && (
                    <button
                      onClick={() => handleSend(q.id)}
                      disabled={busyId === q.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-[#8c52ff]/60 hover:text-white disabled:opacity-60"
                    >
                      {busyId === q.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : sentId === q.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      {sentId === q.id ? "Drafted" : q.status === "draft" ? "Draft in Gmail" : "Re-draft"}
                    </button>
                  )}
                  {isPaid && q.deposit_required && depositAmountOf(q) > 0 && (
                    q.deposit_refunded_at ? (
                      <span
                        title={`Deposit of ${money(depositAmountOf(q))} returned`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Deposit returned
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setError(null)
                          setRefundTarget(q)
                        }}
                        title="Return the security deposit to the customer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#8c52ff]/40 bg-[#8c52ff]/10 px-2.5 py-1.5 text-xs font-medium text-[#c4a7ff] transition-colors hover:border-[#8c52ff]/70 hover:bg-[#8c52ff]/20 hover:text-white disabled:opacity-60"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Refund deposit
                      </button>
                    )
                  )}
                  <button
                    onClick={() => {
                      setError(null)
                      setDeleteTarget(q)
                    }}
                    title="Delete quote"
                    className="inline-flex items-center rounded-lg border border-red-500/30 bg-red-500/10 p-1.5 text-red-300 transition-colors hover:border-red-500/60 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="border-slate-700 bg-slate-900 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.quote_number}
              {deleteTarget?.invoice_number ? ` / ${deleteTarget.invoice_number}` : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This permanently removes the quote for {deleteTarget?.client_name} and all of its line items. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete quote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!refundTarget} onOpenChange={(o) => !o && setRefundTarget(null)}>
        <AlertDialogContent className="border-slate-700 bg-slate-900 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#c4a7ff]" />
              Refund the security deposit?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This returns <span className="font-semibold text-white">{refundTarget ? money(depositAmountOf(refundTarget)) : ""}</span>{" "}
              to {refundTarget?.client_name} via Stripe against their original payment for{" "}
              {refundTarget?.invoice_number ?? refundTarget?.quote_number}. Only do this once the invoice has been
              reviewed and all equipment is back. The quoted total stays collected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleRefund()
              }}
              disabled={refunding}
              className="bg-[#8c52ff] text-white hover:bg-[#7a45e6]"
            >
              {refunding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refund deposit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
