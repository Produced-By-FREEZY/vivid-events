import "server-only"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage } from "pdf-lib"

/* Brand palette — mirrors the Quote/Invoice PDFs (dark navy + #8c52ff purple) */
const BRAND = rgb(0.549, 0.322, 1) // #8c52ff
const BRAND_DK = rgb(0.42, 0.23, 0.8)
const NAVY = rgb(0.055, 0.086, 0.157) // #0e1628 header/footer band
const INK = rgb(0.106, 0.145, 0.204)
const MUTED = rgb(0.42, 0.47, 0.54)
const LINE = rgb(0.88, 0.9, 0.93)
const TINT = rgb(0.965, 0.955, 1)
const ZEBRA = rgb(0.985, 0.982, 1)
const WHITE = rgb(1, 1, 1)

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 54
const HEADER_H = 118
const FOOTER_H = 42

export type DataSheetImage = {
  /** raw bytes of the image */
  bytes: Uint8Array
  /** "png" | "jpg" */
  format: "png" | "jpg"
}

export type DataSheetPdfInput = {
  productName: string
  tagline: string
  marketingCopy: string
  specItems: { label: string; value: string }[]
  issuedDate: string
  hero?: DataSheetImage | null
  gallery?: DataSheetImage[]
  businessName?: string
  businessSite?: string
  businessEmail?: string
}

