"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, ShieldCheck, CircleDot, Clock, MapPin } from "lucide-react"

export type BookingEvent = {
  id: string
  date: string // yyyy-mm-dd
  startTime: string | null // "HH:MM[:SS]"
  endTime: string | null // "HH:MM[:SS]"
  address: string | null
  clientName: string
  eventName: string | null
  total: number
  invoiceNumber: string | null
  quoteNumber: string
  depositHeld: boolean
}

const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

/** "14:30[:00]" → "2:30 PM". Returns "" for empty/invalid input. */
function fmtTime(t: string | null | undefined): string {
  const v = (t ?? "").trim()
  const m = /^(\d{1,2}):(\d{2})/.exec(v)
  if (!m) return ""
  let h = Number(m[1])
  const min = m[2]
  const period = h >= 12 ? "PM" : "AM"
  h = h % 12 || 12
  return `${h}:${min} ${period}`
}

/** Compact time range for a booking: "2:30 PM–5:00 PM", "2:30 PM", or "All day". */
function fmtRange(e: Pick<BookingEvent, "startTime" | "endTime">): string {
  const start = fmtTime(e.startTime)
  if (!start) return "All day"
  const end = fmtTime(e.endTime)
  return end ? `${start}–${end}` : start
}

/** Minutes since midnight for stable chronological sort; null times sort last. */
function minutesOf(t: string | null): number {
  const m = /^(\d{1,2}):(\d{2})/.exec((t ?? "").trim())
  return m ? Number(m[1]) * 60 + Number(m[2]) : Number.MAX_SAFE_INTEGER
}
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function CalendarClient({ events }: { events: BookingEvent[] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  // Group events by their yyyy-mm-dd date string.
  const byDate = useMemo(() => {
    const map = new Map<string, BookingEvent[]>()
    for (const e of events) {
      const list = map.get(e.date) ?? []
      list.push(e)
      map.set(e.date, list)
    }
    // Order each day's bookings chronologically by start time.
    for (const list of map.values()) {
      list.sort((a, b) => minutesOf(a.startTime) - minutesOf(b.startTime))
    }
    return map
  }, [events])

  // Build the 6-week grid covering the visible month.
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = new Date(first)
    start.setDate(first.getDate() - first.getDay()) // back up to Sunday
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [cursor])

  const upcoming = useMemo(
    () => events.filter((e) => new Date(e.date + "T00:00:00") >= today).slice(0, 8),
    [events, today],
  )

  const monthLabel = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
  const todayStr = ymd(today)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Month grid */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="rounded-lg border border-slate-700 bg-slate-900/60 p-2 text-slate-300 transition-colors hover:border-[#8c52ff]/60 hover:text-white"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-[#8c52ff]/60 hover:text-white"
            >
              Today
            </button>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="rounded-lg border border-slate-700 bg-slate-900/60 p-2 text-slate-300 transition-colors hover:border-[#8c52ff]/60 hover:text-white"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="pb-1 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {w}
            </div>
          ))}
          {cells.map((d) => {
            const key = ymd(d)
            const inMonth = d.getMonth() === cursor.getMonth()
            const isToday = key === todayStr
            const dayEvents = byDate.get(key) ?? []
            return (
              <div
                key={key}
                className={`min-h-20 rounded-lg border p-1.5 sm:min-h-24 ${
                  inMonth ? "border-slate-700/50 bg-slate-900/40" : "border-transparent bg-slate-900/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday
                        ? "bg-[#8c52ff] font-semibold text-white"
                        : inMonth
                          ? "text-slate-300"
                          : "text-slate-600"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {dayEvents.length > 1 && (
                    <span className="text-[10px] font-medium text-slate-500">{dayEvents.length}</span>
                  )}
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((e) => {
                    const t = fmtTime(e.startTime)
                    return (
                      <div
                        key={e.id}
                        title={`${fmtRange(e)} · ${e.eventName ?? "Event"} · ${e.clientName}${
                          e.address ? ` · ${e.address}` : ""
                        } · ${money(e.total)}`}
                        className="truncate rounded-md border-l-2 border-[#8c52ff] bg-[#8c52ff]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#d9c6ff]"
                      >
                        {t && <span className="mr-1 font-semibold text-white">{t}</span>}
                        {e.eventName || e.clientName}
                      </div>
                    )
                  })}
                  {dayEvents.length > 3 && (
                    <div className="px-1 text-[10px] text-slate-500">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming agenda */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-4 w-4" style={{ color: "#8c52ff" }} />
          <h2 className="text-sm font-semibold text-white">Upcoming Bookings</h2>
        </div>
        {upcoming.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No upcoming confirmed bookings.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((e) => {
              const d = new Date(e.date + "T00:00:00")
              return (
                <div key={e.id} className="flex gap-3 rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
                  <div className="flex w-11 shrink-0 flex-col items-center justify-center rounded-md bg-[#8c52ff]/15 py-1 text-center">
                    <span className="text-[10px] font-medium uppercase text-[#c4a7ff]">
                      {MONTHS[d.getMonth()].slice(0, 3)}
                    </span>
                    <span className="text-lg font-bold leading-none text-white">{d.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{e.eventName || "Event"}</p>
                    <p className="truncate text-xs text-slate-400">{e.clientName}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-[#c4a7ff]">
                      <Clock className="h-3 w-3 shrink-0" />
                      {fmtRange(e)}
                    </p>
                    {e.address && (
                      <p className="mt-0.5 flex items-start gap-1 text-xs text-slate-400">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="truncate">{e.address}</span>
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-semibold text-slate-300">{money(e.total)}</span>
                      {e.invoiceNumber && <span className="text-slate-500">{e.invoiceNumber}</span>}
                      {e.depositHeld ? (
                        <span className="inline-flex items-center gap-1 text-amber-300">
                          <ShieldCheck className="h-3 w-3" /> Deposit held
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CircleDot className="h-3 w-3" /> Confirmed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
