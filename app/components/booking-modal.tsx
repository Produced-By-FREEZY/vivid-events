"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Loader2 } from "lucide-react"
import { submitBooking } from "../actions/submit-booking"

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  serviceType?: string
  customTitle?: string
}

export function BookingModal({ isOpen, onClose, serviceType, customTitle }: BookingModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedService, setSelectedService] = useState(serviceType || "event-production")

  useEffect(() => {
    if (serviceType) {
      setSelectedService(serviceType)
    }
  }, [serviceType])

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      await submitBooking(formData)
      onClose()
      router.push("/thank-you")
    } catch (error) {
      console.error("Error submitting booking:", error)
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setSelectedService(serviceType || "event-production")
  }

  const modalTitle = customTitle || "Book Your Event"

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl mx-auto my-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6" style={{ color: "#8c52ff" }} />
            {modalTitle}
          </DialogTitle>
          <p className="text-slate-400 text-sm">
            Please fill out the form below or call us at{" "}
            <a href="tel:604-552-2141" className="text-[#8c52ff] hover:underline">
              604-552-2141
            </a>
          </p>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {/* Name and Email row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">
                Your Name (required)
              </Label>
              <Input
                id="name"
                name="name"
                required
                className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff]"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-slate-300">
                Your Email (required)
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff]"
              />
            </div>
          </div>

          {/* Phone and Guests row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="text-slate-300">
                Your Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff]"
              />
            </div>
            <div>
              <Label htmlFor="estimatedGuests" className="text-slate-300">
                Estimated Number of Guests
              </Label>
              <Input
                id="estimatedGuests"
                name="estimatedGuests"
                type="number"
                className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff]"
              />
            </div>
          </div>

          {/* Start Time and End Time row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eventStartTime" className="text-slate-300">
                Event Start Time
              </Label>
              <Input
                id="eventStartTime"
                name="eventStartTime"
                type="time"
                className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff]"
              />
            </div>
            <div>
              <Label htmlFor="eventEndTime" className="text-slate-300">
                Event End Time
              </Label>
              <Input
                id="eventEndTime"
                name="eventEndTime"
                type="time"
                className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff]"
              />
            </div>
          </div>

          {/* Event Date and Service Requested row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eventDate" className="text-slate-300">
                Event Date
              </Label>
              <Input
                id="eventDate"
                name="eventDate"
                type="date"
                className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff]"
              />
            </div>
            <div>
              <Label htmlFor="serviceRequested" className="text-slate-300">
                Service Requested
              </Label>
              <select
                id="serviceRequested"
                name="serviceRequested"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white focus:border-[#8c52ff] rounded-md px-3 py-2"
              >
                <option value="event-production">Event Production</option>
                <option value="corporate-conferences">Corporate Conferences</option>
                <option value="hybrid-virtual-events">Hybrid & Virtual Events</option>
                <option value="galas-award-ceremonies">Galas & Award Ceremonies</option>
                <option value="weddings-celebrations">Weddings & Celebrations</option>
                <option value="live-music-concerts">Live Music & Concerts</option>
                <option value="product-launches">Product Launches</option>
                <option value="lighting-design">Lighting Design</option>
                <option value="dmx-programming">DMX Programming</option>
                <option value="full-service">Full Service Package</option>
                <option value="consultation">Consultation</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <Label htmlFor="additionalInfo" className="text-slate-300">
              Additional Information
            </Label>
            <Textarea
              id="additionalInfo"
              name="additionalInfo"
              placeholder="Tell us more about your event..."
              className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff] min-h-[80px]"
            />
          </div>

          {/* How did you hear about us */}
          <div>
            <Label htmlFor="howDidYouHear" className="text-slate-300">
              How did you hear about us?
            </Label>
            <Input
              id="howDidYouHear"
              name="howDidYouHear"
              className="bg-slate-700 border-slate-600 text-white focus:border-[#8c52ff]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 text-white font-semibold"
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
