import "server-only"
import nodemailer from "nodemailer"
import MailComposer from "nodemailer/lib/mail-composer"
import { ImapFlow } from "imapflow"

/**
 * Gmail / Google Workspace SMTP transport.
 *
 * GMAIL_USER            → the business address, e.g. info@vividevents.ca
 * GMAIL_APP_PASSWORD    → a 16-char Google App Password (NOT the login password).
 *                         Generated at myaccount.google.com/apppasswords with
 *                         2-Step Verification enabled.
 */
const FROM_NAME = "Vivid Events"
const BRAND = "#8c52ff"

let cached: nodemailer.Transporter | null = null

export function isEmailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
}

function getTransport() {
  if (cached) return cached
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) {
    throw new Error("Email is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD.")
  }
  cached = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  })
  return cached
}

function fromHeader() {
  return `"${FROM_NAME}" <${process.env.GMAIL_USER}>`
}

type Attachment = {
  filename: string
  content: Buffer | Uint8Array
  contentType?: string
}

type SendArgs = {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  attachments?: Attachment[]
}

export async function sendMail({ to, subject, html, text, replyTo, attachments }: SendArgs) {
  const transport = getTransport()
  await transport.sendMail({
    from: fromHeader(),
    to,
    subject,
    html,
    text,
    replyTo: replyTo ?? process.env.GMAIL_USER,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content instanceof Buffer ? a.content : Buffer.from(a.content),
      contentType: a.contentType ?? "application/pdf",
    })),
  })
}

/**
 * Compose the message as raw MIME and APPEND it to the Gmail "Drafts" folder
 * over IMAP. Nothing is sent — the owner opens Gmail, reviews, and hits Send.
 * Uses the same GMAIL_USER / GMAIL_APP_PASSWORD credentials as SMTP.
 */
export async function saveGmailDraft({ to, subject, html, text, replyTo, attachments }: SendArgs) {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) {
    throw new Error("Email is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD.")
  }

  // Build a proper RFC822 message (headers + body + attachments).
  const raw = await new MailComposer({
    from: fromHeader(),
    to,
    subject,
    html,
    text,
    replyTo: replyTo ?? user,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content instanceof Buffer ? a.content : Buffer.from(a.content),
      contentType: a.contentType ?? "application/pdf",
    })),
  })
    .compile()
    .build()

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  })

  await client.connect()
  try {
    // Gmail exposes Drafts as a special-use mailbox; fall back to the localized name.
    let mailbox = "[Gmail]/Drafts"
    try {
      const drafts = await client.getMailboxLock("[Gmail]/Drafts")
      drafts.release()
    } catch {
      mailbox = "Drafts"
    }
    // \Draft flag so Gmail treats it as an editable draft, not a received message.
    await client.append(mailbox, raw, ["\\Draft"], new Date())
  } finally {
    await client.logout().catch(() => {})
  }
}

/* --------------------------- Owner-editable templates -------------------------- */

export type QuoteEmailTemplate = {
  subject: string
  body: string
  signerName: string
}

export type QuoteTemplateVars = {
  first_name: string
  event_name: string
  quote_number: string
  review_link: string
  signer_name: string
}

/** Replace {placeholder} tokens (case-insensitive) with their values. */
function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_m, key: string) => {
    const v = vars[key.toLowerCase()]
    return v == null ? "" : v
  })
}

/**
 * Build the quote email from the owner's saved template (subject + body from
 * portal_settings). The body is plain text the owner wrote; we render an HTML
 * version that preserves their line breaks and turns the review link into a
 * button, so it still reads like a personally typed email.
 */
