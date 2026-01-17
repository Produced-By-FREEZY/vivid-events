"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { BookingModal } from "@/app/components/booking-modal"
import { Breadcrumb } from "@/app/components/breadcrumb"
import { CheckCircle, Sparkles, Star, Award, Music, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function GalasAwardCeremoniesPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  const features = [
    {
      icon: Sparkles,
      title: "Dramatic Lighting Design",
      description: "Custom choreographed lighting sequences that build anticipation and celebrate every winner.",
    },
    {
      icon: Star,
      title: "Red Carpet Production",
      description: "From arrival to after-party, create Instagram-worthy moments throughout the evening.",
    },
    {
      icon: Award,
      title: "Reveal Moments",
      description: "Perfectly timed lighting cues that amplify the excitement of award announcements.",
    },
    {
      icon: Music,
      title: "Audio Excellence",
      description: "Crystal-clear sound for speeches, performances, and that all-important envelope opening.",
    },
  ]

  const benefits = [
    "Custom lighting choreography",
    "Dramatic reveal sequences",
    "Professional audio for speeches",
    "Stage design and production",
    "Elegant atmosphere creation",
    "Full technical rehearsal support",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header onBookingClick={() => setIsBookingOpen(true)} />

      <div className="pt-16">
        <Breadcrumb items={[{ label: "Solutions", href: "/#services" }, { label: "Galas & Award Ceremonies" }]} />
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
                Elegant Events
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Galas & <span style={{ color: "#8c52ff" }}>Award Ceremonies</span>
              </h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Create unforgettable moments with dramatic lighting sequences choreographed to your event's rhythm. From
                red carpet arrivals to standing ovations, every second is designed to impress.
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
                  src="/elegant-gala-event-with-dramatic-purple-lighting-a.jpg"
                  alt="Elegant Gala Event"
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
              Elegance Meets <span style={{ color: "#8c52ff" }}>Innovation</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              We combine sophisticated design with cutting-edge technology to create truly memorable celebrations.
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
                Every Detail <span style={{ color: "#8c52ff" }}>Perfected</span>
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                From the moment guests arrive to the final applause, we ensure every lighting cue, every sound check,
                and every visual element is flawless.
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
                "The lighting design for our awards gala was absolutely stunning. Every reveal moment was perfectly
                timed, and the atmosphere was magical throughout the evening."
              </p>
              <p className="text-sm text-slate-400 font-medium">— Gala Committee Chair</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-800/50 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Make Your Gala Unforgettable</h2>
          <p className="text-xl text-slate-400 mb-8">
            Let us create an evening that will be talked about for years to come.
          </p>
          <Button
            onClick={() => setIsBookingOpen(true)}
            size="lg"
            className="font-semibold px-12 py-6 text-lg rounded-full shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{ background: `linear-gradient(to right, #8c52ff, #6b3acc)` }}
          >
            Book Your Gala
          </Button>
        </div>
      </section>

      <Footer />

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        serviceType="galas-award-ceremonies"
        customTitle="Inquire About Galas & Award Ceremonies"
      />
    </div>
  )
}
