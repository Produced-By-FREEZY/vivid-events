"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, MailCheck } from "lucide-react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { startSignIn, verifyCode, resendCode } from "@/app/portal/actions"
import { PortalLoadingScreen } from "@/app/portal/loading-screen"

type Step = "credentials" | "code"

export default function PortalLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("credentials")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const result = await startSignIn(email, password)
    setIsLoading(false)
    if (result.success) {
      setStep("code")
    } else {
      setError(result.error ?? "Something went wrong. Please try again.")
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return
    setError(null)
    setIsLoading(true)
    const result = await verifyCode(email, code)
    if (result.success) {
      // Show the branded loader immediately so the dashboard's pipeline
      // figures never flash on screen before the page is ready.
      setRedirecting(true)
      router.replace("/portal/dashboard")
      router.refresh()
    } else {
      setIsLoading(false)
      setCode("")
      setError(result.error ?? "That code is invalid or has expired.")
    }
  }

  const handleResend = async () => {
    setError(null)
    setResent(false)
    const result = await resendCode(email)
    if (result.success) {
      setResent(true)
    } else {
      setError(result.error ?? "Could not resend the code.")
    }
  }

  if (redirecting) {
    return <PortalLoadingScreen message="Signing you in…" />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-white">Agency Portal</h1>
          <p className="mt-2 text-sm text-slate-400">
            {step === "credentials" ? "Sign in to your workspace" : "Enter your verification code"}
          </p>
        </div>

        {step === "credentials" ? (
          <form
            onSubmit={handleCredentials}
            className="space-y-5 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-8 shadow-2xl backdrop-blur-sm"
          >
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@vividevents.ca"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#8c52ff] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-slate-300">
                  Password
                </label>
                <a
                  href="mailto:info@vividevents.ca?subject=Portal%20password%20reset"
                  className="text-xs text-slate-400 transition-colors hover:text-[#8c52ff]"
                >
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#8c52ff] focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: "linear-gradient(to right, #8c52ff, #6b3acc)" }}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Verifying..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleVerify}
            className="space-y-6 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-8 shadow-2xl backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: "linear-gradient(to bottom right, #8c52ff, #6b3acc)" }}
              >
                <MailCheck className="h-5 w-5 text-white" />
              </span>
              <p className="text-sm text-slate-400">
                We emailed a 6-digit code to <span className="text-slate-200">{email}</span>. Paste or type it below.
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                containerClassName="gap-2"
                autoFocus
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-12 w-11 rounded-lg border-slate-700 bg-slate-900/60 text-lg text-white first:rounded-l-lg last:rounded-r-lg"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && <p className="text-center text-sm text-red-400">{error}</p>}
            {resent && !error && <p className="text-center text-sm text-emerald-400">A new code is on its way.</p>}

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: "linear-gradient(to right, #8c52ff, #6b3acc)" }}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Signing in..." : "Verify & Sign In"}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep("credentials")
                  setCode("")
                  setError(null)
                  setResent(false)
                }}
                className="inline-flex items-center gap-1 text-slate-400 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
              <button
                type="button"
                onClick={handleResend}
                className="text-slate-400 transition-colors hover:text-[#8c52ff]"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        <p className="mt-10 text-center text-[10px] tracking-wider text-slate-700">Vivid OS</p>
      </div>
    </main>
  )
}
