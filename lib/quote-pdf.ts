import "server-only"
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib"

/* Brand palette (mirrors the app's #8c52ff) */
const BRAND = rgb(0.549, 0.322, 1)
const INK = rgb(0.106, 0.145, 0.204) // slate-900-ish
const MUTED = rgb(0.42, 0.47, 0.54)
const LINE = rgb(0.85, 0.87, 0.9)
const GREEN = rgb(0.13, 0.7, 0.46)

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 54

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
  let page = doc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - MARGIN

  const businessName = input.businessName ?? "Vivid Events"
  const businessSite = input.businessSite ?? "vividevents.ca"
  const businessEmail = input.businessEmail ?? ""

  const text = (
    s: string,
    x: number,
    yy: number,
    opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> } = {},
  ) => {
    page.drawText(s, {
      x,
      y: yy,
      size: opts.size ?? 10,
      font: opts.font ?? font,
      color: opts.color ?? INK,
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

  /* ---- Header ---- */
  // Logo mark
  page.drawRectangle({ x: MARGIN, y: y - 30, width: 34, height: 34, color: BRAND })
  text("V", MARGIN + 11, y - 22, { size: 18, font: bold, color: rgb(1, 1, 1) })
  text(businessName, MARGIN + 46, y - 14, { size: 16, font: bold })
  text("Audio · Video · Lighting · Event Production", MARGIN + 46, y - 28, { size: 8.5, color: MUTED })

  // Document title block (right)
  const title = input.kind === "invoice" ? "INVOICE" : "QUOTATION"
  rightText(title, PAGE_W - MARGIN, y - 8, { size: 22, font: bold, color: BRAND })
  const refLabel =
    input.kind === "invoice"
      ? `${input.invoiceNumber ?? input.number}`
      : `${input.number}`
  rightText(`No. ${refLabel}`, PAGE_W - MARGIN, y - 26, { size: 10, color: MUTED })
  rightText(`Date: ${input.issuedDate}`, PAGE_W - MARGIN, y - 40, { size: 10, color: MUTED })

  y -= 58
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 1,
    color: LINE,
  })
  y -= 26

  /* ---- Bill to / event ---- */
  text("BILL TO", MARGIN, y, { size: 8, font: bold, color: MUTED })
  text("EVENT", PAGE_W / 2 + 10, y, { size: 8, font: bold, color: MUTED })
  y -= 15
  text(input.clientName, MARGIN, y, { size: 11, font: bold })
  const ev = input.eventName || "—"
  text(ev, PAGE_W / 2 + 10, y, { size: 11, font: bold })
  y -= 14
  if (input.company) {
    text(input.company, MARGIN, y, { size: 9.5, color: MUTED })
  }
  if (input.eventDate) {
    text(`Date: ${input.eventDate}`, PAGE_W / 2 + 10, y, { size: 9.5, color: MUTED })
  }
  y -= 14
  text(input.clientEmail, MARGIN, y, { size: 9.5, color: MUTED })
  y -= 28

  /* ---- Items table header ---- */
  const colDesc = MARGIN
  const colQty = 350
  const colUnit = 430
  const colAmt = PAGE_W - MARGIN

  page.drawRectangle({
    x: MARGIN - 8,
    y: y - 6,
    width: PAGE_W - 2 * MARGIN + 16,
    height: 22,
    color: rgb(0.96, 0.955, 1),
  })
  text("DESCRIPTION", colDesc, y, { size: 8, font: bold, color: BRAND })
  rightText("QTY", colQty, y, { size: 8, font: bold, color: BRAND })
  rightText("RATE", colUnit, y, { size: 8, font: bold, color: BRAND })
  rightText("AMOUNT", colAmt, y, { size: 8, font: bold, color: BRAND })
  y -= 24

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 120) {
      page = doc.addPage([PAGE_W, PAGE_H])
      y = PAGE_H - MARGIN
    }
  }

  for (const it of input.items) {
    ensureSpace(30)
    const qtyLabel = it.itemType === "labor" ? `${it.quantity} hr` : String(it.quantity)
    text(it.name, colDesc, y, { size: 10, font: bold })
    rightText(qtyLabel, colQty, y, { size: 10 })
    rightText(money(it.unitPrice), colUnit, y, { size: 10 })
    rightText(money(it.lineTotal), colAmt, y, { size: 10 })
    y -= 13
    if (it.description) {
      const desc = it.description.length > 90 ? it.description.slice(0, 89) + "…" : it.description
      text(desc, colDesc, y, { size: 8.5, color: MUTED })
      y -= 12
    }
    y -= 4
    page.drawLine({
      start: { x: MARGIN, y: y + 2 },
      end: { x: PAGE_W - MARGIN, y: y + 2 },
      thickness: 0.5,
      color: LINE,
    })
    y -= 8
  }

  /* ---- Totals ---- */
  y -= 6
  const totalsX = 360
  const drawTotal = (label: string, value: string, opts: { bold?: boolean; color?: ReturnType<typeof rgb> } = {}) => {
    text(label, totalsX, y, { size: opts.bold ? 11 : 10, font: opts.bold ? bold : font, color: opts.color ?? MUTED })
    rightText(value, colAmt, y, {
      size: opts.bold ? 12 : 10,
      font: opts.bold ? bold : font,
      color: opts.color ?? INK,
    })
    y -= opts.bold ? 20 : 16
  }
  drawTotal("Subtotal", money(input.subtotal))
  drawTotal(`Tax (${(input.taxRate * 100).toFixed(0)}%)`, money(input.taxAmount))
  page.drawLine({ start: { x: totalsX, y: y + 6 }, end: { x: colAmt, y: y + 6 }, thickness: 0.75, color: LINE })
  y -= 6
  drawTotal(input.kind === "invoice" ? "Total" : "Quote total", money(input.total), { bold: true, color: BRAND })

  if (input.depositRequired && input.depositTotal > 0) {
    drawTotal("Refundable security deposit", money(input.depositTotal), { color: INK })
    page.drawLine({ start: { x: totalsX, y: y + 6 }, end: { x: colAmt, y: y + 6 }, thickness: 0.75, color: LINE })
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
      y: y + 30,
      size: 46,
      font: bold,
      color: rgb(0.13, 0.7, 0.46),
      opacity: 0.18,
      rotate: { type: "degrees", angle: 14 } as any,
    })
    if (input.paidAt) {
      text(`Paid on ${input.paidAt}`, MARGIN, y + 8, { size: 9, color: GREEN, font: bold })
    }
  }

  y -= 10

  /* ---- Deposit explainer (equipment-only rentals) ---- */
  if (input.depositRequired && input.depositTotal > 0) {
    ensureSpace(60)
    page.drawRectangle({
      x: MARGIN - 8,
      y: y - 44,
      width: PAGE_W - 2 * MARGIN + 16,
      height: 52,
      color: rgb(0.97, 0.97, 0.99),
      borderColor: LINE,
      borderWidth: 0.5,
    })
    text("Security deposit", MARGIN, y - 6, { size: 9, font: bold, color: BRAND })
    const depText =
      "A refundable security deposit is collected on equipment-only rentals (no on-site staff). It is returned in full within 3 business days of the gear being returned undamaged."
      const wrapped = wrapText(depText, font, 8.5, PAGE_W - 2 * MARGIN - 8)
    let dy = y - 20
    for (const ln of wrapped) {
      text(ln, MARGIN, dy, { size: 8.5, color: MUTED })
      dy -= 11
    }
    y -= 60
  }

  /* ---- Notes ---- */
  if (input.notes) {
    ensureSpace(50)
    text("NOTES", MARGIN, y, { size: 8, font: bold, color: MUTED })
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
    ensureSpace(70)
    y -= 10
    page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + 200, y }, thickness: 0.75, color: LINE })
    page.drawLine({ start: { x: PAGE_W - MARGIN - 160, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.75, color: LINE })
    if (input.signatureName) {
      text(input.signatureName, MARGIN, y + 6, { size: 13, font: bold, color: BRAND })
    }
    y -= 12
    text("Authorized signature", MARGIN, y, { size: 8, color: MUTED })
    rightText("Date", PAGE_W - MARGIN, y, { size: 8, color: MUTED })
    y -= 20
    if (input.validUntil) {
      text(`This quotation is valid until ${input.validUntil}.`, MARGIN, y, { size: 9, color: MUTED })
      y -= 14
    }
  }

  /* ---- Footer on every page ---- */
  const pages = doc.getPages()
  for (const p of pages) {
    p.drawLine({
      start: { x: MARGIN, y: MARGIN + 4 },
      end: { x: PAGE_W - MARGIN, y: MARGIN + 4 },
      thickness: 0.5,
      color: LINE,
    })
    p.drawText(`${businessName}  ·  ${businessSite}${businessEmail ? "  ·  " + businessEmail : ""}`, {
      x: MARGIN,
      y: MARGIN - 8,
      size: 8,
      font,
      color: MUTED,
    })
    const thanks = input.kind === "invoice" ? "Thank you for your business." : "We look forward to working with you."
    const tw = font.widthOfTextAtSize(thanks, 8)
    p.drawText(thanks, { x: PAGE_W - MARGIN - tw, y: MARGIN - 8, size: 8, font, color: MUTED })
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
