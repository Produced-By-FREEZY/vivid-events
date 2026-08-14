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
          Everyone in your book. Add a client directly with the button below, or they are saved automatically when you
          build a quote — then edit or remove them here.
        </p>
      </div>

      <ClientsGrid clients={rows} statsByEmail={statsByEmail} />
    </div>
  )
}
