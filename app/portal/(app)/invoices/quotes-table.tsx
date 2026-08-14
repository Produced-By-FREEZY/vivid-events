"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, Loader2, Check, FileText } from "lucide-react"
import { sendQuote } from "@/app/portal/quote-actions"
import type { QuoteRecord } from "@/app/portal/quote-actions"

const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

const statusStyles: Record<string, string> = {
  draft: "bg-slate-700/60 text-slate-300",
  sent: "bg-[#8c52ff]/20 text-[#c4a7ff]",
  accepted: "bg-emerald-500/15 text-emerald-300",
  declined: "bg-red-500/15 text-red-300",
}

export function QuotesTable({ quotes }: { quotes: QuoteRecord[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [sentId, setSentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        <div className="hidden grid-cols-[110px_1fr_1fr_110px_110px_130px] gap-3 border-b border-slate-700/50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-400 md:grid">
          <span>Quote</span>
          <span>Client</span>
          <span>Event</span>
          <span className="text-right">Total</span>
          <span className="text-center">Status</span>
          <span className="text-right">Action</span>
        </div>
        <div className="divide-y divide-slate-700/50">
          {quotes.map((q) => (
            <div
              key={q.id}
              className="grid grid-cols-2 gap-3 px-5 py-4 text-sm md:grid-cols-[110px_1fr_1fr_110px_110px_130px] md:items-center"
            >
              <span className="font-semibold text-white">{q.quote_number}</span>
              <span className="min-w-0">
                <span className="block truncate text-white">{q.client_name}</span>
                <span className="block truncate text-xs text-slate-500">{q.client_email}</span>
              </span>
              <span className="min-w-0 truncate text-slate-400">{q.event_name ?? "—"}</span>
              <span className="font-semibold text-white md:text-right">{money(Number(q.total))}</span>
              <span className="md:text-center">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusStyles[q.status] ?? statusStyles.draft}`}
                >
                  {q.status}
                </span>
              </span>
              <span className="md:text-right">
                <button
                  onClick={() => handleSend(q.id)}
                  disabled={busyId === q.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-[#8c52ff]/60 hover:text-white disabled:opacity-60"
                >
                  {busyId === q.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : sentId === q.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {q.status === "draft" ? "Send" : "Resend"}
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
