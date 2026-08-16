import "server-only"

/**
 * AI helpers for the Product Data Sheet generator.
 *
 * Everything runs through the Vercel AI Gateway via the AI SDK (`ai` package),
 * which authenticates automatically on Vercel — no AI_GATEWAY_API_KEY needed.
 *
 * - Marketing copy + normalized spec rows: Gemini text model (`generateObject`).
 * - Event "in action" shots + a clean studio hero: Gemini image model
 *   (`generateText` → `result.files`). When reference photos are supplied they
 *   are passed in as multimodal input so the generated scenes stay faithful to
 *   the real fixture.
 *
 * All image helpers degrade gracefully: on any failure they return an empty
 * result and the caller falls back to the owner's uploaded photos.
 */

import { generateObject, generateText } from "ai"
import { z } from "zod"

const TEXT_MODEL = "google/gemini-2.5-flash"
const IMAGE_MODEL = "google/gemini-3.1-flash-image"

export type SpecItem = { label: string; value: string }

export type CopyResult = {
  tagline: string
  marketingCopy: string
  specItems: SpecItem[]
}

/** Data URL like `data:image/png;base64,...` */
export type RefImage = { dataUrl: string }

/* ------------------------------------------------------------------ */
/* Marketing copy + structured specs                                   */
/* ------------------------------------------------------------------ */

const copySchema = z.object({
  tagline: z.string().describe("A short, punchy 4-8 word headline"),
  marketingCopy: z
    .string()
    .describe("Two short paragraphs (max ~90 words total) of persuasive, benefit-led marketing copy. Plain text."),
  specItems: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .describe("Between 4 and 8 clean technical spec rows"),
})

export async function generateMarketingCopy(productName: string, specifications: string): Promise<CopyResult> {
  const system =
    "You are a senior copywriter for Vivid Events, a premium audio, video, lighting and event-production rental company. " +
    "You write punchy, professional marketing copy for product data sheets that help event planners rent gear."

  const prompt = `Product / fixture name: ${productName || "(unnamed product)"}
Owner-supplied specifications & details:
"""
${specifications || "(none provided)"}
"""

Write:
- tagline: a short, punchy 4-8 word headline.
- marketingCopy: 2 short paragraphs (max ~90 words total) describing the product in action at live events. Confident, vivid, benefit-led. Plain text, no markdown.
- specItems: extract concrete technical specs into clean label/value pairs (e.g. "Power": "300W", "Weight": "4.2 kg", "DMX Channels": "16"). If details are sparse, infer sensible, realistic professional specs. Provide between 4 and 8 rows with concise values.`

  try {
    const { object } = await generateObject({
      model: TEXT_MODEL,
      schema: copySchema,
      system,
      prompt,
      temperature: 0.7,
    })

    const specItems: SpecItem[] = (object.specItems ?? [])
      .map((s) => ({ label: String(s?.label ?? "").trim(), value: String(s?.value ?? "").trim() }))
      .filter((s) => s.label && s.value)
      .slice(0, 8)

    return {
      tagline: object.tagline?.trim() || "Professional-grade event production",
      marketingCopy:
        object.marketingCopy?.trim() ||
        "Engineered for demanding live events, this product delivers reliable, standout performance every time.",
      specItems: specItems.length ? specItems : fallbackSpecs(specifications),
    }
  } catch (err) {
    console.error("[v0] generateMarketingCopy failed:", err instanceof Error ? err.message : err)
    return {
      tagline: "Professional-grade event production",
      marketingCopy:
        `The ${productName || "product"} is a standout addition to any live event. Built for reliability and ` +
        "designed to impress, it brings a polished, professional edge to weddings, corporate functions and large-scale productions.",
      specItems: fallbackSpecs(specifications),
    }
  }
}

function fallbackSpecs(specifications: string): SpecItem[] {
  const rows: SpecItem[] = []
  for (const raw of (specifications || "").split(/\n+/)) {
    const line = raw.trim()
    if (!line) continue
    const m = line.match(/^([^:\-–]{2,40})[:\-–]\s*(.+)$/)
    if (m) rows.push({ label: m[1].trim(), value: m[2].trim() })
    if (rows.length >= 8) break
  }
  return rows
}

/* ------------------------------------------------------------------ */
/* Event-action image generation (Gemini image / "Nano Banana")        */
/* ------------------------------------------------------------------ */

