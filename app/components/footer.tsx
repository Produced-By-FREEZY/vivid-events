"use client"
import { useRouter, usePathname } from "next/navigation"
import { Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  const router = useRouter()
  const pathname = usePathname()

  const scrollToSection = (sectionId: string) => {
    if (pathname === "/") {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    } else {
      router.push(`/#${sectionId}`)
    }
  }

  const handlePageClick = (href: string) => {
    window.scrollTo({ top: 0, behavior: "instant" })
    router.push(href)
  }

  return (
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

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handlePageClick("/")}
                  className="text-slate-400 hover:text-white transition-colors duration-300"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageClick("/about")}
                  className="text-slate-400 hover:text-white transition-colors duration-300"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("services")}
                  className="text-slate-400 hover:text-white transition-colors duration-300"
                >
                  Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="text-slate-400 hover:text-white transition-colors duration-300"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Solutions</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handlePageClick("/solutions/corporate-conferences")}
                  className="text-slate-400 hover:text-white transition-colors duration-300"
                >
                  Corporate Conferences
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageClick("/solutions/weddings-celebrations")}
                  className="text-slate-400 hover:text-white transition-colors duration-300"
                >
                  Weddings & Celebrations
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageClick("/solutions/live-music-concerts")}
                  className="text-slate-400 hover:text-white transition-colors duration-300"
                >
                  Live Music & Concerts
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageClick("/solutions/galas-award-ceremonies")}
                  className="text-slate-400 hover:text-white transition-colors duration-300"
                >
                  Galas & Ceremonies
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageClick("/solutions/hybrid-virtual-events")}
                  className="text-slate-400 hover:text-white transition-colors duration-300"
                >
                  Hybrid & Virtual Events
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageClick("/solutions/product-launches")}
                  className="text-slate-400 hover:text-white transition-colors duration-300"
                >
                  Product Launches
                </button>
              </li>
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
  )
}
