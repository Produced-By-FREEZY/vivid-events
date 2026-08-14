"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Search, X, Package, Check } from "lucide-react"
import type { ServiceItem } from "@/app/portal/quote-actions"
import { saveServiceItem, toggleServiceItem, deleteServiceItem } from "@/app/portal/quote-actions"

const UNIT_OPTIONS = ["each", "pair", "package", "event", "day", "hour", "run", "section", "panel", "trip"]

const money = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

type Draft = {
  id?: string
  category: string
  name: string
  description: string
  unit: string
  unit_price: string
  active: boolean
}

function emptyDraft(category = ""): Draft {
  return { category, name: "", description: "", unit: "each", unit_price: "", active: true }
}

export function CatalogClient({ items }: { items: ServiceItem[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("All")
  const [editing, setEditing] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ServiceItem | null>(null)

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category))
    return ["All", ...Array.from(set)]
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((it) => {
      if (activeCategory !== "All" && it.category !== activeCategory) return false
      if (!q) return true
      return (
        it.name.toLowerCase().includes(q) ||
        (it.description ?? "").toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q)
      )
    })
  }, [items, search, activeCategory])

  const grouped = useMemo(() => {
    const map = new Map<string, ServiceItem[]>()
    for (const it of filtered) {
      if (!map.has(it.category)) map.set(it.category, [])
      map.get(it.category)!.push(it)
    }
    return Array.from(map.entries())
  }, [filtered])

  function openNew() {
    setError(null)
    setEditing(emptyDraft(activeCategory !== "All" ? activeCategory : ""))
  }

  function openEdit(it: ServiceItem) {
    setError(null)
    setEditing({
      id: it.id,
      category: it.category,
      name: it.name,
      description: it.description ?? "",
      unit: it.unit,
      unit_price: String(it.unit_price),
      active: it.active,
    })
  }

  function handleSave() {
    if (!editing) return
    setError(null)
    startTransition(async () => {
      const res = await saveServiceItem({
        id: editing.id,
        category: editing.category,
        name: editing.name,
        description: editing.description,
        unit: editing.unit,
        unit_price: Number(editing.unit_price),
        active: editing.active,
      })
      if (!res.success) {
        setError(res.error ?? "Something went wrong.")
        return
      }
      setEditing(null)
      router.refresh()
    })
  }

  function handleToggle(it: ServiceItem) {
    startTransition(async () => {
      await toggleServiceItem(it.id, !it.active)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirmDelete) return
    const id = confirmDelete.id
    startTransition(async () => {
      await deleteServiceItem(id)
      setConfirmDelete(null)
      router.refresh()
    })
  }

  const inputCls =
    "w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#8c52ff] focus:outline-none focus:ring-1 focus:ring-[#8c52ff]"

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service Catalog</h1>
          <p className="mt-1 text-sm text-slate-400">
            {items.length} items. Edit pricing, add new equipment, or hide items from the quote builder.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(to bottom right, #8c52ff, #6b3acc)" }}
        >
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {/* Controls */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment, packages, services..."
            className={inputCls + " pl-9"}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-[#8c52ff] text-white"
                  : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {grouped.length === 0 ? (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-12 text-center">
          <Package className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p className="text-sm text-slate-400">No items match your search.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, catItems]) => (
            <section key={category}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8c52ff]">{category}</h2>
              <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/40">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-800">
                    {catItems.map((it) => (
                      <tr key={it.id} className={`transition-colors hover:bg-slate-800/40 ${!it.active ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 font-medium text-white">
                            {it.name}
                            {!it.active && (
                              <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] uppercase text-slate-300">
                                Hidden
                              </span>
                            )}
                          </div>
                          {it.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{it.description}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="font-semibold text-white">{money(Number(it.unit_price))}</div>
                          <div className="text-xs text-slate-500">per {it.unit}</div>
                        </td>
                        <td className="whitespace-nowrap px-2 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggle(it)}
                              title={it.active ? "Hide from quote builder" : "Show in quote builder"}
                              className="rounded-md px-2 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700/60"
                            >
                              {it.active ? "Hide" : "Show"}
                            </button>
                            <button
                              onClick={() => openEdit(it)}
                              title="Edit"
                              className="rounded-md p-2 text-slate-300 transition-colors hover:bg-slate-700/60 hover:text-white"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(it)}
                              title="Delete"
                              className="rounded-md p-2 text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Edit / Add modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div
            className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{editing.id ? "Edit Item" : "Add Item"}</h3>
              <button onClick={() => setEditing(null)} className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Item Name</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="e.g. Powered PA Speaker 15&quot;"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Description</label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                  placeholder="Short description shown on the quote"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Category</label>
                  <input
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    list="catalog-categories"
                    placeholder="e.g. Lighting"
                    className={inputCls}
                  />
                  <datalist id="catalog-categories">
                    {categories
                      .filter((c) => c !== "All")
                      .map((c) => (
                        <option key={c} value={c} />
                      ))}
                  </datalist>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Unit</label>
                  <select
                    value={editing.unit}
                    onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                    className={inputCls}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Price (CAD)</label>
                  <input
                    value={editing.unit_price}
                    onChange={(e) => setEditing({ ...editing, unit_price: e.target.value })}
                    inputMode="decimal"
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, active: !editing.active })}
                      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                        editing.active ? "border-[#8c52ff] bg-[#8c52ff]" : "border-slate-600 bg-transparent"
                      }`}
                    >
                      {editing.active && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                    Show in quote builder
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(to bottom right, #8c52ff, #6b3acc)" }}
              >
                {isPending ? "Saving..." : "Save Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setConfirmDelete(null)}>
          <div
            className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Delete item?</h3>
            <p className="mt-2 text-sm text-slate-400">
              {'"'}
              {confirmDelete.name}
              {'"'} will be permanently removed from the catalog. Quotes already created keep their line items.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
