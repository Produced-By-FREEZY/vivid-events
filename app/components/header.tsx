"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown } from "lucide-react"

interface HeaderProps {
  onBookingClick?: () => void
}

const solutions = [
  { name: "Corporate Conferences", href: "/solutions/corporate-conferences" },
  { name: "Hybrid & Virtual Events", href: "/solutions/hybrid-virtual-events" },
  { name: "Galas & Award Ceremonies", href: "/solutions/galas-award-ceremonies" },
  { name: "Weddings & Celebrations", href: "/solutions/weddings-celebrations" },
  { name: "Live Music & Concerts", href: "/solutions/live-music-concerts" },
  { name: "Product Launches", href: "/solutions/product-launches" },
]

export function Header({ onBookingClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false)
  const [isMobileSolutionsOpen, setIsMobileSolutionsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const isHomePage = pathname === "/"

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSolutionsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const scrollToSection = (sectionId: string) => {
    setIsMenuOpen(false)

    if (isHomePage) {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    } else {
      // Navigate to home page with hash - the home page will handle the scroll
      router.push(`/#${sectionId}`)
    }
  }

  const handleBookingClick = () => {
    setIsMenuOpen(false)
    if (onBookingClick) {
      onBookingClick()
    } else {
      if (isHomePage) {
        const element = document.getElementById("contact")
        if (element) {
          element.scrollIntoView({ behavior: "smooth" })
        }
      } else {
        router.push("/#contact")
      }
    }
  }

  return (
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
            <Link
              href="/about"
              className="text-slate-300 hover:text-[#8c52ff] hover:font-bold transition-all duration-300 font-medium"
            >
              About
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsSolutionsOpen(!isSolutionsOpen)}
                className="flex items-center gap-1 text-slate-300 hover:text-[#8c52ff] hover:font-bold transition-all duration-300 font-medium"
              >
                Solutions
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isSolutionsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isSolutionsOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                  {solutions.map((solution) => (
                    <Link
                      key={solution.href}
                      href={solution.href}
                      className="block px-4 py-3 text-slate-300 hover:bg-[#8c52ff]/20 hover:text-[#8c52ff] transition-all duration-200"
                      onClick={() => setIsSolutionsOpen(false)}
                    >
                      {solution.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => scrollToSection("services")}
              className="text-slate-300 hover:text-[#8c52ff] hover:font-bold transition-all duration-300 font-medium"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-slate-300 hover:text-[#8c52ff] hover:font-bold transition-all duration-300 font-medium"
            >
              Contact
            </button>
          </nav>

          {/* Desktop CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              onClick={handleBookingClick}
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
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-slate-300 hover:text-[#8c52ff] hover:font-bold transition-all duration-300 text-left font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>

              <div>
                <button
                  onClick={() => setIsMobileSolutionsOpen(!isMobileSolutionsOpen)}
                  className="flex items-center gap-1 text-slate-300 hover:text-[#8c52ff] hover:font-bold transition-all duration-300 font-medium"
                >
                  Solutions
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isMobileSolutionsOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isMobileSolutionsOpen && (
                  <div className="pl-4 mt-2 space-y-2 border-l-2 border-[#8c52ff]/30">
                    {solutions.map((solution) => (
                      <Link
                        key={solution.href}
                        href={solution.href}
                        className="block py-2 text-slate-400 hover:text-[#8c52ff] transition-all duration-200 text-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {solution.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => scrollToSection("services")}
                className="text-slate-300 hover:text-[#8c52ff] hover:font-bold transition-all duration-300 text-left font-medium"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-slate-300 hover:text-[#8c52ff] hover:font-bold transition-all duration-300 text-left font-medium"
              >
                Contact
              </button>
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={handleBookingClick}
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
  )
}