export function renderQuoteEmail(template: QuoteEmailTemplate, vars: QuoteTemplateVars) {
  const values: Record<string, string> = {
    first_name: vars.first_name,
    event_name: vars.event_name,
    quote_number: vars.quote_number,
    review_link: vars.review_link,
    signer_name: vars.signer_name || template.signerName || "Vivid Events",
  }

  const subject = renderTemplate(template.subject, values).trim()
  const text = renderTemplate(template.body, values)

  // HTML: escape, keep newlines, and linkify the review URL if present.
  const htmlBody = escapeHtml(text)
    .replace(
      new RegExp(escapeRegExp(values.review_link), "g"),
      `<a href="${values.review_link}" style="color:#8c52ff;font-weight:600;text-decoration:underline;">${values.review_link}</a>`,
    )
    .replace(/\n/g, "<br/>")

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#ffffff;">
    <div style="max-width:600px;margin:0 auto;padding:20px 4px;color:#1f2937;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">
      ${htmlBody}
    </div>
  </body>
</html>`

  return { subject, html, text }
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Render an owner-editable plain-text email (subject + body they typed) into a
 * clean HTML + text pair. Any values passed in `links` are turned into buttons/
 * anchors so pasted URLs read like real links, exactly like the quote email.
 */
function renderEditableEmail(
  subjectTpl: string,
  bodyTpl: string,
  values: Record<string, string>,
  links: string[] = [],
) {
  const subject = renderTemplate(subjectTpl, values).trim()
  const text = renderTemplate(bodyTpl, values)

  let htmlBody = escapeHtml(text)
  for (const link of links) {
    if (!link) continue
    htmlBody = htmlBody.replace(
      new RegExp(escapeRegExp(link), "g"),
      `<a href="${link}" style="color:#8c52ff;font-weight:600;text-decoration:underline;">${link}</a>`,
    )
  }
  htmlBody = htmlBody.replace(/\n/g, "<br/>")

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#ffffff;">
    <div style="max-width:600px;margin:0 auto;padding:20px 4px;color:#1f2937;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">
      ${htmlBody}
    </div>
  </body>
</html>`

  return { subject, html, text }
}

export type PaidEmailTemplate = { subject: string; body: string; signerName: string }
export type PaidTemplateVars = {
  first_name: string
  event_name: string
  invoice_number: string
  receipt_link: string
  signer_name: string
}

/** Owner-editable "payment received / booking confirmed" email to the customer. */
export function renderPaidEmail(template: PaidEmailTemplate, vars: PaidTemplateVars) {
  const values: Record<string, string> = {
    first_name: vars.first_name,
    event_name: vars.event_name,
    invoice_number: vars.invoice_number,
    receipt_link: vars.receipt_link,
    signer_name: vars.signer_name || template.signerName || "Vivid Events",
  }
  return renderEditableEmail(template.subject, template.body, values, [vars.receipt_link])
}

export type DepositReleasedTemplate = { subject: string; body: string; signerName: string }
export type DepositReleasedVars = {
  first_name: string
  event_name: string
  invoice_number: string
  deposit_refund_amount: string
  signer_name: string
}

/** Owner-editable "your security deposit has been released" email to the customer. */
export function renderDepositReleasedEmail(template: DepositReleasedTemplate, vars: DepositReleasedVars) {
  const values: Record<string, string> = {
    first_name: vars.first_name,
    event_name: vars.event_name,
    invoice_number: vars.invoice_number,
    deposit_refund_amount: vars.deposit_refund_amount,
    signer_name: vars.signer_name || template.signerName || "Vivid Events",
  }
  return renderEditableEmail(template.subject, template.body, values, [])
}

/**
 * Professional, branded email sent to the OWNER after a customer pays a quote
 * that carried a refundable security deposit. Contains a single one-click
 * "Release deposit" button that opens the secure release page (no login).
 */
type DepositReleaseRequestArgs = {
  clientName: string
  eventName?: string | null
  eventDate?: string | null
  invoiceNumber: string
  depositAmount: number
  quotedTotal: number
  releaseUrl: string
}

