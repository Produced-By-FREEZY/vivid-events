"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Zap, Users, Clock, Shield, ArrowRight, CheckCircle } from "lucide-react"
import { BookingModal } from "./components/booking-modal"
import { AnimatedVisualizer } from "./components/animated-visualizer"
import { Header } from "./components/header"
import { Footer } from "./components/footer"
import { ContactSection } from "./components/contact-section"
import Image from "next/image"

export default function LightingDirectorApp() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined)
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined)

  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash
      if (hash) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          const element = document.getElementById(hash.substring(1))
          if (element) {
            element.scrollIntoView({ behavior: "smooth" })
          }
        }, 100)
      }
    }

    // Handle initial load with hash
    handleHashScroll()

    // Handle hash changes while on the page
    window.addEventListener("hashchange", handleHashScroll)
    return () => window.removeEventListener("hashchange", handleHashScroll)
  }, [])

  const openServiceInquiry = (serviceTitle: string, serviceValue: string) => {
    setSelectedService(serviceValue)
    setModalTitle(`Inquire About ${serviceTitle}`)
    setIsBookingOpen(true)
  }

  const openBookingModal = () => {
    setSelectedService(undefined)
    setModalTitle(undefined)
    setIsBookingOpen(true)
  }

  const services = [
    {
      title: "Corporate Conferences",
      serviceValue: "corporate-conferences",
      subtitle: "Impactful Presentations, Seamless Delivery",
      description:
        "Transform your corporate events with intelligent lighting and crystal-clear audio that keeps your audience engaged. Our automated systems adapt in real-time, ensuring perfect ambiance from keynote to closing remarks.",
      image: "/professional-conference-meeting-with-modern-lighti.jpg",
      features: ["Real-time lighting adaptation", "Multi-room synchronization", "Professional audio clarity"],
    },
    {
      title: "Hybrid & Virtual Events",
      serviceValue: "hybrid-virtual-events",
      subtitle: "Connect Audiences Worldwide",
      description:
        "Bridge the gap between in-person and remote attendees with production quality that rivals broadcast television. Our streamlined tech stack means faster setup, fewer complications, and flawless execution every time.",
      image: "/hybrid-virtual-event-with-screens-and-professional.jpg",
      features: ["4K streaming capability", "Multi-platform distribution", "Interactive audience tools"],
    },
    {
      title: "Galas & Award Ceremonies",
      serviceValue: "galas-award-ceremonies",
      subtitle: "Elegance Meets Innovation",
      description:
        "Create unforgettable moments with dramatic lighting sequences choreographed to your event's rhythm. From red carpet arrivals to standing ovations, every second is designed to impress.",
      image: "/elegant-gala-event-with-dramatic-purple-lighting-a.jpg",
      features: ["Custom lighting choreography", "Dramatic reveal moments", "Elegant atmosphere design"],
    },
    {
      title: "Weddings & Celebrations",
      serviceValue: "weddings-celebrations",
      subtitle: "Your Vision, Perfectly Illuminated",
      description:
        "From intimate ceremonies to grand receptions, our lighting transforms venues into magical spaces. Our compact, modern systems blend seamlessly into your decor while delivering show-stopping visual impact.",
      image: "/beautiful-wedding-reception-with-romantic-purple-u.jpg",
      features: ["Venue transformation", "Mood-responsive lighting", "Minimal footprint design"],
    },
    {
      title: "Live Music & Concerts",
      serviceValue: "live-music-concerts",
      subtitle: "Where Sound Meets Light",
      description:
        "Our proprietary DMX automation synchronizes lighting with every beat, creating an immersive experience that amplifies the energy of live performance. One technician, infinite possibilities.",
      image: "/concert-stage-with-vibrant-purple-and-blue-lightin.jpg",
      features: ["Beat-synchronized lighting", "Automated DMX control", "Dynamic color programming"],
    },
    {
      title: "Product Launches",
      serviceValue: "product-launches",
      subtitle: "Make Your Brand Shine",
      description:
        "Command attention and create buzz with production value that positions your brand as an industry leader. Our efficient setup means more rehearsal time and a polished final presentation.",
      image: "/corporate-product-launch-event-with-modern-stage-l.jpg",
      features: ["Brand-aligned lighting", "Dramatic product reveals", "Social media-ready production"],
    },
  ]

  const serviceCategories = [
    {
      category: "Production Services",
      items: ["Video Production", "Audio Engineering", "Live Streaming", "Webcasting"],
    },
    {
      category: "Event Types",
      items: ["Weddings", "Festivals", "Private Parties", "Corporate Events"],
    },
    {
      category: "Technical Solutions",
      items: ["Custom Lighting Design", "Staging & Platforms", "Equipment Rental", "Event Consultation"],
    },
  ]

  const stats = [
    { value: "500+", label: "Events Delivered" },
    { value: "98%", label: "Client Satisfaction" },
    { value: "50%", label: "Less Equipment Needed" },
    { value: "24/7", label: "Support Available" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header onBookingClick={openBookingModal} />

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <AnimatedVisualizer />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900/80" />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <div className="animate-fade-in-up">
            <Badge
              className="mb-6 border-[#8c52ff]/30 hover:bg-[#8c52ff]/30 transition-all duration-300"
              style={{ backgroundColor: "rgba(140, 82, 255, 0.2)", color: "#c4a7ff" }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              British Columbia's Smart Event Technology Leader
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Smarter Technology.
              </span>
              <br />
              <span style={{ color: "#8c52ff" }}>Stunning Events.</span>
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              We combine automated lighting intelligence with professional AV production to deliver exceptional
              events—using less equipment, fewer crew, and zero compromises.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Serving All of BC
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Same-Week Availability
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Free Consultation
              </span>
            </div>

            <Button
              onClick={openBookingModal}
              size="lg"
              className="font-semibold px-10 py-6 text-lg rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
              style={{
                background: `linear-gradient(to right, #8c52ff, #6b3acc)`,
                color: "white",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(to right, #a366ff, #8c52ff)`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(to right, #8c52ff, #6b3acc)`
              }}
            >
              Book Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-slate-700/50 bg-slate-900/50">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-1" style={{ color: "#8c52ff" }}>
                {stat.value}
              </div>
              <div className="text-slate-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div id="services" className="scroll-mt-20" />

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-white">Event Production</span> <span style={{ color: "#8c52ff" }}>Reimagined</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            From boardrooms to ballrooms, we deliver professional-grade production with technology that works
            smarter—not harder.
          </p>
        </div>

        <div className="max-w-7xl mx-auto space-y-24">
          {services.map((service, index) => (
            <div
              key={index}
              className={`flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-12 items-center`}
            >
              <div className="w-full lg:w-1/2 relative group">
                <div className="overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl">
                  <Image
                    src={service.image || "/placeholder.svg"}
                    alt={`${service.title} - Vivid Events BC`}
                    width={600}
                    height={400}
                    className="w-full h-72 sm:h-96 object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-2"
                      style={{ backgroundColor: "rgba(140, 82, 255, 0.3)", color: "#c4a7ff" }}
                    >
                      {service.subtitle}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-1/2 space-y-6">
                <h3 className="text-3xl sm:text-4xl font-bold text-white">{service.title}</h3>
                <p className="text-slate-400 text-lg leading-relaxed">{service.description}</p>

                <ul className="space-y-3">
                  {service.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-3 text-slate-300">
                      <Zap className="w-5 h-5 flex-shrink-0" style={{ color: "#8c52ff" }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => openServiceInquiry(service.title, service.serviceValue)}
                  className="mt-4 rounded-full px-8 py-3 font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: "transparent",
                    border: "2px solid #8c52ff",
                    color: "#8c52ff",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#8c52ff"
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color = "#8c52ff"
                  }}
                >
                  Inquire About This Service
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Complete Event Solutions</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Everything you need for a flawless event, all from one trusted partner.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {serviceCategories.map((category, index) => (
              <div
                key={index}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-[#8c52ff]/30 transition-all duration-300"
              >
                <h3 className="text-xl font-semibold mb-4" style={{ color: "#8c52ff" }}>
                  {category.category}
                </h3>
                <ul className="space-y-3">
                  {category.items.map((item, iIndex) => (
                    <li key={iIndex} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ backgroundColor: "rgba(140, 82, 255, 0.15)" }}
          >
            <Shield className="w-5 h-5" style={{ color: "#8c52ff" }} />
            <span className="text-sm" style={{ color: "#c4a7ff" }}>
              Trusted by Event Planners Across BC
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
            Ready to Elevate Your Next Event?
          </h2>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join hundreds of satisfied clients who've discovered the Vivid Events difference. Our team is ready to bring
            your vision to life with technology that delivers more impact with less complexity.
          </p>

          <div className="flex flex-wrap justify-center gap-8 mb-10">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-5 h-5" style={{ color: "#8c52ff" }} />
              <span>Fast Setup</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="w-5 h-5" style={{ color: "#8c52ff" }} />
              <span>Dedicated Support</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="w-5 h-5" style={{ color: "#8c52ff" }} />
              <span>Modern Technology</span>
            </div>
          </div>

          <Button
            onClick={openBookingModal}
            size="lg"
            className="font-semibold px-12 py-6 text-lg rounded-full shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{
              background: `linear-gradient(to right, #8c52ff, #6b3acc)`,
              color: "white",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `linear-gradient(to right, #a366ff, #8c52ff)`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `linear-gradient(to right, #8c52ff, #6b3acc)`
            }}
          >
            Start Planning Your Event
          </Button>

          <p className="mt-4 text-sm text-slate-500">No commitment required. Get a custom quote in 24 hours.</p>
        </div>
      </section>

      <ContactSection />
      <Footer />
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        serviceType={selectedService}
        customTitle={modalTitle}
      />
    </div>
  )
}
