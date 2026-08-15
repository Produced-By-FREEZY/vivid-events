"use client"

import type React from "react"
import { useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"

type Placeholder = { token: string; label: string }

/**
 * Generic owner-editable email template editor (subject + body) used for the
 * payment-confirmation and deposit-released customer emails. The parent passes
 * a save action so this stays presentation-only.
 */
export function SimpleEmailForm({
  initialSubject,
  initialBody,
  placeholders,
  bodyHelp,
  onSave,
}: {
  initialSubject: string
  initialBody: string
  placeholders: Placeholder[]
  bodyHelp: string
  onSave: (input: { subject: string; body: string }) => Promise<{ success: boolean; error?: string }>
}) {
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)
    const result = await onSave({ subject, body })
    setIsLoading(false)
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error ?? "Could not save your settings.")
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#8c52ff] focus:outline-none"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Email subject</label>
        <input
          type="text"
          required
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value)
            setSuccess(false)
          }}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Email body</label>
        <textarea
          required
          rows={14}
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            setSuccess(false)
          }}
          className={`${inputClass} resize-y font-mono leading-relaxed`}
        />
        <p className="text-xs text-slate-500">{bodyHelp}</p>
      </div>

      <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Available placeholders</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {placeholders.map((p) => (
            <li key={p.token} className="flex items-center gap-2 text-xs text-slate-300">
              <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[#b794ff]">{p.token}</code>
              <span className="text-slate-500">{p.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && (
        <p className="flex items-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Settings saved.
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        style={{ background: "linear-gradient(to right, #8c52ff, #6b3acc)" }}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? "Saving..." : "Save Email Settings"}
      </button>
    </form>
  )
}
