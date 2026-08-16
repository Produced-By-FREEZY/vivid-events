import Link from "next/link"
import { FileText, Send, Users, Inbox, ArrowRight, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

const statusStyles: Record<string, string> = {
  draft: "bg-slate-700/60 text-slate-300",
  sent: "bg-[#8c52ff]/20 text-[#c4a7ff]",
  accepted: "bg-emerald-500/15 text-emerald-300",
  approved: "bg-amber-500/15 text-amber-300",
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

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: quotes }, { count: clientCount }, { data: bookings }] = await Promise.all([
    supabase.from("quotes").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(5),
  ])

  const allQuotes = quotes ?? []
  const sentQuotes = allQuotes.filter((q) => q.status === "sent" || q.status === "accepted")
  const pipelineValue = sentQuotes.reduce((sum, q) => sum + Number(q.total), 0)

  const stats = [
    { label: "Total Quotes", value: String(allQuotes.length), icon: FileText },
    { label: "Quotes Sent", value: String(sentQuotes.length), icon: Send },
    { label: "Pipeline Value", value: money(pipelineValue), icon: ArrowRight },
    { label: "Clients", value: String(clientCount ?? 0), icon: Users },
  ]

  const recentQuotes = allQuotes.slice(0, 6)
  const newBookings = bookings ?? []

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Welcome back to your Vivid Events workspace.</p>
        </div>
        <Link
          href="/portal/quote-builder"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
          style={{ background: "linear-gradient(to right, #8c52ff, #6b3acc)" }}
        >
          <Plus className="h-4 w-4" /> New Quote
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{s.label}</span>
                <Icon className="h-4 w-4" style={{ color: "#8c52ff" }} />
              </div>
              <p className="mt-3 text-2xl font-semibold text-white">{s.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Recent quotes */}
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Quotes</h2>
            <Link href="/portal/invoices" className="text-xs text-slate-400 transition-colors hover:text-[#8c52ff]">
              View all
            </Link>
          </div>
          {recentQuotes.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No quotes yet. Create your first one from the Quote Builder.
            </p>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {recentQuotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {q.quote_number} &middot; {q.client_name}
                    </p>
                    <p className="truncate text-xs text-slate-500">{q.event_name ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">{money(Number(q.total))}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusStyles[q.status] ?? statusStyles.draft}`}>
                      {statusLabel[q.status] ?? q.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* New enquiries from the website */}
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Inbox className="h-4 w-4" style={{ color: "#8c52ff" }} />
            <h2 className="text-sm font-semibold text-white">New Website Enquiries</h2>
          </div>
          {newBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No new enquiries from the website.</p>
          ) : (
            <div className="space-y-3">
              {newBookings.map((b) => (
                <div key={b.id} className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-white">{b.name ?? "Unknown"}</p>
                    <span className="shrink-0 text-[11px] text-slate-500">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-400">{b.email ?? ""}</p>
                  {b.service_requested && (
                    <p className="mt-1 truncate text-xs text-slate-500">{b.service_requested}</p>
                  )}
                  {b.email && (
                    <Link
                      href={`/portal/quote-builder?name=${encodeURIComponent(b.name ?? "")}&email=${encodeURIComponent(b.email)}&event=${encodeURIComponent(b.service_requested ?? "")}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#8c52ff] hover:underline"
                    >
                      Create quote <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
