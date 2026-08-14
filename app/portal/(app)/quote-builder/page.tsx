import { getServiceItems } from "@/app/portal/quote-actions"
import { QuoteBuilderClient } from "./quote-builder-client"

export default async function QuoteBuilderPage() {
  const catalog = await getServiceItems()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Quote Builder</h1>
        <p className="mt-1 text-sm text-slate-400">
          Select the audio, video, lighting and labour items for the job, then send a polished quote straight to the
          customer&apos;s inbox.
        </p>
      </div>
      <QuoteBuilderClient catalog={catalog} />
    </div>
  )
}
