import "server-only"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage } from "pdf-lib"

/* Brand palette — mirrors the site's dark navy + #8c52ff purple */
const BRAND = rgb(0.549, 0.322, 1) // #8c52ff
const BRAND_DK = rgb(0.42, 0.23, 0.8) // deeper purple for gradients/accents
const NAVY = rgb(0.055, 0.086, 0.157) // #0e1628 header/footer band
const INK = rgb(0.106, 0.145, 0.204) // slate-900-ish body text
const MUTED = rgb(0.42, 0.47, 0.54)
const LINE = rgb(0.88, 0.9, 0.93)
const TINT = rgb(0.965, 0.955, 1) // light purple tint for table header / cards
const ZEBRA = rgb(0.985, 0.982, 1)
const GREEN = rgb(0.13, 0.7, 0.46)
const WHITE = rgb(1, 1, 1)

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 54
const HEADER_H = 118
const FOOTER_H = 42

export type PdfLine = {
  name: string
  description?: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
  itemType?: string
}

export type QuotePdfInput = {
  kind: "quote" | "invoice"
  number: string
  invoiceNumber?: string | null
  issuedDate: string
  clientName: string
  clientEmail: string
  company?: string | null
  eventName?: string | null
  eventDate?: string | null
  eventTime?: string | null
  eventAddress?: string | null
  items: PdfLine[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  depositTotal: number
  depositRequired: boolean
  amountDue: number
  notes?: string | null
  validUntil?: string | null
  paid?: boolean
  paidAt?: string | null
  signatureName?: string | null
  businessName?: string
  businessEmail?: string
  businessSite?: string
}

const money = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

export async function generateQuotePdf(input: QuotePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  // Brand logo for the header band. Falls back to a drawn "V" mark if unavailable.
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

  // Page state
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

  /* ---- Branded header band (drawn per page) ---- */
  const drawHeaderBand = () => {
    // Navy band
    page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: HEADER_H, color: NAVY })
    // Purple accent rule at the base of the band
    page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: 3, color: BRAND })

    if (logo) {
      // Real brand logo (already includes the wordmark), vertically centered in the band
      const logoH = 56
      const logoW = (logo.width / logo.height) * logoH
      page.drawImage(logo, { x: MARGIN, y: PAGE_H - HEADER_H / 2 - logoH / 2, width: logoW, height: logoH })
    } else {
      // Fallback: drawn purple "V" mark + wordmark
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

    // Document title block (right)
    const title = input.kind === "invoice" ? "INVOICE" : "QUOTATION"
    rightText(title, PAGE_W - MARGIN, PAGE_H - 52, { size: 24, font: bold, color: BRAND })
    const refLabel = input.kind === "invoice" ? `${input.invoiceNumber ?? input.number}` : `${input.number}`
    rightText(`No. ${refLabel}`, PAGE_W - MARGIN, PAGE_H - 72, { size: 9.5, color: rgb(0.72, 0.75, 0.83) })
    rightText(`Date: ${input.issuedDate}`, PAGE_W - MARGIN, PAGE_H - 86, { size: 9.5, color: rgb(0.72, 0.75, 0.83) })
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

  /* ---- Bill to / event ---- */
  const midX = PAGE_W / 2 + 6
  text("BILL TO", MARGIN, y, { size: 8, font: bold, color: BRAND })
  text("EVENT", midX, y, { size: 8, font: bold, color: BRAND })
  y -= 16
  text(input.clientName, MARGIN, y, { size: 12, font: bold })
  text(input.eventName || "—", midX, y, { size: 12, font: bold })
  y -= 15
  let leftY = y
  let rightY = y
  if (input.company) {
    text(input.company, MARGIN, leftY, { size: 9.5, color: MUTED })
    leftY -= 13
  }
  text(input.clientEmail, MARGIN, leftY, { size: 9.5, color: MUTED })
  leftY -= 13
  if (input.eventDate) {
    text(`Date: ${input.eventDate}`, midX, rightY, { size: 9.5, color: MUTED })
    rightY -= 13
  }
  if (input.eventTime) {
    text(`Time: ${input.eventTime}`, midX, rightY, { size: 9.5, color: MUTED })
    rightY -= 13
  }
  if (input.eventAddress) {
    // Keep the address on one line; trim overly long values so it can't run
    // past the page margin.
    const maxW = PAGE_W - MARGIN - midX
    let addr = input.eventAddress
    while (addr.length > 4 && font.widthOfTextAtSize(`Location: ${addr}`, 9.5) > maxW) {
      addr = addr.slice(0, -2)
    }
    const label = addr === input.eventAddress ? input.eventAddress : `${addr}…`
    text(`Location: ${label}`, midX, rightY, { size: 9.5, color: MUTED })
    rightY -= 13
  }
  y = Math.min(leftY, rightY) - 16

  /* ---- Items table ---- */
  const colDesc = MARGIN
  const colQty = 348
  const colUnit = 432
  const colAmt = PAGE_W - MARGIN
  const tableX = MARGIN - 10
  const tableW = PAGE_W - 2 * MARGIN + 20

  const drawTableHeader = () => {
    page.drawRectangle({ x: tableX, y: y - 7, width: tableW, height: 24, color: NAVY })
    const ty = y + 1
    text("DESCRIPTION", colDesc, ty, { size: 8, font: bold, color: WHITE })
    rightText("QTY", colQty, ty, { size: 8, font: bold, color: rgb(0.78, 0.72, 1) })
    rightText("RATE", colUnit, ty, { size: 8, font: bold, color: rgb(0.78, 0.72, 1) })
    rightText("AMOUNT", colAmt, ty, { size: 8, font: bold, color: rgb(0.78, 0.72, 1) })
    y -= 30
  }
  drawTableHeader()

  let zebra = false
  for (const it of input.items) {
    if (y - 34 < FOOTER_H + 48) {
      page = doc.addPage([PAGE_W, PAGE_H])
      startPage()
      drawTableHeader()
    }
    const rowH = it.description ? 30 : 20
    if (zebra) {
      page.drawRectangle({ x: tableX, y: y - (rowH - 14), width: tableW, height: rowH, color: ZEBRA })
    }
    zebra = !zebra
    const qtyLabel = it.itemType === "labor" ? `${it.quantity} hr` : String(it.quantity)
    text(it.name, colDesc, y, { size: 10, font: bold })
    rightText(qtyLabel, colQty, y, { size: 10 })
    rightText(money(it.unitPrice), colUnit, y, { size: 10 })
    rightText(money(it.lineTotal), colAmt, y, { size: 10, font: bold })
    y -= 13
    if (it.description) {
      const desc = it.description.length > 96 ? it.description.slice(0, 95) + "…" : it.description
      text(desc, colDesc, y, { size: 8.5, color: MUTED })
      y -= 12
    }
    y -= 5
    page.drawLine({ start: { x: tableX, y: y + 2 }, end: { x: tableX + tableW, y: y + 2 }, thickness: 0.5, color: LINE })
    y -= 9
  }

  /* ---- Totals block (right-aligned card) ---- */
  ensureSpace(120)
  y -= 4
  const totalsLabelX = 356
  const drawTotal = (
    label: string,
    value: string,
    opts: { bold?: boolean; color?: ReturnType<typeof rgb> } = {},
  ) => {
    text(label, totalsLabelX, y, {
      size: opts.bold ? 11 : 10,
      font: opts.bold ? bold : font,
      color: opts.color ?? MUTED,
    })
    rightText(value, colAmt, y, {
      size: opts.bold ? 12 : 10,
      font: opts.bold ? bold : font,
      color: opts.color ?? INK,
    })
    y -= opts.bold ? 20 : 16
  }
  drawTotal("Subtotal", money(input.subtotal))
  drawTotal(`Tax (${(input.taxRate * 100).toFixed(0)}%)`, money(input.taxAmount))
  page.drawLine({ start: { x: totalsLabelX, y: y + 6 }, end: { x: colAmt, y: y + 6 }, thickness: 0.75, color: LINE })
  y -= 6

  // Highlighted primary total on a soft purple band
  const totalLabel = input.kind === "invoice" ? "Total" : "Quote total"
  page.drawRectangle({ x: totalsLabelX - 12, y: y - 5, width: colAmt - totalsLabelX + 24, height: 22, color: TINT })
  drawTotal(totalLabel, money(input.total), { bold: true, color: BRAND })

  if (input.depositRequired && input.depositTotal > 0) {
    drawTotal("Refundable security deposit", money(input.depositTotal), { color: INK })
    page.drawLine({ start: { x: totalsLabelX, y: y + 6 }, end: { x: colAmt, y: y + 6 }, thickness: 0.75, color: LINE })
    y -= 6
    drawTotal(input.paid ? "Amount paid" : "Amount due", money(input.amountDue), {
      bold: true,
      color: input.paid ? GREEN : INK,
    })
  } else if (input.paid) {
    drawTotal("Amount paid", money(input.amountDue), { bold: true, color: GREEN })
  }

  /* ---- PAID stamp ---- */
  if (input.paid) {
    page.drawText("PAID", {
      x: MARGIN + 6,
      y: y + 34,
      size: 46,
      font: bold,
      color: GREEN,
      opacity: 0.16,
      rotate: { type: "degrees", angle: 14 } as any,
    })
    if (input.paidAt) {
      text(`Paid on ${input.paidAt}`, MARGIN, y + 12, { size: 9, color: GREEN, font: bold })
    }
  }

  y -= 12

  /* ---- Deposit explainer (equipment-only rentals) ---- */
  if (input.depositRequired && input.depositTotal > 0) {
    ensureSpace(66)
    page.drawRectangle({
      x: tableX,
      y: y - 46,
      width: tableW,
      height: 56,
      color: TINT,
      borderColor: rgb(0.85, 0.82, 0.98),
      borderWidth: 0.75,
    })
    page.drawRectangle({ x: tableX, y: y - 46, width: 3, height: 56, color: BRAND })
    text("Security deposit", MARGIN, y - 6, { size: 9, font: bold, color: BRAND })
    const depText =
      "A refundable security deposit is collected on equipment-only rentals (no on-site staff). It is returned in full within 3 business days of the gear being returned undamaged."
    const wrapped = wrapText(depText, font, 8.5, tableW - 24)
    let dy = y - 20
    for (const ln of wrapped) {
      text(ln, MARGIN, dy, { size: 8.5, color: MUTED })
      dy -= 11
    }
    y -= 66
  }

  /* ---- Notes ---- */
  if (input.notes) {
    ensureSpace(50)
    text("NOTES", MARGIN, y, { size: 8, font: bold, color: BRAND })
    y -= 14
    for (const ln of wrapText(input.notes, font, 9.5, PAGE_W - 2 * MARGIN)) {
      ensureSpace(14)
      text(ln, MARGIN, y, { size: 9.5, color: INK })
      y -= 13
    }
    y -= 10
  }

  /* ---- Signature block (quote only) ---- */
  if (input.kind === "quote") {
    ensureSpace(80)
    y -= 12
    page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + 200, y }, thickness: 0.75, color: rgb(0.6, 0.63, 0.7) })
    page.drawLine({
      start: { x: PAGE_W - MARGIN - 160, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.75,
      color: rgb(0.6, 0.63, 0.7),
    })
    if (input.signatureName) {
      text(input.signatureName, MARGIN, y + 6, { size: 13, font: bold, color: BRAND })
    }
    y -= 13
    text("Authorized signature", MARGIN, y, { size: 8, color: MUTED })
    rightText("Date", PAGE_W - MARGIN, y, { size: 8, color: MUTED })
    y -= 20
    if (input.validUntil) {
      text(`This quotation is valid until ${input.validUntil}.`, MARGIN, y, { size: 9, color: MUTED })
      y -= 14
    }
  }

  /* ---- Footer band on every page ---- */
  const thanks = input.kind === "invoice" ? "Thank you for your business." : "We look forward to working with you."
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
