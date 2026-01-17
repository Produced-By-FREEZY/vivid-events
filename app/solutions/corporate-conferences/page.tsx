"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { BookingModal } from "@/app/components/booking-modal"
import { Breadcrumb } from "@/app/components/breadcrumb"
import { CheckCircle, Users, Presentation, Wifi, Monitor, Clock, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function CorporateConferencesPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  const features = [
    {
      icon: Presentation,
      title: "Crystal Clear Presentations",
      description:
        "High-definition projection and display systems that ensure every slide, video, and graphic is seen with stunning clarity.",
    },
    {
      icon: Wifi,
      title: "Seamless Connectivity",
      description:
        "Reliable audio-visual infrastructure that keeps your presenters connected and your message flowing without interruption.",
    },
    {
      icon: Users,
      title: "Audience Engagement",
      description:
        "Interactive tools and dynamic lighting that keep attendees focused and engaged throughout your entire event.",
    },
    {
      icon: Monitor,
      title: "Multi-Room Synchronization",
      description:
        "Coordinate presentations across multiple breakout rooms with synchronized content and consistent audio quality.",
    },
  ]

  const benefits = [
    "Real-time lighting adaptation for presentations",
    "Professional-grade audio for large venues",
    "Backup systems for zero-downtime events",
    "Dedicated technical support throughout",
    "Quick setup with minimal disruption",
    "Custom branding and stage design",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header onBookingClick={() => setIsBookingOpen(true)} />

      <div className="pt-16">
        <Breadcrumb items={[{ label: "Solutions", href: "/#services" }, { label: "Corporate Conferences" }]} />
      </div>

      {/* Hero Section */}
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
                Corporate Solutions
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Corporate <span style={{ color: "#8c52ff" }}>Conferences</span>
              </h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Deliver impactful presentations with intelligent lighting and professional AV that commands attention.
                Our automated systems adapt in real-time, ensuring perfect ambiance from keynote to closing remarks.
              </p>
              <div className="flex flex-wrap gap-4">
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
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl">
                <Image
                  src="/professional-conference-meeting-with-modern-lighti.jpg"
                  alt="Corporate Conference with Professional Lighting"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Choose Vivid Events for Your <span style={{ color: "#8c52ff" }}>Conference</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              We bring cutting-edge technology and decades of expertise to deliver conferences that inform, inspire, and
              impress.
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

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                The Vivid Events <span style={{ color: "#8c52ff" }}>Advantage</span>
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Our team brings professional equipment and years of experience to every production. We handle the
                technical complexity so you can focus on delivering your message.
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
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-8 h-8" style={{ color: "#8c52ff" }} />
                <h3 className="text-xl font-semibold">Quick Turnaround</h3>
              </div>
              <p className="text-slate-400 mb-6">
                Need last-minute support? Our streamlined setup process means we can be ready faster than traditional AV
                companies—without sacrificing quality.
              </p>
              <div className="border-t border-slate-700/50 pt-6">
                <p className="text-sm text-slate-500 italic">
                  "Vivid Events transformed our annual conference. The lighting adapted perfectly to each presenter, and
                  the technical support was flawless."
                </p>
                <p className="text-sm text-slate-400 mt-2 font-medium">— Corporate Event Manager</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-800/50 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Elevate Your Next Conference?</h2>
          <p className="text-xl text-slate-400 mb-8">
            Contact us today to discuss your corporate event needs. Our team is ready to create an unforgettable
            experience.
          </p>
          <Button
            onClick={() => setIsBookingOpen(true)}
            size="lg"
            className="font-semibold px-12 py-6 text-lg rounded-full shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{ background: `linear-gradient(to right, #8c52ff, #6b3acc)` }}
          >
            Book Your Conference
          </Button>
        </div>
      </section>

      <Footer />

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        serviceType="corporate-conferences"
        customTitle="Inquire About Corporate Conferences"
      />
    </div>
  )
}