export function depositReleaseRequestEmail(a: DepositReleaseRequestArgs) {
  const eventLine = a.eventName ? escapeHtml(a.eventName) : "the event"
  const dateLine = a.eventDate ? new Date(a.eventDate).toLocaleDateString("en-CA", { dateStyle: "full" } as any) : null

  const inner = `
    <h1 style="color:#fff;font-size:20px;margin:0 0 6px;">Security deposit ready to release</h1>
    <p style="margin:0 0 20px;color:#94a3b8;">${escapeHtml(a.clientName)} has paid in full for ${eventLine}${
      dateLine ? ` on ${escapeHtml(dateLine)}` : ""
    }. Their refundable security deposit is being held and can be released back to them once the event is over and all gear is returned undamaged.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:0 0 24px;">
      <tr><td style="padding:8px 0;color:#94a3b8;">Invoice</td><td style="padding:8px 0;text-align:right;color:#e2e8f0;">${escapeHtml(a.invoiceNumber)}</td></tr>
      <tr><td style="padding:8px 0;color:#94a3b8;border-top:1px solid #334155;">Quoted total (kept)</td><td style="padding:8px 0;text-align:right;color:#e2e8f0;border-top:1px solid #334155;">${money(a.quotedTotal)}</td></tr>
      <tr><td style="padding:8px 0;color:#fff;font-weight:700;border-top:1px solid #334155;">Deposit to release</td><td style="padding:8px 0;text-align:right;color:${BRAND};font-weight:700;border-top:1px solid #334155;">${money(a.depositAmount)}</td></tr>
    </table>

    <div style="text-align:center;margin:0 0 22px;">
      <a href="${a.releaseUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 30px;border-radius:10px;">Release ${money(a.depositAmount)} deposit</a>
    </div>

    <p style="margin:0 0 6px;color:#94a3b8;font-size:13px;">Only click this once ${escapeHtml(
      a.clientName,
    )} has returned everything undamaged. The refund is processed instantly through Stripe against their original payment, and they'll get an automatic confirmation. The quoted total stays collected.</p>
    <p style="margin:14px 0 0;color:#64748b;font-size:12px;">If the button doesn't work, copy this link into your browser:<br/><span style="color:#94a3b8;">${a.releaseUrl}</span></p>
  `

  const text = `Security deposit ready to release

${a.clientName} has paid in full for ${a.eventName || "the event"}${dateLine ? ` on ${dateLine}` : ""}.

Invoice: ${a.invoiceNumber}
Quoted total (kept): ${money(a.quotedTotal)}
Deposit to release: ${money(a.depositAmount)}

Release the deposit here (only once all gear is back undamaged):
${a.releaseUrl}

The refund is processed instantly through Stripe against their original payment and they'll get an automatic confirmation. The quoted total stays collected.`

  return {
    subject: `Release ${money(a.depositAmount)} deposit — ${a.clientName} (${a.invoiceNumber})`,
    html: shell(inner),
    text,
  }
}

