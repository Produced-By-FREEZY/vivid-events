import { ChangePasswordForm } from "./change-password-form"

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      <p className="mt-1 text-sm text-slate-400">Manage your account security.</p>

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
