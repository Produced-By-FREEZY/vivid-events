import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getReleaseInfo } from "./actions"
import { ReleaseClient } from "./release-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Release security deposit · Vivid Events",
  robots: { index: false, follow: false },
}

export default async function DepositReleasePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const info = await getReleaseInfo(token)
  if (!info.found) notFound()

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12 text-white">
      <ReleaseClient token={token} info={info} />
    </main>
  )
}