/** Build a minimal RFC5545 VEVENT for an all-day booking so it drops into any calendar. */
function buildIcs(a: { uid: string; title: string; date: string; description?: string; location?: string }) {
  // All-day event: DTSTART;VALUE=DATE and DTEND the following day.
  const start = a.date.replace(/-/g, "")
  const end = (() => {
    const d = new Date(a.date + "T00:00:00")
    d.setDate(d.getDate() + 1)
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
  })()
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n")
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vivid Events//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${a.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${esc(a.title)}`,
    a.description ? `DESCRIPTION:${esc(a.description)}` : "",
    a.location ? `LOCATION:${esc(a.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean)
  return lines.join("\r\n")
}

type BookingConfirmationArgs = {
  audience: "client" | "owner"
  clientName: string
  eventName?: string | null
  eventDate: string
  invoiceNumber: string
  quoteNumber: string
}

/**
 * Calendar booking confirmation with an attached .ics invite. Sent to both the
 * customer and the owner once payment is confirmed and the event has a date.
 */
export function bookingConfirmationEmail(a: BookingConfirmationArgs) {
  const first = firstNameOfLocal(a.clientName)
  const prettyDate = new Date(a.eventDate + "T00:00:00").toLocaleDateString("en-CA", { dateStyle: "full" } as any)
  const title = `Vivid Events — ${a.eventName || "Event"} (${a.clientName})`
  const ics = buildIcs({
    uid: `${a.quoteNumber}@vividevents.ca`,
    title,
    date: a.eventDate,
    description: `Booking ${a.invoiceNumber} for ${a.clientName}.`,
  })

  const inner =
    a.audience === "client"
      ? `
    <h1 style="color:#fff;font-size:20px;margin:0 0 6px;">Your event is booked in 🎉</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(first)}, this is your calendar confirmation for <strong style="color:#fff;">${escapeHtml(
      a.eventName || "your event",
    )}</strong> on <strong style="color:#fff;">${escapeHtml(prettyDate)}</strong>.</p>
    <p style="margin:0 0 16px;">We've attached a calendar invite (.ics) you can add to your own calendar with one tap. We'll be in touch closer to the date to finalise timings.</p>
    <p style="margin:0;color:#94a3b8;font-size:13px;">Booking reference: ${escapeHtml(a.invoiceNumber)}</p>`
      : `
    <h1 style="color:#fff;font-size:20px;margin:0 0 6px;">New booking confirmed</h1>
    <p style="margin:0 0 16px;"><strong style="color:#fff;">${escapeHtml(a.clientName)}</strong> is booked for <strong style="color:#fff;">${escapeHtml(
      a.eventName || "an event",
    )}</strong> on <strong style="color:#fff;">${escapeHtml(prettyDate)}</strong>.</p>
    <p style="margin:0 0 16px;">It's been added to your portal calendar. The attached .ics will drop it into your own calendar too.</p>
    <p style="margin:0;color:#94a3b8;font-size:13px;">Invoice ${escapeHtml(a.invoiceNumber)} · Quote ${escapeHtml(a.quoteNumber)}</p>`

  const text =
    a.audience === "client"
      ? `Hi ${first},\n\nYour event "${a.eventName || "your event"}" is booked in for ${prettyDate}. A calendar invite is attached so you can add it to your own calendar.\n\nBooking reference: ${a.invoiceNumber}\n\n— Vivid Events`
      : `New booking confirmed: ${a.clientName} — ${a.eventName || "an event"} on ${prettyDate}. Invoice ${a.invoiceNumber} / Quote ${a.quoteNumber}. A calendar invite is attached.`

  return {
    subject:
      a.audience === "client"
        ? `Your booking is confirmed — ${prettyDate}`
        : `New booking: ${a.clientName} — ${prettyDate}`,
    html: shell(inner),
    text,
    ics,
    icsFilename: `Vivid-Events-${a.quoteNumber}.ics`,
  }
}

function firstNameOfLocal(name: string) {
  return (name ?? "").trim().split(/\s+/)[0] || name
}

/* ---------------------------------- Templates --------------------------------- */

function shell(inner: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #334155;">
                <span style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;border-radius:9px;background:${BRAND};color:#fff;font-weight:700;vertical-align:middle;">V</span>
                <span style="color:#fff;font-size:17px;font-weight:600;margin-left:10px;vertical-align:middle;">Vivid Events</span>
              </td>
            </tr>
            <tr><td style="padding:32px;color:#cbd5e1;font-size:15px;line-height:1.6;">${inner}</td></tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #334155;color:#64748b;font-size:12px;">
                Vivid Events &middot; Audio, Video &amp; Event Production &middot;
                <a href="https://vividevents.ca" style="color:${BRAND};text-decoration:none;">vividevents.ca</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function loginCodeEmail(code: string) {
  const html = shell(`
    <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">Your sign-in code</h1>
    <p style="margin:0 0 24px;">Use the code below to finish signing in to your Vivid Events portal. It expires in 10 minutes and can only be used once.</p>
    <div style="text-align:center;margin:0 0 24px;">
      <span style="display:inline-block;font-size:34px;letter-spacing:10px;font-weight:700;color:#fff;background:#0f172a;border:1px solid #334155;border-radius:12px;padding:16px 24px;">${code}</span>
    </div>
    <p style="margin:0;color:#94a3b8;font-size:13px;">If you didn&rsquo;t try to sign in, you can safely ignore this email &mdash; your account is still secure.</p>
  `)
  const text = `Your Vivid Events sign-in code is ${code}. It expires in 10 minutes and can only be used once. If you didn't request this, ignore this email.`
  return { subject: `${code} is your Vivid Events sign-in code`, html, text }
}

