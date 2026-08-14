import { Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ClientsGrid, type ClientRow } from "./clients-grid"

export default async function ClientListPage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: quotes }] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("quotes").select("client_email,total,status"),
  ])

  const statsByEmail: Record<string, { count: number; value: number }> = {}
  for (const q of quotes ?? []) {
    const key = (q.client_email as string)?.toLowerCase()
    if (!key) continue
    const entry = statsByEmail[key] ?? { count: 0, value: 0 }
    entry.count += 1
    if (q.status === "sent" || q.status === "accepted") entry.value += Number(q.total)
    statsByEmail[key] = entry
  }

  const rows = (clients ?? []) as ClientRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Client List</h1>
        <p className="mt-1 text-sm text-slate-400">
          Everyone you have quoted. New clients are added automatically — edit their details or remove them and their
          paperwork here.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-400">
            No clients yet. They are saved automatically when you build a quote.
          </p>
        </div>
      ) : (
        <ClientsGrid clients={rows} statsByEmail={statsByEmail} />
      )}
    </div>
  )
}
