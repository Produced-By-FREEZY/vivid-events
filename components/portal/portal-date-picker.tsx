"use client"

import { useState, type CSSProperties } from "react"
import { CalendarDays, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/** Parse a `yyyy-mm-dd` string into a LOCAL Date (no timezone drift). */
function parseISODate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

/** Format a Date back to `yyyy-mm-dd` in local time. */
function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const displayFmt = new Intl.DateTimeFormat("en-CA", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
})

export function PortalDatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  fromDate,
  clearable = false,
  id,
}: {
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  /** Earliest selectable date (days before this are disabled). */
  fromDate?: Date
  /** Show a clear button when a date is set. */
  clearable?: boolean
  id?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = parseISODate(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-left text-sm text-white transition-colors hover:border-[#8c52ff]/60 focus:border-[#8c52ff] focus:outline-none"
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-[#c4a7ff]" />
          <span className={selected ? "text-white" : "text-slate-500"}>
            {selected ? displayFmt.format(selected) : placeholder}
          </span>
          {clearable && selected && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date"
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  e.stopPropagation()
                  onChange("")
                }
              }}
              className="ml-auto rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-700/60 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto rounded-xl border border-slate-700 bg-slate-900 p-0 text-white shadow-2xl shadow-black/40"
        style={
          {
            // Scope brand-purple tokens so the calendar's selected/accent states
            // match the portal instead of the default near-black primary.
            "--primary": "260 100% 66%",
            "--primary-foreground": "0 0% 100%",
            "--accent": "260 45% 26%",
            "--accent-foreground": "0 0% 100%",
            "--ring": "260 100% 66%",
          } as CSSProperties
        }
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={fromDate ? { before: fromDate } : undefined}
          onSelect={(date) => {
            if (date) {
              onChange(toISODate(date))
              setOpen(false)
            }
          }}
          className="p-3 [--cell-size:2.25rem]"
          classNames={{
            month_caption: "flex items-center justify-center h-9 w-full px-9 text-sm font-semibold text-white",
            weekday: "flex-1 select-none rounded-md text-[0.72rem] font-medium uppercase tracking-wide text-slate-500",
            today: "rounded-md ring-1 ring-inset ring-[#8c52ff]/50 text-white",
            outside: "text-slate-600 opacity-60",
            disabled: "text-slate-700 opacity-40",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