/** Real-world event scenarios the owner wants to showcase the fixtures in. */
const EVENT_SCENES = [
  "an upscale real-estate showing of a high-end modern home at dusk — the fixtures wash the architecture, entryway and landscaping in rich, saturated color",
  "a lively backyard BBQ / house party at night — warm ambience plus the fixtures throwing vibrant colored uplight across the fence, trees and patio, guests softly blurred",
  "a sleek car show at night — polished luxury cars with the fixtures casting dramatic colored beams across the floor and back wall",
  "an elegant wedding reception in a ballroom — the fixtures uplighting the walls and draping in tasteful color, tables and guests softly blurred",
  "a high-energy concert / live-event stage — bold colored beams cutting through atmospheric haze with crowd bokeh in the background",
]

function scenePrompt(productName: string, scene: string, hasRefs: boolean): string {
  const faithful = hasRefs
    ? "Keep the fixture faithful to the real product design, shape and finish shown in the reference photo(s). "
    : ""
  return (
    `Ultra-realistic professional event photography. Show the ${productName || "event lighting fixture"} ` +
    `in action at ${scene}. The fixture(s) should be clearly visible as the source of the light. ` +
    faithful +
    "Cinematic, vivid colored lighting, atmospheric depth, high dynamic range, sharp detail, 4k. " +
    "Photograph only — absolutely no text, captions, logos or watermarks."
  )
}

function filesToDataUrls(files: Array<{ mediaType?: string; uint8Array?: Uint8Array }>): string[] {
  const out: string[] = []
  for (const f of files ?? []) {
    if (f?.mediaType?.startsWith("image/") && f.uint8Array?.length) {
      const b64 = Buffer.from(f.uint8Array).toString("base64")
      out.push(`data:${f.mediaType};base64,${b64}`)
    }
  }
  return out
}

async function generateOneImage(prompt: string, refImages: RefImage[]): Promise<string | null> {
  const content: Array<{ type: "text"; text: string } | { type: "image"; image: string }> = [
    { type: "text", text: prompt },
  ]
  for (const img of refImages.slice(0, 3)) {
    content.push({ type: "image", image: img.dataUrl })
  }

  const result = await generateText({
    model: IMAGE_MODEL,
    messages: [{ role: "user", content }],
  })

  const urls = filesToDataUrls(result.files as any)
  return urls[0] ?? null
}

/**
 * Generates `count` distinct event-action images. Uses reference photos (when
 * provided) so the fixture stays faithful. Runs in parallel and returns the
 * data URLs that succeeded — an empty array means generation is unavailable.
 */
export async function generateEventImages(
  productName: string,
  refImages: RefImage[],
  count: number,
): Promise<string[]> {
  const scenes = Array.from({ length: count }, (_, i) => EVENT_SCENES[i % EVENT_SCENES.length])
  const hasRefs = refImages.length > 0

  const settled = await Promise.allSettled(
    scenes.map((scene) => generateOneImage(scenePrompt(productName, scene, hasRefs), refImages)),
  )

  const out: string[] = []
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value) out.push(r.value)
    else if (r.status === "rejected") {
      console.error("[v0] generateEventImages scene failed:", r.reason instanceof Error ? r.reason.message : r.reason)
    }
  }
  return out
}

/**
 * Generates a clean studio hero shot of the fixture on a seamless black
 * background — used when the owner hasn't uploaded a product photo to use as
 * the hero. Returns a data URL or null when unavailable.
 */
export async function generateStudioHero(
  productName: string,
  refImages: RefImage[],
): Promise<string | null> {
  const hasRefs = refImages.length > 0
  const faithful = hasRefs
    ? "Faithfully match the real product design, shape and finish shown in the reference photo(s). "
    : ""
  const prompt =
    `Clean professional studio product photograph of the ${productName || "event lighting fixture"}, ` +
    "centered on a seamless dark charcoal-to-black background, soft even catalog lighting, subtle reflection, " +
    faithful +
    "crisp focus, high detail, 4k. Photograph only — no text, logos or watermarks."
  try {
    return await generateOneImage(prompt, refImages)
  } catch (err) {
    console.error("[v0] generateStudioHero failed:", err instanceof Error ? err.message : err)
    return null
  }
}