export async function generateDataSheetPdf(input: DataSheetPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let logo: PDFImage | null = null
  try {
    const logoBytes = await readFile(path.join(process.cwd(), "public", "images", "vivid-events-logo.png"))
    logo = await doc.embedPng(logoBytes)
  } catch {
    logo = null
  }

  const businessName = input.businessName ?? "Vivid Events"
  const businessSite = input.businessSite ?? "vividevents.ca"
  const businessEmail = input.businessEmail ?? ""

  const embedImage = async (img?: DataSheetImage | null): Promise<PDFImage | null> => {
    if (!img) return null
    try {
      return img.format === "png" ? await doc.embedPng(img.bytes) : await doc.embedJpg(img.bytes)
    } catch {
      return null
    }
  }

  const heroImg = await embedImage(input.hero)
  const galleryImgs: PDFImage[] = []
  for (const g of input.gallery ?? []) {
    const embedded = await embedImage(g)
    if (embedded) galleryImgs.push(embedded)
  }

  let page = doc.addPage([PAGE_W, PAGE_H])
  let y = 0

  const text = (
    s: string,
    x: number,
    yy: number,
    opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; opacity?: number } = {},
  ) => {
    page.drawText(s, {
      x,
      y: yy,
      size: opts.size ?? 10,
      font: opts.font ?? font,
      color: opts.color ?? INK,
      opacity: opts.opacity,
    })
  }

  const rightText = (
    s: string,
    xRight: number,
    yy: number,
    opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> } = {},
  ) => {
    const f = opts.font ?? font
    const size = opts.size ?? 10
    const w = f.widthOfTextAtSize(s, size)
    text(s, xRight - w, yy, opts)
  }

  const drawHeaderBand = () => {
    page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: HEADER_H, color: NAVY })
    page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: 3, color: BRAND })

    if (logo) {
      const logoH = 56
      const logoW = (logo.width / logo.height) * logoH
      page.drawImage(logo, { x: MARGIN, y: PAGE_H - HEADER_H / 2 - logoH / 2, width: logoW, height: logoH })
    } else {
      const logoX = MARGIN
      const logoY = PAGE_H - 74
      page.drawRectangle({ x: logoX, y: logoY, width: 40, height: 40, color: BRAND_DK })
      page.drawRectangle({ x: logoX, y: logoY + 3, width: 40, height: 37, color: BRAND })
      text("V", logoX + 12.5, logoY + 11, { size: 22, font: bold, color: WHITE })
      text(businessName, logoX + 54, PAGE_H - 52, { size: 18, font: bold, color: WHITE })
      text("Audio  ·  Video  ·  Lighting  ·  Event Production", logoX + 54, PAGE_H - 70, {
        size: 8.5,
        color: rgb(0.62, 0.66, 0.75),
      })
    }

    rightText("DATA SHEET", PAGE_W - MARGIN, PAGE_H - 52, { size: 24, font: bold, color: BRAND })
    rightText(`Issued: ${input.issuedDate}`, PAGE_W - MARGIN, PAGE_H - 72, {
      size: 9.5,
      color: rgb(0.72, 0.75, 0.83),
    })
  }

  const startPage = () => {
    drawHeaderBand()
    y = PAGE_H - HEADER_H - 34
  }

  const ensureSpace = (needed: number) => {
    if (y - needed < FOOTER_H + 48) {
      page = doc.addPage([PAGE_W, PAGE_H])
      startPage()
    }
  }

  startPage()

  /* ---- Product title + tagline ---- */
  for (const ln of wrapText(input.productName || "Product", bold, 22, PAGE_W - 2 * MARGIN)) {
    ensureSpace(28)
    text(ln, MARGIN, y, { size: 22, font: bold, color: INK })
    y -= 26
  }
  if (input.tagline) {
    y -= 2
    for (const ln of wrapText(input.tagline, font, 12, PAGE_W - 2 * MARGIN)) {
      ensureSpace(16)
      text(ln, MARGIN, y, { size: 12, font, color: BRAND })
      y -= 16
    }
  }
  y -= 10

  /* ---- Hero image ---- */
  if (heroImg) {
    const maxW = PAGE_W - 2 * MARGIN
    const heroH = 230
    const scale = Math.min(maxW / heroImg.width, heroH / heroImg.height)
    const w = heroImg.width * scale
    const h = heroImg.height * scale
    ensureSpace(h + 16)
    const x = MARGIN + (maxW - w) / 2
    // Soft framing background band behind the hero.
    page.drawRectangle({ x: MARGIN, y: y - h - 6, width: maxW, height: h + 12, color: TINT })
    page.drawImage(heroImg, { x, y: y - h, width: w, height: h })
    page.drawRectangle({ x: MARGIN, y: y - h - 6, width: 4, height: h + 12, color: BRAND })
    y -= h + 22
  }

  /* ---- Marketing copy ---- */
  if (input.marketingCopy) {
    ensureSpace(30)
    text("OVERVIEW", MARGIN, y, { size: 8, font: bold, color: BRAND })
    y -= 16
    for (const para of input.marketingCopy.split(/\n{2,}|\n/)) {
      if (!para.trim()) {
        y -= 6
        continue
      }
      for (const ln of wrapText(para.trim(), font, 10, PAGE_W - 2 * MARGIN)) {
        ensureSpace(14)
        text(ln, MARGIN, y, { size: 10, color: INK })
        y -= 14
      }
      y -= 6
    }
    y -= 6
  }

  /* ---- Specifications table ---- */
  if (input.specItems.length) {
    ensureSpace(40)
    text("SPECIFICATIONS", MARGIN, y, { size: 8, font: bold, color: BRAND })
    y -= 14

    const tableX = MARGIN - 10
    const tableW = PAGE_W - 2 * MARGIN + 20
    const labelX = MARGIN
    const valueX = PAGE_W / 2 + 6

    // Header row
    page.drawRectangle({ x: tableX, y: y - 7, width: tableW, height: 24, color: NAVY })
    text("SPECIFICATION", labelX, y + 1, { size: 8, font: bold, color: WHITE })
    text("DETAIL", valueX, y + 1, { size: 8, font: bold, color: rgb(0.78, 0.72, 1) })
    y -= 30

    let zebra = false
    for (const spec of input.specItems) {
      const valueLines = wrapText(spec.value, font, 10, PAGE_W - MARGIN - valueX)
      const labelLines = wrapText(spec.label, bold, 10, valueX - labelX - 10)
      const rows = Math.max(valueLines.length, labelLines.length)
      const rowH = 8 + rows * 13

      if (y - rowH < FOOTER_H + 48) {
        page = doc.addPage([PAGE_W, PAGE_H])
        startPage()
        page.drawRectangle({ x: tableX, y: y - 7, width: tableW, height: 24, color: NAVY })
        text("SPECIFICATION", labelX, y + 1, { size: 8, font: bold, color: WHITE })
        text("DETAIL", valueX, y + 1, { size: 8, font: bold, color: rgb(0.78, 0.72, 1) })
        y -= 30
      }

      if (zebra) {
        page.drawRectangle({ x: tableX, y: y - (rowH - 14), width: tableW, height: rowH, color: ZEBRA })
      }
      zebra = !zebra

      let ly = y
      for (const ln of labelLines) {
        text(ln, labelX, ly, { size: 10, font: bold, color: INK })
        ly -= 13
      }
      let vy = y
      for (const ln of valueLines) {
        text(ln, valueX, vy, { size: 10, color: INK })
        vy -= 13
      }
      y -= rowH
      page.drawLine({
        start: { x: tableX, y: y + 6 },
        end: { x: tableX + tableW, y: y + 6 },
        thickness: 0.5,
        color: LINE,
      })
      y -= 4
    }
    y -= 10
  }

  /* ---- Gallery: product in action ---- */
  if (galleryImgs.length) {
    ensureSpace(30)
    text("IN ACTION", MARGIN, y, { size: 8, font: bold, color: BRAND })
    y -= 16

    const gap = 12
    const cols = Math.min(galleryImgs.length, 2)
    const cellW = (PAGE_W - 2 * MARGIN - gap * (cols - 1)) / cols
    const cellH = 120

    // Lay out in rows of `cols`.
    for (let i = 0; i < galleryImgs.length; i += cols) {
      ensureSpace(cellH + 12)
      const rowImgs = galleryImgs.slice(i, i + cols)
      rowImgs.forEach((img, idx) => {
        const scale = Math.min(cellW / img.width, cellH / img.height)
        const w = img.width * scale
        const h = img.height * scale
        const cellX = MARGIN + idx * (cellW + gap)
        const x = cellX + (cellW - w) / 2
        const imgY = y - cellH + (cellH - h) / 2
        page.drawRectangle({ x: cellX, y: y - cellH, width: cellW, height: cellH, color: TINT })
        page.drawImage(img, { x, y: imgY, width: w, height: h })
      })
      y -= cellH + gap
    }
  }

  /* ---- Footer band on every page ---- */
  const thanks = "Ready when you are — let's make it unforgettable."
  for (const p of doc.getPages()) {
    p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: FOOTER_H, color: NAVY })
    p.drawRectangle({ x: 0, y: FOOTER_H - 2, width: PAGE_W, height: 2, color: BRAND })
    const info = `${businessName}   ·   ${businessSite}${businessEmail ? "   ·   " + businessEmail : ""}`
    p.drawText(info, { x: MARGIN, y: FOOTER_H / 2 - 4, size: 8, font, color: rgb(0.72, 0.75, 0.83) })
    const tw = font.widthOfTextAtSize(thanks, 8)
    p.drawText(thanks, { x: PAGE_W - MARGIN - tw, y: FOOTER_H / 2 - 4, size: 8, font, color: rgb(0.72, 0.75, 0.83) })
  }

  return doc.save()
}

function wrapText(str: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = []
  for (const rawLine of str.split(/\n/)) {
    const words = rawLine.split(/\s+/)
    let line = ""
    for (const w of words) {
      const test = line ? line + " " + w : w
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        out.push(line)
        line = w
      } else {
        line = test
      }
    }
    out.push(line)
  }
  return out
}
