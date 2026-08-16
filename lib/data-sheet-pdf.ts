import "server-only"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage } from "pdf-lib"

/* Brand palette — mirrors the Quote/Invoice PDFs (dark navy + #8c52ff purple) */
const BRAND = rgb(0.549, 0.322, 1) // #8c52ff
const BRAND_DK = rgb(0.42, 0.23, 0.8)
const BRAND_LT = rgb(0.78, 0.72, 1)
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
const CONTENT_W = PAGE_W - 2 * MARGIN
const HEADER_H = 118
const FOOTER_H = 42
const CONTENT_BOTTOM = FOOTER_H + 40 // keep clear of the footer band

/* Consistent vertical rhythm */
const SECTION_GAP = 26 // between major sections
const LABEL_GAP = 14 // between a section label and its content
const LINE_H = 14 // body line height

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

    rightText("DATA SHEET", PAGE_W - MARGIN, PAGE_H - 56, { size: 24, font: bold, color: BRAND })
    rightText(`Issued: ${input.issuedDate}`, PAGE_W - MARGIN, PAGE_H - 76, {
      size: 9.5,
      color: rgb(0.72, 0.75, 0.83),
    })
  }

  const startPage = () => {
    drawHeaderBand()
    y = PAGE_H - HEADER_H - 36
  }

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H])
    startPage()
  }

  const ensureSpace = (needed: number) => {
    if (y - needed < CONTENT_BOTTOM) newPage()
  }

  /** Small purple section label (e.g. OVERVIEW) with consistent spacing. */
  const sectionLabel = (label: string) => {
    ensureSpace(LABEL_GAP + 24)
    text(label.toUpperCase(), MARGIN, y, { size: 8.5, font: bold, color: BRAND })
    y -= LABEL_GAP
  }

  startPage()

  /* ---- Product title + tagline ---- */
  for (const ln of wrapText(input.productName || "Product", bold, 22, CONTENT_W)) {
    ensureSpace(28)
    text(ln, MARGIN, y, { size: 22, font: bold, color: INK })
    y -= 27
  }
  if (input.tagline) {
    y -= 2
    for (const ln of wrapText(input.tagline, font, 12, CONTENT_W)) {
      ensureSpace(17)
      text(ln, MARGIN, y, { size: 12, font, color: BRAND })
      y -= 17
    }
  }
  y -= SECTION_GAP - 6

  /* ---- Hero image ---- */
  if (heroImg) {
    const heroH = 236
    const scale = Math.min(CONTENT_W / heroImg.width, heroH / heroImg.height)
    const w = heroImg.width * scale
    const h = heroImg.height * scale
    ensureSpace(h + 12)
    const x = MARGIN + (CONTENT_W - w) / 2
    // Soft framing band behind the hero + purple accent rule.
    page.drawRectangle({ x: MARGIN, y: y - h - 6, width: CONTENT_W, height: h + 12, color: TINT })
    page.drawRectangle({ x: MARGIN, y: y - h - 6, width: 4, height: h + 12, color: BRAND })
    page.drawImage(heroImg, { x, y: y - h, width: w, height: h })
    y -= h + SECTION_GAP
  }

  /* ---- Marketing copy ---- */
  if (input.marketingCopy) {
    sectionLabel("Overview")
    const paras = input.marketingCopy.split(/\n{2,}|\n/)
    for (let p = 0; p < paras.length; p++) {
      const para = paras[p].trim()
      if (!para) continue
      for (const ln of wrapText(para, font, 10, CONTENT_W)) {
        ensureSpace(LINE_H)
        text(ln, MARGIN, y, { size: 10, color: INK })
        y -= LINE_H
      }
      if (p < paras.length - 1) y -= 6
    }
    y -= SECTION_GAP
  }

  /* ---- Specifications table ---- */
  if (input.specItems.length) {
    sectionLabel("Specifications")

    const tableX = MARGIN
    const tableW = CONTENT_W
    const labelX = tableX + 14
    const valueX = tableX + tableW * 0.46
    const labelColW = valueX - labelX - 12
    const valueColW = tableX + tableW - valueX - 14
    const HEADER_ROW_H = 24
    const ROW_PAD = 9

    const drawTableHeader = () => {
      // Band sits directly below the current cursor; text vertically centered.
      page.drawRectangle({ x: tableX, y: y - HEADER_ROW_H, width: tableW, height: HEADER_ROW_H, color: NAVY })
      text("SPECIFICATION", labelX, y - 16, { size: 8, font: bold, color: WHITE })
      text("DETAIL", valueX, y - 16, { size: 8, font: bold, color: BRAND_LT })
      y -= HEADER_ROW_H
    }

    ensureSpace(HEADER_ROW_H + 40)
    drawTableHeader()

    let zebra = false
    for (const spec of input.specItems) {
      const labelLines = wrapText(spec.label, bold, 10, labelColW)
      const valueLines = wrapText(spec.value, font, 10, valueColW)
      const rows = Math.max(labelLines.length, valueLines.length)
      const rowH = ROW_PAD * 2 + (rows - 1) * 13 + 2

      // Page break carries the table header over.
      if (y - rowH < CONTENT_BOTTOM) {
        newPage()
        drawTableHeader()
      }

      const rowTop = y
      if (zebra) {
        page.drawRectangle({ x: tableX, y: rowTop - rowH, width: tableW, height: rowH, color: ZEBRA })
      }
      zebra = !zebra

      let ly = rowTop - ROW_PAD - 4
      for (const ln of labelLines) {
        text(ln, labelX, ly, { size: 10, font: bold, color: INK })
        ly -= 13
      }
      let vy = rowTop - ROW_PAD - 4
      for (const ln of valueLines) {
        text(ln, valueX, vy, { size: 10, color: MUTED })
        vy -= 13
      }

      y = rowTop - rowH
      page.drawLine({
        start: { x: tableX, y },
        end: { x: tableX + tableW, y },
        thickness: 0.75,
        color: LINE,
      })
    }
    y -= SECTION_GAP
  }

  /* ---- Gallery: product in action ---- */
  if (galleryImgs.length) {
    sectionLabel("In Action")

    const gap = 12
    const cols = 2
    const cellW = (CONTENT_W - gap * (cols - 1)) / cols
    const cellH = 132

    for (let i = 0; i < galleryImgs.length; i += cols) {
      ensureSpace(cellH + gap)
      const rowImgs = galleryImgs.slice(i, i + cols)
      rowImgs.forEach((img, idx) => {
        const cellX = MARGIN + idx * (cellW + gap)
        const cellTop = y
        // Framed tile.
        page.drawRectangle({ x: cellX, y: cellTop - cellH, width: cellW, height: cellH, color: TINT })
        const scale = Math.min(cellW / img.width, cellH / img.height)
        const w = img.width * scale
        const h = img.height * scale
        const x = cellX + (cellW - w) / 2
        const imgY = cellTop - cellH + (cellH - h) / 2
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
