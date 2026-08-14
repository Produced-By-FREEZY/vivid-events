"use client"

import type React from "react"
import { useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { savePortalSettings, type PortalSettings } from "@/app/portal/settings-actions"

const PLACEHOLDERS: { token: string; label: string }[] = [
  { token: "{first_name}", label: "Client's first name" },
  { token: "{event_name}", label: "Event name" },
  { token: "{quote_number}", label: "Quote number" },
  { token: "{review_link}", label: "Secure review / approve link" },
  { token: "{signer_name}", label: "Your signature name" },
]

export function EmailTemplateForm({ initial }: { initial: PortalSettings }) {
  const [subject, setSubject] = useState(initial.quote_email_subject)
  const [body, setBody] = useState(initial.quote_email_body)
  const [signer, setSigner] = useState(initial.signer_name)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)
    const result = await savePortalSettings({
      quote_email_subject: subject,
      quote_email_body: body,
      signer_name: signer,
    })
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
        <label htmlFor="signer-name" className="text-sm font-medium text-slate-300">
          Signature name
        </label>
        <input
          id="signer-name"
          type="text"
          required
          value={signer}
          onChange={(e) => {
            setSigner(e.target.value)
            setSuccess(false)
          }}
          placeholder="e.g. Nick Friesen"
          className={inputClass}
        />
        <p className="text-xs text-slate-500">Used wherever the email says {"{signer_name}"}.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="email-subject" className="text-sm font-medium text-slate-300">
          Email subject
        </label>
        <input
          id="email-subject"
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
        <label htmlFor="email-body" className="text-sm font-medium text-slate-300">
          Email pre-text (body)
        </label>
        <textarea
          id="email-body"
          required
          rows={16}
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            setSuccess(false)
          }}
          className={`${inputClass} resize-y font-mono leading-relaxed`}
        />
        <p className="text-xs text-slate-500">
          This is the message saved to your Gmail drafts, with the quotation PDF attached. Line breaks are kept exactly
          as written.
        </p>
      </div>

      <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Available placeholders</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {PLACEHOLDERS.map((p) => (
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
