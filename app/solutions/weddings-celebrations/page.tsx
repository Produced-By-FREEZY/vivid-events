"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { BookingModal } from "@/app/components/booking-modal"
import { Breadcrumb } from "@/app/components/breadcrumb"
import { CheckCircle, Heart, Sparkles, Music, Camera, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function WeddingsCelebrationsPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  const features = [
    {
      icon: Heart,
      title: "Romantic Atmosphere",
      description: "Soft, warm lighting that creates the perfect romantic ambiance for your special day.",
    },
    {
      icon: Sparkles,
      title: "Venue Transformation",
      description: "Turn any space into a magical setting with custom lighting design tailored to your vision.",
    },
    {
      icon: Music,
      title: "Dance Floor Magic",
      description: "Dynamic lighting that energizes your reception and gets everyone on their feet.",
    },
    {
      icon: Camera,
      title: "Photo-Perfect Moments",
      description: "Lighting designed to make every photo and video look absolutely stunning.",
    },
  ]

  const benefits = [
    "Ceremony and reception lighting",
    "Mood-responsive color changes",
    "Minimal footprint design",
    "Outdoor event capability",
    "First dance spotlight effects",
    "Photo booth lighting",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header onBookingClick={() => setIsBookingOpen(true)} />

      <div className="pt-16">
        <Breadcrumb items={[{ label: "Solutions", href: "/#services" }, { label: "Weddings & Celebrations" }]} />
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
                Love & Celebration
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Weddings & <span style={{ color: "#8c52ff" }}>Celebrations</span>
              </h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                From intimate ceremonies to grand receptions, our lighting transforms venues into magical spaces. Our
                compact, modern systems blend seamlessly into your decor while delivering show-stopping visual impact.
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
                  src="/beautiful-wedding-reception-with-romantic-purple-u.jpg"
                  alt="Wedding Reception with Beautiful Lighting"
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
              Your Vision, <span style={{ color: "#8c52ff" }}>Perfectly Illuminated</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              We work closely with you to understand your dream wedding and bring it to life with stunning lighting
              design.
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
                Making Dreams <span style={{ color: "#8c52ff" }}>Reality</span>
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Your wedding day deserves perfect lighting. We handle all the technical details so you can focus on
                celebrating with the people you love.
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
                "Our wedding photos are absolutely stunning thanks to Vivid Events' lighting. They transformed our venue
                into something out of a fairy tale."
              </p>
              <p className="text-sm text-slate-400 font-medium">— Happy Couple</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-800/50 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Let Us Light Your Special Day</h2>
          <p className="text-xl text-slate-400 mb-8">
            Contact us to discuss how we can make your wedding dreams come true.
          </p>
          <Button
            onClick={() => setIsBookingOpen(true)}
            size="lg"
            className="font-semibold px-12 py-6 text-lg rounded-full shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{ background: `linear-gradient(to right, #8c52ff, #6b3acc)` }}
          >
            Book Your Wedding
          </Button>
        </div>
      </section>

      <Footer />

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        serviceType="weddings-celebrations"
        customTitle="Inquire About Weddings & Celebrations"
      />
    </div>
  )
}
