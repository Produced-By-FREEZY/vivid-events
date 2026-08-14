import Link from "next/link"
import { Users, Mail, Phone, Building2, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

type ClientRow = {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  created_at: string
}

export default async function ClientListPage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: quotes }] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("quotes").select("client_email,total,status"),
  ])

  const byEmail = new Map<string, { count: number; value: number }>()
  for (const q of quotes ?? []) {
    const key = (q.client_email as string)?.toLowerCase()
    if (!key) continue
    const entry = byEmail.get(key) ?? { count: 0, value: 0 }
    entry.count += 1
    if (q.status === "sent" || q.status === "accepted") entry.value += Number(q.total)
    byEmail.set(key, entry)
  }

  const rows = (clients ?? []) as ClientRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Client List</h1>
        <p className="mt-1 text-sm text-slate-400">Everyone you have quoted. New clients are added automatically.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-400">
            No clients yet. They are saved automatically when you build a quote.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => {
            const stats = byEmail.get(c.email?.toLowerCase()) ?? { count: 0, value: 0 }
            return (
              <div key={c.id} className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-white">{c.name}</h2>
                    {c.company && (
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
                        <Building2 className="h-3 w-3" /> {c.company}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-[#8c52ff]/15 px-2 py-0.5 text-[11px] font-medium text-[#c4a7ff]">
                    {stats.count} {stats.count === 1 ? "quote" : "quotes"}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-sm">
                  <a
                    href={`mailto:${c.email}`}
                    className="flex items-center gap-2 truncate text-slate-400 transition-colors hover:text-[#8c52ff]"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{c.email}</span>
                  </a>
                  {c.phone && (
                    <p className="flex items-center gap-2 text-slate-400">
                      <Phone className="h-3.5 w-3.5 shrink-0" /> {c.phone}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-700/50 pt-3">
                  <span className="text-xs text-slate-500">
                    Sent value <span className="font-semibold text-white">{money(stats.value)}</span>
                  </span>
                  <Link
                    href={`/portal/quote-builder?name=${encodeURIComponent(c.name)}&email=${encodeURIComponent(c.email)}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#8c52ff] hover:underline"
                  >
                    New quote <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
