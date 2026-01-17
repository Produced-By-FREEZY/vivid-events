"use server"

import { Client } from "@notionhq/client"

export async function submitBooking(formData: FormData) {
  try {
    if (!process.env.NOTION_API_KEY) {
      console.error("NOTION_API_KEY is not set")
      throw new Error("Notion API key is not configured")
    }

    if (!process.env.NOTION_BOOKING_DATABASE_ID) {
      console.error("NOTION_BOOKING_DATABASE_ID is not set")
      throw new Error("Notion booking database ID is not configured")
    }

    const notion = new Client({
      auth: process.env.NOTION_API_KEY,
    })

    // Extract new form fields
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = (formData.get("phone") as string) || ""
    const estimatedGuests = (formData.get("estimatedGuests") as string) || ""
    const eventStartTime = (formData.get("eventStartTime") as string) || ""
    const eventEndTime = (formData.get("eventEndTime") as string) || ""
    const eventDate = (formData.get("eventDate") as string) || ""
    const serviceRequested = (formData.get("serviceRequested") as string) || "event-production"
    const additionalInfo = (formData.get("additionalInfo") as string) || ""
    const howDidYouHear = (formData.get("howDidYouHear") as string) || ""

    console.log("Submitting booking to Notion:", { name, email })

    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_BOOKING_DATABASE_ID,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: name,
              },
            },
          ],
        },
        Email: {
          email: email,
        },
        Phone: {
          phone_number: phone || null,
        },
        "Estimated Number of Guests": {
          rich_text: [
            {
              text: {
                content: estimatedGuests,
              },
            },
          ],
        },
        "Event Start Time": {
          rich_text: [
            {
              text: {
                content: eventStartTime,
              },
            },
          ],
        },
        "Event End Time": {
          rich_text: [
            {
              text: {
                content: eventEndTime,
              },
            },
          ],
        },
        "Event Date": eventDate
          ? {
              date: {
                start: eventDate,
              },
            }
          : undefined,
        "Service Requested": {
          select: {
            name: serviceRequested,
          },
        },
        "Additional Information": {
          rich_text: [
            {
              text: {
                content: additionalInfo,
              },
            },
          ],
        },
        "How did you hear about us?": {
          rich_text: [
            {
              text: {
                content: howDidYouHear,
              },
            },
          ],
        },
        Submitted: {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    })

    console.log("Successfully created Notion page:", response.id)
    return { success: true }
  } catch (error) {
    console.error("Error submitting booking to Notion:", error)
    throw new Error(`Failed to submit booking: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
