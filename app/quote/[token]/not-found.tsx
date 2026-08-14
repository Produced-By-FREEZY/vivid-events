import { FileQuestion } from "lucide-react"

export default function QuoteNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: "#8c52ff" }}
        >
          <FileQuestion className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-slate-900">Quote not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          This quotation link is invalid or has expired. If you think this is a mistake, just reply to the email we
          sent you and we&apos;ll sort it out.
        </p>
        <p className="mt-6 text-xs text-slate-400">Vivid Events</p>
      </div>
    </main>
  )
}
