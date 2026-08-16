import { NextResponse } from "next/server"
import { generateDataSheetPdf, type DataSheetImage } from "@/lib/data-sheet-pdf"
import { generateEventImages, type RefImage } from "@/lib/data-sheet-ai"

export const maxDuration = 300

function dataUrlToImage(dataUrl: string): DataSheetImage | null {
  const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!m) return null
  return {
    bytes: Uint8Array.from(Buffer.from(m[2], "base64")),
    format: m[1].toLowerCase().includes("png") ? "png" : "jpg",
  }
}

export async function GET() {
  // Reference product photo (the wireless white uplight the user shared).
  const heroUrl =
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-WpHsuBO7p4nBrfj24L3KmlcjN7BffR.png"
  const heroBuf = Buffer.from(await (await fetch(heroUrl)).arrayBuffer())
  const heroDataUrl = `data:image/png;base64,${heroBuf.toString("base64")}`
  const hero = dataUrlToImage(heroDataUrl)

  const refs: RefImage[] = [{ dataUrl: heroDataUrl }]
  const shots = await generateEventImages("White LED Uplight (wireless)", refs, 4)
  const gallery = shots.map(dataUrlToImage).filter((x): x is DataSheetImage => x !== null)

  const pdf = await generateDataSheetPdf({
    productName: "White LED Uplight (wireless)",
    tagline: "Wireless color that transforms any room",
    marketingCopy:
      "The White LED Uplight is a standout addition to any live event. Built for reliability and designed to impress, it brings a polished, professional edge to weddings, corporate functions and large-scale productions.\n\nFully wireless and battery powered, it deploys in seconds and runs all night — washing walls, architecture and dance floors in 16.7 million colors.",
    specItems: [
      { label: "6 Modes", value: "Sound Activated / Master-slave / DMX wireless controller / DMX512 / IR remote / Sound-to-Light" },
      { label: "Voltage", value: "AC100V-250V 50/60Hz — Power consumption: 110W" },
      { label: "Lithium Battery", value: "8800mAh" },
      { label: "Light Source", value: "6pcs 18W high brightness 6-in-1 LEDs" },
      { label: "Color", value: "16.7 million kinds of color change" },
      { label: "Run Time", value: "Up to 12 hours on a single charge" },
    ],
    issuedDate: new Date().toLocaleDateString("en-CA"),
    hero,
    gallery,
  })

  return new NextResponse(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=preview.pdf" },
  })
}
