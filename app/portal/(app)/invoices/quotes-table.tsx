"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, Loader2, Check, FileText, Link2, ExternalLink, Trash2, ShieldCheck, CircleDollarSign } from "lucide-react"
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
import { sendQuote, deleteQuote, captureRental } from "@/app/portal/quote-actions"
import type { QuoteRecord } from "@/app/portal/quote-actions"
import { isAuthorized, isCollected, isSecured } from "@/lib/quote-status"

/** Effective refundable deposit: owner override when set, otherwise summed per-line deposits. */
const depositAmountOf = (q: QuoteRecord) =>
  q.deposit_required_amount != null ? Number(q.deposit_required_amount) : Number(q.deposit_total ?? 0)

const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

const statusStyles: Record<string, string> = {
  draft: "bg-slate-700/60 text-slate-300",
  sent: "bg-[#8c52ff]/20 text-[#c4a7ff]",
  approved: "bg-amber-500/15 text-amber-300",
  accepted: "bg-emerald-500/15 text-emerald-300",
  authorized: "bg-sky-500/15 text-sky-300",
  completed_and_captured: "bg-emerald-500/20 text-emerald-300",
  paid: "bg-emerald-500/20 text-emerald-300",
  invoiced: "bg-emerald-500/20 text-emerald-300",
  declined: "bg-red-500/15 text-red-300",
}

const statusLabel: Record<string, string> = {
  authorized: "Hold placed",
  completed_and_captured: "Completed",
  paid: "Paid",
  invoiced: "Paid",
  approved: "Signed",
}

