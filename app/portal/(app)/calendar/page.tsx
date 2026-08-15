import { createClient } from "@/lib/supabase/server"
import { CalendarClient, type BookingEvent } from "./calendar-client"

export const dynamic = "force-dynamic"

export default async function CalendarPage() {
  const supabase = await createClient()

  // Only confirmed bookings: paid/invoiced quotes that have an event date.
  const { data: quotes } = await supabase
    .from("quotes")
    .select(
      "id, quote_number, invoice_number, client_name, event_name, event_date, event_start_time, event_end_time, event_address, total, deposit_required, deposit_refunded_at",
    )
    .in("status", ["paid", "invoiced"])
    .not("event_date", "is", null)
    .order("event_date", { ascending: true })
    .order("event_start_time", { ascending: true, nullsFirst: true })

  const events: BookingEvent[] = (quotes ?? []).map((q) => ({
    id: q.id,
    date: q.event_date as string,
    startTime: q.event_start_time,
    endTime: q.event_end_time,
    address: q.event_address,
    clientName: q.client_name,
    eventName: q.event_name,
    total: Number(q.total),
    invoiceNumber: q.invoice_number,
    quoteNumber: q.quote_number,
    depositHeld: Boolean(q.deposit_required) && !q.deposit_refunded_at,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Booking Calendar</h1>
        <p className="mt-1 text-sm text-slate-400">
          Every confirmed (paid) event, blocked out by date. New bookings land here automatically the moment a quote is
          paid.
        </p>
      </div>
      <CalendarClient events={events} />
    </div>
  )
}
