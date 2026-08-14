import { createClient } from "@/lib/supabase/server"
import { QuotesTable } from "./quotes-table"

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: quotes } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Quotes &amp; Invoices</h1>
        <p className="mt-1 text-sm text-slate-400">Every quote you have built, with live status and one-click resend.</p>
      </div>
      <QuotesTable quotes={quotes ?? []} />
    </div>
  )
}
