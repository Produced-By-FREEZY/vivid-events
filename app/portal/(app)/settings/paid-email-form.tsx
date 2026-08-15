"use client"

import { SimpleEmailForm } from "./simple-email-form"
import { savePaidEmailSettings, saveDepositReleasedEmailSettings } from "@/app/portal/settings-actions"

const PAID_PLACEHOLDERS = [
  { token: "{first_name}", label: "Client's first name" },
  { token: "{event_name}", label: "Event name" },
  { token: "{invoice_number}", label: "Invoice number" },
  { token: "{receipt_link}", label: "Stripe card receipt link" },
  { token: "{signer_name}", label: "Your signature name" },
]

const DEPOSIT_PLACEHOLDERS = [
  { token: "{first_name}", label: "Client's first name" },
  { token: "{event_name}", label: "Event name" },
  { token: "{invoice_number}", label: "Invoice number" },
  { token: "{deposit_refund_amount}", label: "Amount released back" },
  { token: "{signer_name}", label: "Your signature name" },
]

export function PaidEmailForm({ initialSubject, initialBody }: { initialSubject: string; initialBody: string }) {
  return (
    <SimpleEmailForm
      initialSubject={initialSubject}
      initialBody={initialBody}
      placeholders={PAID_PLACEHOLDERS}
      bodyHelp="Sent automatically to the client the moment their payment clears, with the paid invoice PDF attached. Line breaks are kept exactly as written."
      onSave={({ subject, body }) => savePaidEmailSettings({ paid_email_subject: subject, paid_email_body: body })}
    />
  )
}

export function DepositReleasedEmailForm({
  initialSubject,
  initialBody,
}: {
  initialSubject: string
  initialBody: string
}) {
  return (
    <SimpleEmailForm
      initialSubject={initialSubject}
      initialBody={initialBody}
      placeholders={DEPOSIT_PLACEHOLDERS}
      bodyHelp="Sent to the client automatically when you release their security deposit. Line breaks are kept exactly as written."
      onSave={({ subject, body }) =>
        saveDepositReleasedEmailSettings({
          deposit_released_email_subject: subject,
          deposit_released_email_body: body,
        })
      }
    />
  )
}
