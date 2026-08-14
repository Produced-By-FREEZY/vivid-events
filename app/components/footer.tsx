"use client"
import type React from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
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

  const quickLinks: { label: string; onClick: () => void }[] = [
    { label: "Home", onClick: () => handlePageClick("/") },
    { label: "About", onClick: () => handlePageClick("/about") },
    { label: "Services", onClick: () => scrollToSection("services") },
    { label: "Contact", onClick: () => scrollToSection("contact") },
  ]

  const solutions: { label: string; href: string }[] = [
    { label: "Corporate Conferences", href: "/solutions/corporate-conferences" },
    { label: "Weddings & Celebrations", href: "/solutions/weddings-celebrations" },
    { label: "Live Music & Concerts", href: "/solutions/live-music-concerts" },
    { label: "Galas & Ceremonies", href: "/solutions/galas-award-ceremonies" },
    { label: "Hybrid & Virtual Events", href: "/solutions/hybrid-virtual-events" },
    { label: "Product Launches", href: "/solutions/product-launches" },
  ]

  const contactInfo: { icon: React.ElementType; text: string; href?: string }[] = [
    { icon: Mail, text: "info@vividevents.ca", href: "mailto:info@vividevents.ca" },
    { icon: Phone, text: "+1 (236) 878-9991", href: "tel:+12368789991" },
    { icon: MapPin, text: "Langley, British Columbia" },
  ]

  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-300">
      {/* Top accent line */}
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(to right, transparent, #8c52ff, transparent)" }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid gap-12 py-16 md:grid-cols-12">
          {/* Brand + contact */}
          <div className="md:col-span-5">
            <img
              src="/images/vivid-events-logo.png"
              alt="Vivid Events"
              className="mb-6 h-14 w-auto drop-shadow-lg md:h-16"
            />
            <p className="mb-8 max-w-sm text-sm leading-relaxed text-slate-400">
              Transforming events with intelligent lighting technology. Our automated DMX system creates stunning,
              real-time light shows that sync perfectly with your music.
            </p>
            <ul className="space-y-3">
              {contactInfo.map(({ icon: Icon, text, href }) => (
                <li key={text}>
                  {href ? (
                    <a
                      href={href}
                      className="group flex items-center gap-3 text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 transition-colors group-hover:border-[#8c52ff]/50">
                        <Icon className="h-4 w-4" style={{ color: "#8c52ff" }} />
                      </span>
                      {text}
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900">
                        <Icon className="h-4 w-4" style={{ color: "#8c52ff" }} />
                      </span>
                      {text}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-widest text-slate-500">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={link.onClick}
                    className="group inline-flex items-center text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    <span className="mr-0 h-px w-0 bg-[#8c52ff] transition-all duration-300 group-hover:mr-2 group-hover:w-4" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div className="md:col-span-4">
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-widest text-slate-500">Solutions</h3>
            <ul className="space-y-3">
              {solutions.map((item) => (
                <li key={item.href}>
                  <button
                    onClick={() => handlePageClick(item.href)}
                    className="group inline-flex items-center text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    <span className="mr-0 h-px w-0 bg-[#8c52ff] transition-all duration-300 group-hover:mr-2 group-hover:w-4" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 py-6 sm:flex-row">
          <p className="text-sm text-slate-500">
            &copy; 2026{" "}
            <Link
              href="/portal/login"
              aria-label="Agency portal"
              className="cursor-default text-slate-500 no-underline outline-none hover:text-slate-500 focus:outline-none"
            >
              Vivid Events
            </Link>
            . All rights reserved.
          </p>
          <p className="text-xs uppercase tracking-widest text-slate-600">Intelligent Lighting &middot; Langley, BC</p>
        </div>

        {/* Subtle attribution — dead center at the absolute bottom */}
        <div className="flex justify-center pb-5">
          <p className="text-center text-xs text-muted-foreground opacity-30">
            Made by{" "}
            <a
              href="https://www.mythicmarketing.ca/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-300 hover:text-yellow-400 hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"
            >
              Mythic
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
