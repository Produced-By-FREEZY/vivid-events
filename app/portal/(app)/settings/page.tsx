import { ChangePasswordForm } from "./change-password-form"
import { EmailTemplateForm } from "./email-template-form"
import { PaidEmailForm, DepositReleasedEmailForm } from "./paid-email-form"
import { getPortalSettings } from "@/app/portal/settings-actions"

export default async function SettingsPage() {
  const settings = await getPortalSettings()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      <p className="mt-1 text-sm text-slate-400">Manage your account and quote emails.</p>

      <section className="mt-8 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl">
        <h2 className="text-lg font-medium text-white">Quote Email</h2>
        <p className="mt-1 text-sm text-slate-400">
          Customize the subject and pre-text of the quote email. When you send a quote it&apos;s saved as a draft in
          your Gmail with the quotation PDF attached, so you can review and send it yourself.
        </p>
        <div className="mt-6">
          <EmailTemplateForm initial={settings} />
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl">
        <h2 className="text-lg font-medium text-white">Payment Confirmation Email</h2>
        <p className="mt-1 text-sm text-slate-400">
          Sent to the client automatically when their payment goes through. The paid invoice PDF is attached and their
          booking is confirmed.
        </p>
        <div className="mt-6">
          <PaidEmailForm initialSubject={settings.paid_email_subject} initialBody={settings.paid_email_body} />
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl">
        <h2 className="text-lg font-medium text-white">Deposit Released Email</h2>
        <p className="mt-1 text-sm text-slate-400">
          Sent to the client when you release their refundable security deposit after the event. When a paid quote has a
          required deposit, you&apos;ll get an email with a one-click button to release it.
        </p>
        <div className="mt-6">
          <DepositReleasedEmailForm
            initialSubject={settings.deposit_released_email_subject}
            initialBody={settings.deposit_released_email_body}
          />
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl">
        <h2 className="text-lg font-medium text-white">Change Password</h2>
        <p className="mt-1 text-sm text-slate-400">
          Update the password used to sign in to the portal. You&apos;ll still be asked for an emailed 6-digit code at
          each new sign-in.
        </p>
        <div className="mt-6">
          <ChangePasswordForm />
        </div>
      </section>
    </div>
  )
}