export function QuotesTable({ quotes }: { quotes: QuoteRecord[] }) {
  const router = useRouter()
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [doneKey, setDoneKey] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<QuoteRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Capture / completion dialog state.
  const [captureTarget, setCaptureTarget] = useState<QuoteRecord | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [keepDeposit, setKeepDeposit] = useState(false)
  const [keepAmount, setKeepAmount] = useState<string>("")

  const openCapture = (q: QuoteRecord) => {
    setError(null)
    setKeepDeposit(false)
    setKeepAmount(String(depositAmountOf(q)))
    setCaptureTarget(q)
  }

  const handleCapture = async () => {
    if (!captureTarget) return
    setCapturing(true)
    setError(null)
    const deposit = depositAmountOf(captureTarget)
    const parsed = Number.parseFloat(keepAmount)
    const depositCaptureAmount = keepDeposit
      ? Number.isFinite(parsed)
        ? Math.max(0, Math.min(parsed, deposit))
        : deposit
      : 0
    const result = await captureRental(captureTarget.id, { depositCaptureAmount })
    setCapturing(false)
    if (result.success) {
      setCaptureTarget(null)
      router.refresh()
    } else {
      setError(result.error ?? "Could not complete the rental.")
      setCaptureTarget(null)
    }
  }

  const handleSend = async (id: string, mode: "send" | "draft") => {
    setError(null)
    setBusyKey(`${mode}:${id}`)
    const result = await sendQuote(id, mode)
    setBusyKey(null)
    if (result.success) {
      setDoneKey(`${mode}:${id}`)
      router.refresh()
      setTimeout(() => setDoneKey(null), 4000)
    } else {
      setError(result.error ?? (mode === "send" ? "Could not send the quote." : "Could not create the Gmail draft."))
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

  const captureDeposit = captureTarget ? depositAmountOf(captureTarget) : 0

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40">
        <div className="hidden grid-cols-[110px_1fr_1fr_120px_110px_300px] gap-3 border-b border-slate-700/50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-400 md:grid">
          <span>Quote</span>
          <span>Client</span>
          <span>Event</span>
          <span className="text-right">Total</span>
          <span className="text-center">Status</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-slate-700/50">
          {quotes.map((q) => {
            const secured = isSecured(q.status)
            const deposit = depositAmountOf(q)
            const hasDeposit = q.deposit_required && deposit > 0
            const completed = Boolean(q.captured_at || q.deposit_refunded_at)
            // A hold is placed (authorized) and awaiting completion, OR a legacy
            // fully-charged quote whose deposit hasn't been released yet.
            const needsCompletion =
              !completed && (isAuthorized(q.status) || (isCollected(q.status) && hasDeposit))
            const depositKept = Number(q.deposit_captured_amount ?? 0)
            const depositReleased = Number(q.deposit_released_amount ?? q.deposit_refund_amount ?? 0)
            return (
              <div
                key={q.id}
                className="grid grid-cols-2 gap-3 px-5 py-4 text-sm md:grid-cols-[110px_1fr_1fr_120px_110px_300px] md:items-center"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-white">{q.quote_number}</span>
                  {secured && q.invoice_number && (
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
                  {hasDeposit && (
                    <span className="block text-xs font-normal text-slate-500">
                      {isAuthorized(q.status) ? "+" : ""}
                      {money(deposit)} dep.
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
                  {!secured && (
                    <>
                      <button
                        onClick={() => handleSend(q.id, "send")}
                        disabled={busyKey === `send:${q.id}` || busyKey === `draft:${q.id}`}
                        title="Send the quote straight to the client"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#8c52ff]/40 bg-[#8c52ff]/10 px-2.5 py-1.5 text-xs font-medium text-[#c4a7ff] transition-colors hover:border-[#8c52ff]/70 hover:bg-[#8c52ff]/20 hover:text-white disabled:opacity-60"
                      >
                        {busyKey === `send:${q.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : doneKey === `send:${q.id}` ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        {doneKey === `send:${q.id}` ? "Sent" : "Send"}
                      </button>
                      <button
                        onClick={() => handleSend(q.id, "draft")}
                        disabled={busyKey === `draft:${q.id}` || busyKey === `send:${q.id}`}
                        title="Save an editable draft (with PDF) in your Gmail"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-[#8c52ff]/60 hover:text-white disabled:opacity-60"
                      >
                        {busyKey === `draft:${q.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : doneKey === `draft:${q.id}` ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <FileText className="h-3.5 w-3.5" />
                        )}
                        {doneKey === `draft:${q.id}` ? "Drafted" : "Draft"}
                      </button>
                    </>
                  )}
                  {needsCompletion && (
                    <button
                      onClick={() => openCapture(q)}
                      title="Charge the rental now that the event is done (releases the deposit hold)"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#8c52ff]/40 bg-[#8c52ff]/10 px-2.5 py-1.5 text-xs font-medium text-[#c4a7ff] transition-colors hover:border-[#8c52ff]/70 hover:bg-[#8c52ff]/20 hover:text-white"
                    >
                      <CircleDollarSign className="h-3.5 w-3.5" />
                      Complete rental
                    </button>
                  )}
                  {completed && (
                    <span
                      title={
                        depositKept > 0
                          ? `${money(depositKept)} of the deposit was kept for damages`
                          : hasDeposit
                            ? `Deposit of ${money(depositReleased || deposit)} released`
                            : "Rental completed"
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {depositKept > 0 ? `Kept ${money(depositKept)}` : hasDeposit ? "Deposit released" : "Completed"}
                    </span>
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

      <AlertDialog open={!!captureTarget} onOpenChange={(o) => !o && setCaptureTarget(null)}>
        <AlertDialogContent className="border-slate-700 bg-slate-900 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-[#c4a7ff]" />
              Complete this rental?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This charges the{" "}
              <span className="font-semibold text-white">
                {captureTarget ? money(Number(captureTarget.total)) : ""}
              </span>{" "}
              rental for {captureTarget?.invoice_number ?? captureTarget?.quote_number}.
              {captureDeposit > 0 && (
                <>
                  {" "}
                  The <span className="font-semibold text-white">{money(captureDeposit)}</span> security deposit hold is
                  released back to {captureTarget?.client_name} automatically — no refund fees.
                </>
              )}{" "}
              Only do this once the event is over and all equipment is back.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {captureDeposit > 0 && (
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
              <label className="flex items-start gap-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={keepDeposit}
                  onChange={(e) => setKeepDeposit(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#8c52ff]"
                />
                <span>
                  <span className="font-medium">Keep part of the deposit for damages</span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    Charge some of the {money(captureDeposit)} deposit instead of releasing all of it.
                  </span>
                </span>
              </label>
              {keepDeposit && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-slate-400">Keep</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={captureDeposit}
                      step="0.01"
                      value={keepAmount}
                      onChange={(e) => setKeepAmount(e.target.value)}
                      className="w-32 rounded-lg border border-slate-700 bg-slate-900/60 py-1.5 pl-6 pr-2.5 text-sm text-white outline-none focus:border-[#8c52ff]"
                    />
                  </div>
                  <span className="text-xs text-slate-500">of {money(captureDeposit)}</span>
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleCapture()
              }}
              disabled={capturing}
              className="bg-[#8c52ff] text-white hover:bg-[#7a45e6]"
            >
              {capturing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete rental"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
