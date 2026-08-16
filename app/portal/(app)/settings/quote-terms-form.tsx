"use client"

import type React from "react"
import { useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { saveQuoteTermsSettings } from "@/app/portal/settings-actions"

export function QuoteTermsForm({ initial }: { initial: string }) {
  const [terms, setTerms] = useState(initial)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)
    const result = await saveQuoteTermsSettings({ quote_terms: terms })
    setIsLoading(false)
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error ?? "Could not save your quote terms.")
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#8c52ff] focus:outline-none"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="quote-terms" className="text-sm font-medium text-slate-300">
          Default quote terms
        </label>
        <textarea
          id="quote-terms"
          required
          rows={20}
          value={terms}
          onChange={(e) => {
            setTerms(e.target.value)
            setSuccess(false)
          }}
          className={`${inputClass} resize-y font-mono leading-relaxed`}
        />
        <p className="text-xs text-slate-500">
          These terms appear at the bottom of the client&apos;s online quote and the quotation PDF that gets sent out.
          Line breaks are kept exactly as written.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && (
        <p className="flex items-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Quote terms saved.
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        style={{ background: "linear-gradient(to right, #8c52ff, #6b3acc)" }}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? "Saving..." : "Save Quote Terms"}
      </button>
    </form>
  )
}
