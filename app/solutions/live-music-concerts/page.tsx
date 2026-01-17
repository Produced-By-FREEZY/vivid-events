"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { BookingModal } from "@/app/components/booking-modal"
import { Breadcrumb } from "@/app/components/breadcrumb"
import { CheckCircle, Music, Zap, Radio, Volume2, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function LiveMusicConcertsPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  const features = [
    {
      icon: Zap,
      title: "Beat-Synchronized Lighting",
      description: "Our proprietary DMX automation synchronizes lights with every beat, kick drum, and bass drop.",
    },
    {
      icon: Music,
      title: "Automated Show Control",
      description: "One technician can control complex lighting sequences that would typically require a full crew.",
    },
    {
      icon: Radio,
      title: "Wireless DMX Control",
      description: "Freedom to place lights anywhere without the hassle of running cables across the venue.",
    },
    {
      icon: Volume2,
      title: "Audio Integration",
      description: "Seamless integration with your sound system via Dante for perfect audio-visual synchronization.",
    },
  ]

  const benefits = [
    "Real-time music reactivity",
    "Dynamic color programming",
    "Automated DMX sequences",
    "Festival-scale capability",
    "Indoor and outdoor setups",
    "Quick load-in and load-out",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header onBookingClick={() => setIsBookingOpen(true)} />

      <div className="pt-16">
        <Breadcrumb items={[{ label: "Solutions", href: "/#services" }, { label: "Live Music & Concerts" }]} />
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
                Live Performance
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Live Music & <span style={{ color: "#8c52ff" }}>Concerts</span>
              </h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Where sound meets light. Our proprietary DMX automation synchronizes lighting with every beat, creating
                an immersive experience that amplifies the energy of live performance. One technician, infinite
                possibilities.
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
                  src="/concert-stage-with-vibrant-purple-and-blue-lightin.jpg"
                  alt="Concert Stage with Dynamic Lighting"
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
              Technology That <span style={{ color: "#8c52ff" }}>Moves</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Our advanced lighting systems react to music in real-time, creating a visual experience that enhances
              every performance.
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
                Amplify the <span style={{ color: "#8c52ff" }}>Experience</span>
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Great lighting doesn't just illuminate—it transforms. We create visual environments that make audiences
                feel the music on a deeper level.
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
                "Vivid Events brought our show to life. The way the lights moved with our music was incredible—the crowd
                was absolutely mesmerized."
              </p>
              <p className="text-sm text-slate-400 font-medium">— Band Manager</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-800/50 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Light Up the Stage?</h2>
          <p className="text-xl text-slate-400 mb-8">
            From intimate venues to festival stages, we have the technology to make your performance unforgettable.
          </p>
          <Button
            onClick={() => setIsBookingOpen(true)}
            size="lg"
            className="font-semibold px-12 py-6 text-lg rounded-full shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{ background: `linear-gradient(to right, #8c52ff, #6b3acc)` }}
          >
            Book Your Show
          </Button>
        </div>
      </section>

      <Footer />

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        serviceType="live-music-concerts"
        customTitle="Inquire About Live Music & Concerts"
      />
    </div>
  )
}