type QuoteEmailArgs = {
  quoteNumber: string
  clientName: string
  eventName?: string | null
  eventDate?: string | null
  items: { name: string; description?: string | null; quantity: number; unitPrice: number; lineTotal: number }[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes?: string | null
  validUntil?: string | null
}

const money = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

export function quoteEmail(q: QuoteEmailArgs) {
  const rows = q.items
    .map(
      (it) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #334155;color:#e2e8f0;">
          ${escapeHtml(it.name)}
          ${it.description ? `<div style="color:#94a3b8;font-size:12px;margin-top:2px;">${escapeHtml(it.description)}</div>` : ""}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #334155;color:#cbd5e1;text-align:center;white-space:nowrap;">${it.quantity} &times; ${money(it.unitPrice)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #334155;color:#fff;text-align:right;white-space:nowrap;">${money(it.lineTotal)}</td>
      </tr>`,
    )
    .join("")

  const inner = `
    <h1 style="color:#fff;font-size:20px;margin:0 0 4px;">Quote ${escapeHtml(q.quoteNumber)}</h1>
    <p style="margin:0 0 20px;color:#94a3b8;">Prepared for ${escapeHtml(q.clientName)}${
      q.eventName ? ` &middot; ${escapeHtml(q.eventName)}` : ""
    }${q.eventDate ? ` &middot; ${escapeHtml(q.eventDate)}` : ""}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      ${rows}
      <tr><td style="padding:14px 0 4px;color:#94a3b8;">Subtotal</td><td></td><td style="padding:14px 0 4px;text-align:right;color:#e2e8f0;">${money(q.subtotal)}</td></tr>
      <tr><td style="padding:4px 0;color:#94a3b8;">Tax (${(q.taxRate * 100).toFixed(0)}%)</td><td></td><td style="padding:4px 0;text-align:right;color:#e2e8f0;">${money(q.taxAmount)}</td></tr>
      <tr><td style="padding:10px 0 0;color:#fff;font-weight:700;font-size:16px;">Total</td><td></td><td style="padding:10px 0 0;text-align:right;color:${BRAND};font-weight:700;font-size:16px;">${money(q.total)}</td></tr>
    </table>
    ${q.notes ? `<div style="margin-top:22px;padding:14px 16px;background:#0f172a;border:1px solid #334155;border-radius:10px;color:#cbd5e1;font-size:13px;"><strong style="color:#fff;">Notes</strong><br/>${escapeHtml(q.notes).replace(/\n/g, "<br/>")}</div>` : ""}
    ${q.validUntil ? `<p style="margin:18px 0 0;color:#94a3b8;font-size:13px;">This quote is valid until ${escapeHtml(q.validUntil)}.</p>` : ""}
    <p style="margin:22px 0 0;">Have questions or ready to book? Just reply to this email and we&rsquo;ll take care of the rest.</p>
  `

  const text = [
    `Quote ${q.quoteNumber} for ${q.clientName}`,
    q.eventName ? `Event: ${q.eventName}` : "",
    "",
    ...q.items.map((it) => `- ${it.name} — ${it.quantity} x ${money(it.unitPrice)} = ${money(it.lineTotal)}`),
    "",
    `Subtotal: ${money(q.subtotal)}`,
    `Tax (${(q.taxRate * 100).toFixed(0)}%): ${money(q.taxAmount)}`,
    `Total: ${money(q.total)}`,
    q.notes ? `\nNotes: ${q.notes}` : "",
    q.validUntil ? `\nValid until ${q.validUntil}` : "",
    "\nReply to this email to book or ask questions.",
  ]
    .filter(Boolean)
    .join("\n")

  return { subject: `Your Vivid Events quote ${q.quoteNumber}`, html: shell(inner), text }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * The name the quote/invoice emails are signed with. Set QUOTE_SIGNER_NAME to
 * the real person who should appear to have written the email; falls back to a
 * friendly first name so it never reads like an automated system.
 */
function signerName() {
  return process.env.QUOTE_SIGNER_NAME?.trim() || "Marcus"
}

/**
 * A deliberately plain, person-typed email. No big HTML quote table — it reads
 * like a human opened the request, wrote a short note, attached the quotation
 * PDF, and hit send. The formal numbers live in the attachment + the link.
 */
type PersonalQuoteArgs = {
  quoteNumber: string
  clientFirstName: string
  eventName?: string | null
  eventDate?: string | null
  total: number
  reviewUrl: string
}

export function personalQuoteEmail(q: PersonalQuoteArgs) {
  const first = q.clientFirstName || "there"
  const eventBit = q.eventName ? ` for ${q.eventName}` : " for your event"
  const dateBit = q.eventDate ? ` on ${q.eventDate}` : ""

  // Plain-text body — this is what most clients will actually see.
  const text = `Hi ${first},

Thanks so much for reaching out — it was great learning about what you have planned${eventBit ? eventBit : ""}${dateBit}.

I've put together a quotation covering everything we discussed and attached it to this email as a PDF (quote ${q.quoteNumber}). Please take a look when you get a chance.

Whenever you're ready, you can review, approve and (if you'd like) pay your deposit securely here:
${q.reviewUrl}

If anything looks off or you'd like to tweak the package, just reply to this email — happy to adjust it. Looking forward to being part of the day.

Warm regards,
${signerName()}
Vivid Events`

  // Light HTML that mimics a normal typed email (system font, no card/branding blocks).
  const paragraphs = [
    `Hi ${escapeHtml(first)},`,
    `Thanks so much for reaching out &mdash; it was great learning about what you have planned${
      q.eventName ? " for " + escapeHtml(q.eventName) : " for your event"
    }${q.eventDate ? " on " + escapeHtml(q.eventDate) : ""}.`,
    `I&rsquo;ve put together a quotation covering everything we discussed and attached it to this email as a PDF (quote ${escapeHtml(
      q.quoteNumber,
    )}). Please take a look when you get a chance.`,
    `Whenever you&rsquo;re ready, you can review, approve and (if you&rsquo;d like) pay your deposit securely here:`,
  ]
    .map((p) => `<p style="margin:0 0 14px;">${p}</p>`)
    .join("")

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#ffffff;">
    <div style="max-width:560px;margin:0 auto;padding:20px 4px;color:#1f2937;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">
      ${paragraphs}
      <p style="margin:0 0 18px;">
        <a href="${q.reviewUrl}" style="color:#8c52ff;font-weight:600;text-decoration:underline;">Review &amp; approve quote ${escapeHtml(
          q.quoteNumber,
        )}</a>
      </p>
      <p style="margin:0 0 14px;">If anything looks off or you&rsquo;d like to tweak the package, just reply to this email &mdash; happy to adjust it. Looking forward to being part of the day.</p>
      <p style="margin:0;">Warm regards,<br/>${escapeHtml(signerName())}<br/><span style="color:#6b7280;">Vivid Events</span></p>
    </div>
  </body>
</html>`

  return { subject: `Your quotation for ${q.eventName || "your event"} (${q.quoteNumber})`, html, text }
}

/** Sent after a customer pays — reads like a person confirming, with the invoice PDF attached. */
type InvoiceEmailArgs = {
  invoiceNumber: string
  clientFirstName: string
  eventName?: string | null
  amountPaid: number
  receiptUrl?: string | null
}

export function invoicePaidEmail(q: InvoiceEmailArgs) {
  const first = q.clientFirstName || "there"
  const receiptLine = q.receiptUrl ? `\nYour card receipt is here: ${q.receiptUrl}` : ""

  const text = `Hi ${first},

Just a quick note to say your payment came through — thank you! I've attached your paid invoice (${q.invoiceNumber}) for your records.${receiptLine}

Your booking${q.eventName ? " for " + q.eventName : ""} is now confirmed. I'll be in touch closer to the date to finalise timings, but in the meantime feel free to reply here with any questions at all.

Thanks again for choosing us — can't wait for the event.

All the best,
${signerName()}
Vivid Events`

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#ffffff;">
    <div style="max-width:560px;margin:0 auto;padding:20px 4px;color:#1f2937;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 14px;">Hi ${escapeHtml(first)},</p>
      <p style="margin:0 0 14px;">Just a quick note to say your payment came through &mdash; thank you! I&rsquo;ve attached your paid invoice (${escapeHtml(
        q.invoiceNumber,
      )}) for your records.</p>
      ${
        q.receiptUrl
          ? `<p style="margin:0 0 14px;"><a href="${q.receiptUrl}" style="color:#8c52ff;font-weight:600;">View your card receipt</a></p>`
          : ""
      }
      <p style="margin:0 0 14px;">Your booking${
        q.eventName ? " for " + escapeHtml(q.eventName) : ""
      } is now confirmed. I&rsquo;ll be in touch closer to the date to finalise timings, but in the meantime feel free to reply here with any questions at all.</p>
      <p style="margin:0 0 14px;">Thanks again for choosing us &mdash; can&rsquo;t wait for the event.</p>
      <p style="margin:0;">All the best,<br/>${escapeHtml(signerName())}<br/><span style="color:#6b7280;">Vivid Events</span></p>
    </div>
  </body>
</html>`

  return { subject: `Payment received — invoice ${q.invoiceNumber}`, html, text }
}
