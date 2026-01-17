"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Mail, Phone, MapPin, Lightbulb, Users, Award } from "lucide-react"
import { BookingModal } from "@/app/components/booking-modal"
import { Breadcrumb } from "@/app/components/breadcrumb"

export default function AboutPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/images/vivid-events-logo.png"
                alt="Vivid Events Logo"
                className="h-12 w-auto md:h-14 lg:h-16 transition-all duration-300 hover:scale-105 drop-shadow-sm"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-slate-300 hover:text-[#8c52ff] hover:font-bold transition-all duration-300 font-medium"
              >
                Home
              </Link>
              <Link href="/about" className="text-[#8c52ff] font-bold transition-all duration-300">
                About
              </Link>
              <Link
                href="/#services"
                className="text-slate-300 hover:text-[#8c52ff] hover:font-bold transition-all duration-300 font-medium"
              >
                Services
              </Link>
              <Link
                href="/#contact"
                className="text-slate-300 hover:text-[#8c52ff] hover:font-bold transition-all duration-300 font-medium"
              >
                Contact
              </Link>
            </nav>

            {/* Desktop CTA Button */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                onClick={() => setIsBookingOpen(true)}
                className="text-white font-semibold rounded-full px-6 py-2"
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
                Book Now
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white p-2">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-slate-700/50 py-4">
              <nav className="flex flex-col space-y-4">
                <Link
                  href="/"
                  className="text-slate-300 hover:text-[#8c52ff] hover:font-bold transition-all duration-300 text-left font-medium"
                >
                  Home
                </Link>
                <Link href="/about" className="text-[#8c52ff] font-bold transition-all duration-300 text-left">
                  About
                </Link>
                <Link
                  href="/#services"
                  className="text-slate-300 hover:text-[#8c52ff] hover:font-bold transition-all duration-300 text-left font-medium"
                >
                  Services
                </Link>
                <Link
                  href="/#contact"
                  className="text-slate-300 hover:text-[#8c52ff] hover:font-bold transition-all duration-300 text-left font-medium"
                >
                  Contact
                </Link>
                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    onClick={() => setIsBookingOpen(true)}
                    className="text-white font-semibold rounded-full"
                    style={{
                      background: `linear-gradient(to right, #8c52ff, #6b3acc)`,
                    }}
                  >
                    Book Now
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="pt-16">
        <Breadcrumb items={[{ label: "About" }]} />
      </div>

      {/* Hero Section */}
      <section className="pt-16 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#8c52ff]/10 to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <span
            className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{ backgroundColor: "rgba(140, 82, 255, 0.2)", color: "#8c52ff" }}
          >
            About Us
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Where <span style={{ color: "#8c52ff" }}>Innovation</span> Meets{" "}
            <span style={{ color: "#8c52ff" }}>Illumination</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Vivid Events delivers cutting-edge lighting solutions that transform ordinary spaces into extraordinary
            experiences.
          </p>
        </div>
      </section>

      {/* Main About Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Text content - takes 3 columns */}
            <div className="lg:col-span-3">
              <h2 className="text-3xl font-bold text-white mb-6">Your Vision, Our Expertise</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                At Vivid Events, we specialize in delivering comprehensive lighting solutions by seamlessly integrating
                cutting-edge audio-visual and event technologies. From intelligent DMX lighting and sound-reactive
                effects to staging and immersive visual experiences, we help you captivate your audience with power and
                precision.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed">
                Partner with us for a flawless fusion of technology and creativity, making your events truly
                unforgettable.
              </p>
            </div>

            {/* Stats cards - takes 2 columns */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/50 text-center">
                <Lightbulb className="w-8 h-8 mx-auto mb-3" style={{ color: "#8c52ff" }} />
                <h3 className="text-2xl font-bold text-white">500+</h3>
                <p className="text-slate-400 text-sm">Events</p>
              </div>
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/50 text-center">
                <Users className="w-8 h-8 mx-auto mb-3" style={{ color: "#8c52ff" }} />
                <h3 className="text-2xl font-bold text-white">10+</h3>
                <p className="text-slate-400 text-sm">Years</p>
              </div>
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/50 text-center col-span-2">
                <Award className="w-8 h-8 mx-auto mb-3" style={{ color: "#8c52ff" }} />
                <h3 className="text-2xl font-bold text-white">100%</h3>
                <p className="text-slate-400 text-sm">Client Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose <span style={{ color: "#8c52ff" }}>Vivid Events</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              We go beyond traditional lighting services to deliver exceptional experiences that elevate your events.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 hover:border-[#8c52ff]/50 transition-all duration-300">
              <Award className="w-10 h-10 mb-4" style={{ color: "#8c52ff" }} />
              <h3 className="text-xl font-bold text-white mb-3">Cutting-Edge Technology</h3>
              <p className="text-slate-400">
                We utilize the latest DMX lighting systems, intelligent fixtures, and automated control systems to
                create stunning visual experiences that respond to your music in real-time.
              </p>
            </div>
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 hover:border-[#8c52ff]/50 transition-all duration-300">
              <Lightbulb className="w-10 h-10 mb-4" style={{ color: "#8c52ff" }} />
              <h3 className="text-xl font-bold text-white mb-3">Expert Team</h3>
              <p className="text-slate-400">
                Our highly skilled technicians and lighting designers bring years of experience and creative expertise
                to every project, ensuring flawless execution from concept to completion.
              </p>
            </div>
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 hover:border-[#8c52ff]/50 transition-all duration-300">
              <Users className="w-10 h-10 mb-4" style={{ color: "#8c52ff" }} />
              <h3 className="text-xl font-bold text-white mb-3">Customized Solutions</h3>
              <p className="text-slate-400">
                Every event is unique. We work closely with you to design custom lighting packages that perfectly match
                your vision, venue, and budget requirements.
              </p>
            </div>
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 hover:border-[#8c52ff]/50 transition-all duration-300">
              <Phone className="w-10 h-10 mb-4" style={{ color: "#8c52ff" }} />
              <h3 className="text-xl font-bold text-white mb-3">Reliable Service</h3>
              <p className="text-slate-400">
                Count on us for punctual setup, professional operation, and backup equipment on-site. We ensure your
                event runs smoothly without technical interruptions.
              </p>
            </div>
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 hover:border-[#8c52ff]/50 transition-all duration-300">
              <MapPin className="w-10 h-10 mb-4" style={{ color: "#8c52ff" }} />
              <h3 className="text-xl font-bold text-white mb-3">Full-Service Production</h3>
              <p className="text-slate-400">
                From initial consultation to post-event teardown, we handle every aspect of your lighting production so
                you can focus on what matters most - your guests.
              </p>
            </div>
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 hover:border-[#8c52ff]/50 transition-all duration-300">
              <Mail className="w-10 h-10 mb-4" style={{ color: "#8c52ff" }} />
              <h3 className="text-xl font-bold text-white mb-3">Competitive Pricing</h3>
              <p className="text-slate-400">
                Professional-grade lighting solutions at competitive rates. We offer transparent pricing with no hidden
                fees, ensuring exceptional value for your investment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#8c52ff]/20 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Event?</h2>
          <p className="text-slate-300 text-lg mb-8">Let's create an unforgettable lighting experience together.</p>
          <Button
            onClick={() => setIsBookingOpen(true)}
            className="text-white font-semibold rounded-full px-8 py-3 text-lg"
            style={{ background: `linear-gradient(to right, #8c52ff, #6b3acc)` }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `linear-gradient(to right, #a366ff, #8c52ff)`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `linear-gradient(to right, #8c52ff, #6b3acc)`
            }}
          >
            Book Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src="/images/vivid-events-logo.png"
                  alt="Vivid Events Logo"
                  className="h-12 w-auto md:h-16 lg:h-20 transition-all duration-300 drop-shadow-lg"
                />
              </div>
              <p className="text-slate-400 mb-6 max-w-md leading-relaxed">
                Transforming events with intelligent lighting technology. Our automated DMX lighting system creates
                stunning, real-time light shows that perfectly sync with your music.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-400">
                  <Mail className="w-4 h-4" style={{ color: "#8c52ff" }} />
                  <span>info@vividevents.ca</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Phone className="w-4 h-4" style={{ color: "#8c52ff" }} />
                  <span>+1 (236) 878-9991</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <MapPin className="w-4 h-4" style={{ color: "#8c52ff" }} />
                  <span>Langley, British Columbia</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-slate-400 hover:text-white transition-colors duration-300">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-slate-400 hover:text-white transition-colors duration-300">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/#services" className="text-slate-400 hover:text-white transition-colors duration-300">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/#contact" className="text-slate-400 hover:text-white transition-colors duration-300">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-white font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-slate-400">
                <li>Live Event Lighting</li>
                <li>Concert Production</li>
                <li>Corporate Events</li>
                <li>Wedding Lighting</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 mb-4 md:mb-0">© 2026 Vivid Events. All rights reserved.</p>
            <p className="text-slate-500 text-sm">
              Designed by{" "}
              <a
                href="https://google.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8c52ff] font-semibold hover:text-[#a366ff] transition-colors duration-300 hover:underline"
              >
                Mythic Marketing
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </div>
  )
}
