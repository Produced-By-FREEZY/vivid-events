"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { BookingModal } from "@/app/components/booking-modal"
import { Breadcrumb } from "@/app/components/breadcrumb"
import { CheckCircle, Rocket, Target, Camera, TrendingUp, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function ProductLaunchesPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  const features = [
    {
      icon: Rocket,
      title: "Dramatic Product Reveals",
      description:
        "Build anticipation with perfectly choreographed lighting sequences that make your product the star.",
    },
    {
      icon: Target,
      title: "Brand-Aligned Design",
      description: "Lighting and stage design that reinforces your brand identity and messaging.",
    },
    {
      icon: Camera,
      title: "Social-Ready Production",
      description: "Every angle optimized for photos and video that generate buzz across social media.",
    },
    {
      icon: TrendingUp,
      title: "Measurable Impact",
      description: "Create memorable moments that translate to engagement, coverage, and conversions.",
    },
  ]

  const benefits = [
    "Custom brand color integration",
    "Dramatic reveal sequences",
    "Press-ready lighting setup",
    "Multi-camera optimization",
    "Live streaming capability",
    "Full rehearsal support",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header onBookingClick={() => setIsBookingOpen(true)} />

      <div className="pt-16">
        <Breadcrumb items={[{ label: "Solutions", href: "/#services" }, { label: "Product Launches" }]} />
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
                Brand Launches
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Product <span style={{ color: "#8c52ff" }}>Launches</span>
              </h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Command attention and create buzz with production value that positions your brand as an industry leader.
                Our efficient setup means more rehearsal time and a polished final presentation that generates real
                results.
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
                  src="/corporate-product-launch-event-with-modern-stage-l.jpg"
                  alt="Product Launch Event"
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
              Make Your Brand <span style={{ color: "#8c52ff" }}>Shine</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              First impressions matter. We help you launch products with the impact and professionalism your brand
              deserves.
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
                Launch with <span style={{ color: "#8c52ff" }}>Confidence</span>
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                From tech startups to established brands, we've helped companies launch products that capture attention
                and drive results.
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
                "The production quality exceeded our expectations. The reveal moment was incredible—it set the tone for
                our entire product campaign."
              </p>
              <p className="text-sm text-slate-400 font-medium">— Marketing VP</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-800/50 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Launch?</h2>
          <p className="text-xl text-slate-400 mb-8">
            Let us help you create a product launch that generates buzz and drives results.
          </p>
          <Button
            onClick={() => setIsBookingOpen(true)}
            size="lg"
            className="font-semibold px-12 py-6 text-lg rounded-full shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{ background: `linear-gradient(to right, #8c52ff, #6b3acc)` }}
          >
            Book Your Launch
          </Button>
        </div>
      </section>

      <Footer />

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        serviceType="product-launches"
        customTitle="Inquire About Product Launches"
      />
    </div>
  )
}
