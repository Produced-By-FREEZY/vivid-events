"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { BookingModal } from "@/app/components/booking-modal"
import { Breadcrumb } from "@/app/components/breadcrumb"
import { CheckCircle, Monitor, Globe, Video, Wifi, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function HybridVirtualEventsPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  const features = [
    {
      icon: Video,
      title: "4K Streaming Quality",
      description: "Broadcast-quality video that makes remote attendees feel like they're in the room.",
    },
    {
      icon: Globe,
      title: "Multi-Platform Distribution",
      description: "Stream simultaneously to YouTube, Zoom, Teams, and custom platforms with perfect synchronization.",
    },
    {
      icon: Monitor,
      title: "Professional Production",
      description: "Multiple camera angles, graphics overlays, and seamless transitions for a polished broadcast.",
    },
    {
      icon: Wifi,
      title: "Interactive Engagement",
      description: "Live Q&A, polls, and real-time audience interaction tools that bridge the physical-digital divide.",
    },
  ]

  const benefits = [
    "Reach global audiences without travel",
    "Record and repurpose content",
    "Reduced environmental footprint",
    "Flexible attendance options",
    "Built-in backup and redundancy",
    "Professional technical support",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header onBookingClick={() => setIsBookingOpen(true)} />

      <div className="pt-16">
        <Breadcrumb items={[{ label: "Solutions", href: "/#services" }, { label: "Hybrid & Virtual Events" }]} />
      </div>

      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#8c52ff]/10 via-transparent to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span
                className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-6"
                style={{ backgroundColor: "rgba(140, 82, 255, 0.2)", color: "#c4a7ff" }}
              >
                Virtual Solutions
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Hybrid & <span style={{ color: "#8c52ff" }}>Virtual Events</span>
              </h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Bridge the gap between in-person and remote attendees with production quality that rivals broadcast
                television. Connect audiences worldwide without compromising on experience.
              </p>
              <Button
                onClick={() => setIsBookingOpen(true)}
                size="lg"
                className="font-semibold px-8 py-6 text-lg rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
                style={{ background: `linear-gradient(to right, #8c52ff, #6b3acc)` }}
              >
                Book Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl">
                <Image
                  src="/hybrid-virtual-event-with-screens-and-professional.jpg"
                  alt="Hybrid Virtual Event Setup"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Connect Audiences <span style={{ color: "#8c52ff" }}>Everywhere</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Our streamlined tech stack means faster setup, fewer complications, and flawless execution every time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:border-[#8c52ff]/30 transition-all duration-300"
              >
                <feature.icon className="w-12 h-12 mb-4" style={{ color: "#8c52ff" }} />
                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                The Future of <span style={{ color: "#8c52ff" }}>Events</span>
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Hybrid events offer the best of both worlds—the energy of in-person attendance combined with the reach
                of digital broadcasting.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-400" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
              <p className="text-slate-400 mb-6">
                "Our virtual conference reached 3x the audience of previous in-person events. Vivid Events made the
                technology invisible—attendees just experienced a great event."
              </p>
              <p className="text-sm text-slate-400 font-medium">— Marketing Director</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-800/50 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Go Hybrid?</h2>
          <p className="text-xl text-slate-400 mb-8">
            Let us help you create an event that connects audiences across the globe.
          </p>
          <Button
            onClick={() => setIsBookingOpen(true)}
            size="lg"
            className="font-semibold px-12 py-6 text-lg rounded-full shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{ background: `linear-gradient(to right, #8c52ff, #6b3acc)` }}
          >
            Book Your Event
          </Button>
        </div>
      </section>

      <Footer />

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        serviceType="hybrid-virtual-events"
        customTitle="Inquire About Hybrid & Virtual Events"
      />
    </div>
  )
}
