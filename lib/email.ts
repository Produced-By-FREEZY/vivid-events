import "server-only"
import nodemailer from "nodemailer"

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

type SendArgs = {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}

export async function sendMail({ to, subject, html, text, replyTo }: SendArgs) {
  const transport = getTransport()
  await transport.sendMail({
    from: fromHeader(),
    to,
    subject,
    html,
    text,
    replyTo: replyTo ?? process.env.GMAIL_USER,
  })
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
