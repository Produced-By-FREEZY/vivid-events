"use server"

import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateMarketingCopy, generateEventImages, type RefImage, type SpecItem } from "@/lib/data-sheet-ai"
import { generateDataSheetPdf, type DataSheetImage } from "@/lib/data-sheet-pdf"

const BUCKET = "data-sheets"
const MAX_REF_IMAGES = 5
const GALLERY_COUNT = 3 // 1 hero + 2 gallery

export type DataSheetRecord = {
  id: string
  productName: string
  specifications: string
  tagline: string
  marketingCopy: string
  specItems: SpecItem[]
  heroImageUrl: string | null
  galleryImageUrls: string[]
  pdfUrl: string | null
  createdAt: string
  /** true when the "in action" images were AI-generated rather than the owner's uploads */
  aiImages: boolean
}

export type GenerateInput = {
  productName: string
  specifications: string
  /** Reference photos as data URLs (data:image/...;base64,...) */
  referenceImages: string[]
}

export type GenerateResult =
  | { success: true; record: DataSheetRecord }
  | { success: false; error: string }

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function dataUrlToImage(dataUrl: string): DataSheetImage | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return null
  const mime = match[1].toLowerCase()
  const bytes = Uint8Array.from(Buffer.from(match[2], "base64"))
  const format: "png" | "jpg" = mime.includes("png") ? "png" : "jpg"
  return { bytes, format }
}

function extFor(format: "png" | "jpg") {
  return format === "png" ? "png" : "jpg"
}

function contentTypeFor(format: "png" | "jpg") {
  return format === "png" ? "image/png" : "image/jpeg"
}

async function uploadBytes(
  admin: ReturnType<typeof createAdminClient>,
  pathKey: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<string | null> {
  const { error } = await admin.storage.from(BUCKET).upload(pathKey, bytes, {
    contentType,
    upsert: true,
  })
  if (error) {
    console.error("[v0] data-sheet upload failed:", error.message)
    return null
  }
  const { data } = admin.storage.from(BUCKET).getPublicUrl(pathKey)
  return data.publicUrl
}

/* ------------------------------------------------------------------ */
/* Generate                                                           */
/* ------------------------------------------------------------------ */

export async function generateDataSheet(input: GenerateInput): Promise<GenerateResult> {
  // Require an authenticated portal session.
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "You must be signed in to generate a data sheet." }
  }

  const productName = (input.productName || "").trim()
  const specifications = (input.specifications || "").trim()

  if (!productName) {
    return { success: false, error: "Please enter a product or fixture name." }
  }

  try {
    // Parse reference images (owner uploads).
    const refImages: RefImage[] = (input.referenceImages || [])
      .slice(0, MAX_REF_IMAGES)
      .filter((u) => typeof u === "string" && u.startsWith("data:image/"))
      .map((dataUrl) => ({ dataUrl }))

    // 1) Marketing copy + structured specs (Gemini).
    const copy = await generateMarketingCopy(productName, specifications)

    // 2) Event-action images (Nano Banana). Falls back to owner uploads when
    //    image generation is unavailable (e.g. no AI Gateway credits).
    let aiImages = false
    let imageDataUrls: string[] = []
    if (refImages.length) {
      const generated = await generateEventImages(productName, refImages, GALLERY_COUNT)
      if (generated.length) {
        aiImages = true
        imageDataUrls = generated
      } else {
        // Fallback: use the owner's uploaded photos directly.
        imageDataUrls = refImages.map((r) => r.dataUrl).slice(0, GALLERY_COUNT)
      }
    }

    // Convert image data URLs to raw bytes for the PDF + storage.
    const images = imageDataUrls
      .map((u) => ({ dataUrl: u, img: dataUrlToImage(u) }))
      .filter((x): x is { dataUrl: string; img: DataSheetImage } => x.img !== null)

    const heroImage = images[0]?.img ?? null
    const galleryImages = images.slice(1).map((x) => x.img)

    const issuedDate = new Date().toLocaleDateString("en-CA")

    // 3) Build the branded PDF.
    const pdfBytes = await generateDataSheetPdf({
      productName,
      tagline: copy.tagline,
      marketingCopy: copy.marketingCopy,
      specItems: copy.specItems,
      issuedDate,
      hero: heroImage,
      gallery: galleryImages,
    })

    // 4) Persist assets + row (service role — trusted server context).
    const admin = createAdminClient()
    const id = crypto.randomUUID()

    let heroImageUrl: string | null = null
    const galleryImageUrls: string[] = []

    if (images.length) {
      // hero
      const hero = images[0]
      heroImageUrl = await uploadBytes(
        admin,
        `${id}/hero.${extFor(hero.img.format)}`,
        hero.img.bytes,
        contentTypeFor(hero.img.format),
      )
      // gallery
      for (let i = 1; i < images.length; i++) {
        const g = images[i]
        const url = await uploadBytes(
          admin,
          `${id}/gallery-${i}.${extFor(g.img.format)}`,
          g.img.bytes,
          contentTypeFor(g.img.format),
        )
        if (url) galleryImageUrls.push(url)
      }
    }

    const pdfUrl = await uploadBytes(admin, `${id}/data-sheet.pdf`, pdfBytes, "application/pdf")

    const { data: row, error: insertError } = await admin
      .from("data_sheets")
      .insert({
        id,
        product_name: productName,
        specifications,
        marketing_copy: copy.marketingCopy,
        spec_items: copy.specItems,
        hero_image_url: heroImageUrl,
        gallery_image_urls: galleryImageUrls,
        pdf_url: pdfUrl,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] data_sheets insert failed:", insertError.message)
      return { success: false, error: "The brochure was generated but could not be saved. Please try again." }
    }

    return {
      success: true,
      record: {
        id: row.id,
        productName,
        specifications,
        tagline: copy.tagline,
        marketingCopy: copy.marketingCopy,
        specItems: copy.specItems,
        heroImageUrl,
        galleryImageUrls,
        pdfUrl,
        createdAt: row.created_at,
        aiImages,
      },
    }
  } catch (err) {
    console.error("[v0] generateDataSheet failed:", err instanceof Error ? err.message : err)
    return { success: false, error: "Something went wrong generating the data sheet. Please try again." }
  }
}

/* ------------------------------------------------------------------ */
/* List / delete saved data sheets                                    */
/* ------------------------------------------------------------------ */

export async function listDataSheets(): Promise<DataSheetRecord[]> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("data_sheets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("[v0] listDataSheets failed:", error.message)
    return []
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    productName: row.product_name,
    specifications: row.specifications ?? "",
    tagline: "",
    marketingCopy: row.marketing_copy ?? "",
    specItems: Array.isArray(row.spec_items) ? row.spec_items : [],
    heroImageUrl: row.hero_image_url ?? null,
    galleryImageUrls: Array.isArray(row.gallery_image_urls) ? row.gallery_image_urls : [],
    pdfUrl: row.pdf_url ?? null,
    createdAt: row.created_at,
    aiImages: false,
  }))
}

export async function deleteDataSheet(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "You must be signed in." }

  const admin = createAdminClient()

  // Best-effort remove stored assets.
  const { data: files } = await admin.storage.from(BUCKET).list(id)
  if (files?.length) {
    await admin.storage.from(BUCKET).remove(files.map((f) => `${id}/${f.name}`))
  }

  const { error } = await admin.from("data_sheets").delete().eq("id", id)
  if (error) {
    console.error("[v0] deleteDataSheet failed:", error.message)
    return { success: false, error: "Could not delete the data sheet." }
  }
  return { success: true }
}
