"use client"

import { CheckCircle, Mail, ArrowLeft, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ThankYouClientPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-24">
      <div className="max-w-xl w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">Thank You!</h1>

        {/* Main Message */}
        <p className="text-xl text-slate-300 mb-8 leading-relaxed">
          We've received your request. We typically respond within a few days, but some cases can take a little longer.
        </p>

        {/* Email Notice Card */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#8c52ff]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-[#8c52ff]" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-white mb-2">Check Your Inbox</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                We've sent you an email with more details about your request. If you don't see it, please check your
                spam or trash folders.
              </p>
            </div>
          </div>
        </div>

        {/* What's Next Card */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#8c52ff]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-[#8c52ff]" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-white mb-2">What Happens Next?</h2>
              <ul className="text-slate-400 text-sm leading-relaxed space-y-2">
                <li>Our team will review your request</li>
                <li>We'll reach out to discuss your event details</li>
                <li>Together, we'll create your perfect experience</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button
              size="lg"
              className="text-white font-semibold px-8 py-4 text-lg transition-all duration-300"
              style={{
                background: `linear-gradient(to right, #8c52ff, #6b3acc)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(to right, #a366ff, #8c52ff)`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(to right, #8c52ff, #6b3acc)`
              }}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href="tel:604-552-2141">
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent px-8 py-4 text-lg"
            >
              Call Us: 604-552-2141
            </Button>
          </Link>
        </div>

        {/* Additional Contact Info */}
        <p className="text-slate-500 text-sm mt-10">
          Questions? Reach us at{" "}
          <a href="mailto:info@vividevents.ca" className="text-[#8c52ff] hover:underline">
            info@vividevents.ca
          </a>
        </p>
      </div>
    </main>
  )
}
