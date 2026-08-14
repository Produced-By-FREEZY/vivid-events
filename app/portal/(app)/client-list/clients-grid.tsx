"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Phone, Building2, ArrowRight, Pencil, Trash2, Loader2, UserPlus, Users } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addClient, deleteClient, updateClient } from "@/app/portal/quote-actions"

const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

export type ClientRow = {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  created_at: string
}

type Stats = { count: number; value: number }

export function ClientsGrid({
  clients,
  statsByEmail,
}: {
  clients: ClientRow[]
  statsByEmail: Record<string, Stats>
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<ClientRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<ClientRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" })

  const openEdit = (c: ClientRow) => {
    setError(null)
    setForm({ name: c.name, email: c.email, phone: c.phone ?? "", company: c.company ?? "" })
    setEditing(c)
  }

  const openCreate = () => {
    setError(null)
    setForm({ name: "", email: "", phone: "", company: "" })
    setCreating(true)
  }

  const saveCreate = async () => {
    setBusy(true)
    setError(null)
    const result = await addClient(form)
    setBusy(false)
    if (result.success) {
      setCreating(false)
      router.refresh()
    } else {
      setError(result.error ?? "Could not add the client.")
    }
  }

  const saveEdit = async () => {
    if (!editing) return
    setBusy(true)
    setError(null)
    const result = await updateClient(editing.id, form)
    setBusy(false)
    if (result.success) {
      setEditing(null)
      router.refresh()
    } else {
      setError(result.error ?? "Could not save.")
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setBusy(true)
    setError(null)
    const result = await deleteClient(deleting.id, true)
    setBusy(false)
    if (result.success) {
      setDeleting(null)
      router.refresh()
    } else {
      setError(result.error ?? "Could not delete.")
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-400">
          {clients.length} {clients.length === 1 ? "client" : "clients"}
        </span>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
          style={{ background: "linear-gradient(to right, #8c52ff, #6b3acc)" }}
        >
          <UserPlus className="h-4 w-4" /> Add Client
        </button>
      </div>

      {error && !editing && !creating && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-400">
            No clients yet. Use <span className="font-medium text-slate-200">Add Client</span> to create one, or they
            are saved automatically when you build a quote.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((c) => {
          const stats = statsByEmail[c.email?.toLowerCase()] ?? { count: 0, value: 0 }
          return (
            <div
              key={c.id}
              className="flex flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 transition-colors hover:border-slate-600"
            >
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

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => openEdit(c)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-[#8c52ff]/60 hover:text-white"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => {
                    setError(null)
                    setDeleting(c)
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-300 transition-colors hover:border-red-500/60 hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          )
        })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <DialogContent className="border-slate-700 bg-slate-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && creating && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-sm text-red-300">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="nc-name" className="text-slate-300">
                Name
              </Label>
              <Input
                id="nc-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Doe"
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nc-email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="nc-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jane@example.com"
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nc-phone" className="text-slate-300">
                  Phone
                </Label>
                <Input
                  id="nc-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nc-company" className="text-slate-300">
                  Company
                </Label>
                <Input
                  id="nc-company"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setCreating(false)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={saveCreate}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(to right, #8c52ff, #6b3acc)" }}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Add client
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="border-slate-700 bg-slate-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && editing && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-sm text-red-300">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="c-name" className="text-slate-300">
                Name
              </Label>
              <Input
                id="c-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="c-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-phone" className="text-slate-300">
                  Phone
                </Label>
                <Input
                  id="c-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-company" className="text-slate-300">
                  Company
                </Label>
                <Input
                  id="c-company"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setEditing(null)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(to right, #8c52ff, #6b3acc)" }}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="border-slate-700 bg-slate-900 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This permanently removes the client and all of their quotes and invoices, including the digital
              paperwork. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && deleting && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-sm text-red-300">{error}</div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              disabled={busy}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
