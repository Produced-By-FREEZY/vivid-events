"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { submitBooking } from "../actions/submit-booking"

export function ContactSection() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const form = e.currentTarget
      const formData = new FormData()

      const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value
      const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value
      formData.append("name", `${firstName} ${lastName}`)
      formData.append("email", (form.elements.namedItem("email") as HTMLInputElement).value)
      formData.append("phone", (form.elements.namedItem("phone") as HTMLInputElement).value || "")
      formData.append("estimatedGuests", "") // Not applicable for contact
      formData.append("eventStartTime", "") // Not applicable for contact
      formData.append("eventEndTime", "") // Not applicable for contact
      formData.append("eventDate", "") // Not applicable for contact
      formData.append("serviceRequested", (form.elements.namedItem("inquiryType") as HTMLSelectElement).value)
      formData.append("additionalInfo", (form.elements.namedItem("message") as HTMLTextAreaElement).value)
      formData.append("howDidYouHear", (form.elements.namedItem("howDidYouHear") as HTMLInputElement).value || "")

      await submitBooking(formData)
      router.push("/thank-you")
    } catch (error) {
      console.error("Error submitting contact form:", error)
      setIsSubmitting(false)
    }
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-bold mb-8 bg-gradient-to-r from-[#8c52ff] to-white bg-clip-text text-transparent">
          Ready to Transform Your Event?
        </h2>
        <p className="text-xl text-slate-300 mb-12">
          Get in touch with us today and let's create an unforgettable lighting experience for your next event.
        </p>

        {/* Contact Toggle Button */}
        <Button
          onClick={toggleExpanded}
          size="lg"
          className="mb-8 text-white font-semibold px-8 py-4 text-xl transition-all duration-300 transform hover:scale-105"
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
          Contact Us
          {isExpanded ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
        </Button>

        {/* Expandable Contact Form */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <Card className="bg-slate-800/60 border-slate-700/50 max-w-2xl mx-auto">
            <CardContent className="p-10">
              <div className="text-left mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Get In Touch</h3>
                <p className="text-slate-400">
                  Have a question or want to learn more? Fill out the form below or call us at{" "}
                  <a href="tel:604-552-2141" className="text-[#8c52ff] hover:underline">
                    604-552-2141
                  </a>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 text-left">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName" className="text-slate-300 text-lg">
                      First Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      required
                      placeholder="John"
                      className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff] h-12 text-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-slate-300 text-lg">
                      Last Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      required
                      placeholder="Smith"
                      className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff] h-12 text-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email" className="text-slate-300 text-lg">
                      Email Address <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="john@example.com"
                      className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff] h-12 text-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-slate-300 text-lg">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(604) 555-1234"
                      className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff] h-12 text-lg"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="inquiryType" className="text-slate-300 text-lg">
                    What can we help you with? <span className="text-red-400">*</span>
                  </Label>
                  <select
                    id="inquiryType"
                    name="inquiryType"
                    required
                    className="w-full bg-slate-700 border border-slate-600 text-white focus:border-[#8c52ff] rounded-md px-3 py-3 text-lg"
                  >
                    <option value="">Select an option</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Pricing Information">Pricing Information</option>
                    <option value="Service Availability">Service Availability</option>
                    <option value="Partnership Opportunity">Partnership Opportunity</option>
                    <option value="Technical Question">Technical Question</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="message" className="text-slate-300 text-lg">
                    Your Message <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us how we can help you..."
                    required
                    className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff] min-h-[150px] text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="howDidYouHear" className="text-slate-300 text-lg">
                    How did you hear about us?
                  </Label>
                  <Input
                    id="howDidYouHear"
                    name="howDidYouHear"
                    placeholder="Google, referral, social media, etc."
                    className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff] h-12 text-lg"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full text-white font-semibold py-4 text-xl"
                  style={{
                    background: `linear-gradient(to right, #8c52ff, #6b3acc)`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.background = `linear-gradient(to right, #a366ff, #8c52ff)`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.background = `linear-gradient(to right, #8c52ff, #6b3acc)`
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
