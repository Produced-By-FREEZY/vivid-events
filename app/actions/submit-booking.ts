"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function submitBooking(formData: FormData) {
  try {
    const name = (formData.get("name") as string)?.trim()
    const email = (formData.get("email") as string)?.trim()

    if (!name || !email) {
      throw new Error("Name and email are required")
    }

    const booking = {
      name,
      email,
      phone: (formData.get("phone") as string) || null,
      estimated_guests: (formData.get("estimatedGuests") as string) || null,
      event_start_time: (formData.get("eventStartTime") as string) || null,
      event_end_time: (formData.get("eventEndTime") as string) || null,
      event_date: (formData.get("eventDate") as string) || null,
      service_requested: (formData.get("serviceRequested") as string) || "event-production",
      additional_info: (formData.get("additionalInfo") as string) || null,
      how_did_you_hear: (formData.get("howDidYouHear") as string) || null,
    }

    console.log("[v0] Submitting booking to Supabase:", { name: booking.name, email: booking.email })

    const supabase = createAdminClient()
    const { error } = await supabase.from("bookings").insert(booking)

    if (error) {
      console.error("[v0] Supabase insert error:", error.message)
      throw new Error(error.message)
    }

    console.log("[v0] Booking saved successfully")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error submitting booking:", error)
    throw new Error(`Failed to submit booking: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
