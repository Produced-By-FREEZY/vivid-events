"use client"

import { useState } from "react"
import { ShieldCheck, Loader2, Check, AlertCircle, CalendarDays } from "lucide-react"
import { releaseDepositByToken, type ReleaseInfo } from "./actions"

const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

function prettyDate(d?: string | null) {
  if (!d) return null
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-CA", { dateStyle: "full" })
  } catch {
    return d
  }
}

export function ReleaseClient({ token, info }: { token: string; info: ReleaseInfo }) {
  const alreadyReleased = info.status === "already_released"
  const [released, setReleased] = useState(alreadyReleased)
  const [amount, setAmount] = useState<number>(
    alreadyReleased ? Number(info.depositAmount ?? 0) : Number(info.depositAmount ?? 0),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRelease = async () => {
    setError(null)
    setLoading(true)
    const result = await releaseDepositByToken(token)
    setLoading(false)
    if (result.success) {
      setAmount(Number(result.amount ?? info.depositAmount ?? 0))
      setReleased(true)
    } else {
      setError(result.error ?? "Could not release the deposit.")
    }
  }

  const dateLine = prettyDate(info.eventDate)

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/60 shadow-2xl">
      <div className="flex items-center gap-3 border-b border-slate-700/60 bg-black/30 px-6 py-5">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ background: "linear-gradient(to bottom right, #8c52ff, #6b3acc)" }}
        >
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Security deposit</p>
          <p className="text-xs text-slate-400">Vivid Events</p>
        </div>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div>
          <p className="text-sm text-slate-400">Complete rental &amp; release deposit for</p>
          <p className="text-lg font-semibold text-white text-balance">
            {info.eventName || "the event"}
            {info.clientName ? ` · ${info.clientName}` : ""}
          </p>
          {dateLine && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
              <CalendarDays className="h-4 w-4" />
              {dateLine}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Invoice</span>
            <span className="text-slate-200">{info.invoiceNumber ?? info.quoteNumber}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-700/60 pt-2 text-sm">
            <span className="text-slate-400">Deposit to release</span>
            <span className="text-lg font-bold" style={{ color: "#c4a7ff" }}>
              {money(Number(info.depositAmount ?? 0))}
            </span>
          </div>
        </div>

        {released ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <Check className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Rental completed &amp; deposit released</p>
              <p className="mt-0.5 text-emerald-300/80">
                The rental has been charged and the {money(amount)} deposit hold on {info.clientName || "the customer"}
                &apos;s card has been released. They&apos;ve been emailed a paid invoice. The hold typically clears
                within 5–10 business days.
              </p>
            </div>
          </div>
        ) : info.status === "not_payable" ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>This rental can&apos;t be completed yet — the card hold isn&apos;t in place or has no linked payment.</p>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-slate-400">
              Only do this once {info.clientName || "the customer"} has returned all equipment undamaged. The rental is
              charged and the deposit hold is released automatically through Stripe — you only ever pay fees on the
              rental you collect.
            </p>
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button
              onClick={handleRelease}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: "linear-gradient(to right, #8c52ff, #6b3acc)" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {loading ? "Completing…" : `Complete rental & release ${money(Number(info.depositAmount ?? 0))} deposit`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
