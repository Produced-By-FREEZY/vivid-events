"use client"

import type React from "react"
import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import {
  Sparkles,
  UploadCloud,
  Download,
  X,
  Loader2,
  ImageIcon,
  FileImage,
  Trash2,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  generateDataSheet,
  deleteDataSheet,
  type DataSheetRecord,
} from "@/app/portal/data-sheet-actions"

const MAX_IMAGES = 5

type UploadedImage = { id: string; dataUrl: string; name: string }

/** Downscale + compress an image file to a JPEG data URL to keep payloads small. */
function fileToCompressedDataUrl(file: File, maxDim = 1400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Could not read file"))
    reader.onload = () => {
      const img = new window.Image()
      img.onerror = () => reject(new Error("Could not load image"))
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const scale = Math.min(maxDim / width, maxDim / height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("Canvas unavailable"))
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function DataSheetClient({ initialSaved }: { initialSaved: DataSheetRecord[] }) {
  const [productName, setProductName] = useState("")
  const [specifications, setSpecifications] = useState("")
  const [images, setImages] = useState<UploadedImage[]>([])
  const [dragging, setDragging] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DataSheetRecord | null>(null)
  const [saved, setSaved] = useState<DataSheetRecord[]>(initialSaved)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setError(null)
      const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"))
      if (!files.length) return
      const room = MAX_IMAGES - images.length
      const toAdd = files.slice(0, room)
      try {
        const processed = await Promise.all(
          toAdd.map(async (f) => ({
            id: crypto.randomUUID(),
            dataUrl: await fileToCompressedDataUrl(f),
            name: f.name,
          })),
        )
        setImages((prev) => [...prev, ...processed].slice(0, MAX_IMAGES))
      } catch {
        setError("One of those images couldn't be processed. Try a different file.")
      }
    },
    [images.length],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files)
  }

  const removeImage = (id: string) => setImages((prev) => prev.filter((i) => i.id !== id))

  const handleGenerate = async () => {
    if (!productName.trim()) {
      setError("Please enter a product or fixture name.")
      return
    }
    setError(null)
    setGenerating(true)
    setResult(null)
    try {
      const res = await generateDataSheet({
        productName,
        specifications,
        referenceImages: images.map((i) => i.dataUrl),
      })
      if (res.success) {
        setResult(res.record)
        setSaved((prev) => [res.record, ...prev])
      } else {
        setError(res.error)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSaved((prev) => prev.filter((s) => s.id !== id))
    if (result?.id === id) setResult(null)
    await deleteDataSheet(id)
  }

  // The preview blends live form input with generated results.
  const preview = {
    name: result?.productName || productName || "Product / Fixture Name",
    tagline: result?.tagline || "Your AI-generated tagline will appear here",
    copy:
      result?.marketingCopy ||
      specifications ||
      "Once you generate, polished marketing copy describing your product in action at live events will appear right here — ready to export.",
    specItems:
      result?.specItems && result.specItems.length
        ? result.specItems
        : parsePreviewSpecs(specifications),
    heroUrl: result?.heroImageUrl || images[0]?.dataUrl || null,
    galleryUrls: result?.galleryImageUrls?.length
      ? result.galleryImageUrls
      : images.slice(1, 3).map((i) => i.dataUrl),
    isGenerated: Boolean(result),
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <FileImage className="h-6 w-6" style={{ color: "#8c52ff" }} />
          Product Data Sheet Generator
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Turn a few details and reference photos into a polished, branded PDF brochure — powered by AI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ---------- LEFT: Input form ---------- */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Generate Data Sheet</h2>
            <p className="mt-1 text-sm text-slate-400">
              Just add a name, a few specs, and some photos. We&apos;ll write the copy, stage the shots, and build the
              brochure for you.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="product-name" className="text-slate-200">
                Product / Fixture Name
              </Label>
              <Input
                id="product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Moving Head Beam 230"
                className="border-slate-700 bg-slate-800/60 text-white placeholder:text-slate-500 focus-visible:ring-[#8c52ff]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specs" className="text-slate-200">
                Specifications &amp; Details
              </Label>
              <Textarea
                id="specs"
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                placeholder={"Power: 230W\nDMX Channels: 16\nWeight: 4.2 kg\nBeam angle: 3°\n\nAny extra details, use-cases or highlights…"}
                rows={7}
                className="resize-none border-slate-700 bg-slate-800/60 text-white placeholder:text-slate-500 focus-visible:ring-[#8c52ff]"
              />
              <p className="text-xs text-slate-500">
                Tip: one spec per line as &ldquo;Label: value&rdquo;. AI will fill in any gaps.
              </p>
            </div>

            {/* Image upload zone */}
            <div className="space-y-2">
              <Label className="text-slate-200">Reference Photos</Label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click()
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
                  dragging
                    ? "border-[#8c52ff] bg-[#8c52ff]/10"
                    : "border-slate-600 bg-slate-800/40 hover:border-[#8c52ff]/60 hover:bg-slate-800/60"
                }`}
              >
                <UploadCloud className="mb-2 h-8 w-8 text-[#8c52ff]" />
                <p className="text-sm font-medium text-slate-200">
                  Drag &amp; drop photos here, or <span className="text-[#8c52ff]">browse</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">PNG or JPG · up to {MAX_IMAGES} images</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) void addFiles(e.target.files)
                    e.target.value = ""
                  }}
                />
              </div>

              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {images.map((img) => (
                    <div key={img.id} className="group relative aspect-square overflow-hidden rounded-md border border-slate-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.dataUrl || "/placeholder.svg"} alt={img.name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={`Remove ${img.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
            )}

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full gap-2 bg-[#8c52ff] py-6 text-base font-semibold text-white hover:bg-[#7a45e6]"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating your brochure…
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate AI Brochure
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ---------- RIGHT: Live brochure preview ---------- */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Live Brochure Preview</h2>
            <Button
              variant="outline"
              disabled={!result?.pdfUrl}
              onClick={() => {
                if (result?.pdfUrl) window.open(result.pdfUrl, "_blank", "noopener,noreferrer")
              }}
              className="gap-2 border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>

          <BrochurePreview preview={preview} generating={generating} />

          {result && !result.aiImages && result.heroImageUrl && (
            <p className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              We couldn&apos;t generate the cinematic &ldquo;in action&rdquo; event shots this time, so your uploaded
              photos were used instead. Try generating again in a moment.
            </p>
          )}
        </div>
      </div>

      {/* ---------- Saved data sheets ---------- */}
      {saved.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-white">Saved Data Sheets</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((sheet) => (
              <div
                key={sheet.id}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/60"
              >
                <div className="relative h-36 w-full bg-slate-800">
                  {sheet.heroImageUrl ? (
                    <Image
                      src={sheet.heroImageUrl || "/placeholder.svg"}
                      alt={sheet.productName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-600">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="truncate font-semibold text-white">{sheet.productName}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {new Date(sheet.createdAt).toLocaleDateString("en-CA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={!sheet.pdfUrl}
                      onClick={() => sheet.pdfUrl && window.open(sheet.pdfUrl, "_blank", "noopener,noreferrer")}
                      className="flex-1 gap-1.5 bg-[#8c52ff] text-white hover:bg-[#7a45e6]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(sheet.id)}
                      className="border-slate-600 bg-slate-800/60 text-slate-300 hover:bg-red-500/10 hover:text-red-300"
                      aria-label={`Delete ${sheet.productName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Brochure preview — simulates an A4 document                         */
/* ------------------------------------------------------------------ */

function BrochurePreview({
  preview,
  generating,
}: {
  preview: {
    name: string
    tagline: string
    copy: string
    specItems: { label: string; value: string }[]
    heroUrl: string | null
    galleryUrls: string[]
    isGenerated: boolean
  }
  generating: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-950/40 p-3 shadow-inner sm:p-5">
      {/* A4 paper */}
      <div className="mx-auto flex aspect-[210/297] w-full max-w-[520px] flex-col overflow-hidden rounded-md bg-white shadow-2xl ring-1 ring-black/10">
        {/* Branded header band (navy + purple accent), mirrors the PDF */}
        <div className="relative flex items-center justify-between bg-[#0e1628] px-5 py-4">
          <div className="relative h-8 w-28">
            <Image src="/images/vivid-events-logo.png" alt="Vivid Events" fill className="object-contain object-left" />
          </div>
          <span className="text-lg font-bold tracking-wide text-[#8c52ff]">DATA SHEET</span>
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[#8c52ff]" />
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden px-5 py-4">
          <div>
            <h3 className="text-pretty text-lg font-bold leading-tight text-slate-900">{preview.name}</h3>
            <p className="text-sm font-medium text-[#8c52ff]">{preview.tagline}</p>
          </div>

          {/* Hero image */}
          <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded bg-slate-100">
            {preview.heroUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.heroUrl || "/placeholder.svg"} alt="Product hero" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400">
                <ImageIcon className="h-8 w-8" />
                <span className="mt-1 text-xs">Product hero image</span>
              </div>
            )}
            {generating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 className="h-6 w-6 animate-spin text-[#8c52ff]" />
              </div>
            )}
          </div>

          {/* Overview copy */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c52ff]">Overview</p>
            <p className="mt-1 line-clamp-4 text-[11px] leading-relaxed text-slate-600">{preview.copy}</p>
          </div>

          {/* Specs */}
          <div className="shrink-0">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#8c52ff]">Specifications</p>
            {preview.specItems.length ? (
              <div className="overflow-hidden rounded border border-slate-200">
                {preview.specItems.slice(0, 5).map((s, i) => (
                  <div
                    key={`${s.label}-${i}`}
                    className={`flex justify-between px-2.5 py-1 text-[10px] ${i % 2 ? "bg-slate-50" : "bg-white"}`}
                  >
                    <span className="font-semibold text-slate-700">{s.label}</span>
                    <span className="text-slate-500">{s.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] italic text-slate-400">Specifications will appear here.</p>
            )}
          </div>

          {/* Gallery */}
          {preview.galleryUrls.length > 0 && (
            <div className="grid shrink-0 grid-cols-2 gap-2">
              {preview.galleryUrls.slice(0, 2).map((url, i) => (
                <div key={i} className="relative aspect-[4/3] overflow-hidden rounded bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url || "/placeholder.svg"} alt={`In action ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer band */}
        <div className="relative bg-[#0e1628] px-5 py-2.5">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-[#8c52ff]" />
          <p className="text-[9px] text-slate-400">Vivid Events · vividevents.ca</p>
        </div>
      </div>
    </div>
  )
}

/** Light client-side parse for the live preview before AI runs. */
function parsePreviewSpecs(specifications: string): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = []
  for (const raw of (specifications || "").split(/\n+/)) {
    const line = raw.trim()
    if (!line) continue
    const m = line.match(/^([^:\-–]{2,40})[:\-–]\s*(.+)$/)
    if (m) rows.push({ label: m[1].trim(), value: m[2].trim() })
    if (rows.length >= 6) break
  }
  return rows
}
