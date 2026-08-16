import "server-only"

/**
 * AI helpers for the Product Data Sheet generator.
 *
 * Text (marketing copy + normalized spec rows) is generated with Gemini via the
 * Vercel AI Gateway. Event-action hero/gallery images are generated with Google's
 * "Nano Banana" image model, which takes the owner's reference photos as input and
 * re-renders the product in polished, high-contrast event lighting.
 *
 * Image generation requires paid AI Gateway credits. When it is unavailable (e.g.
 * free tier) the image helpers return an empty list and the caller gracefully falls
 * back to the owner's uploaded reference photos — the feature keeps working, and the
 * AI shots turn on automatically once credits are added.
 */

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions"
const TEXT_MODEL = "google/gemini-2.5-flash"
const IMAGE_MODEL = "google/gemini-3.1-flash-image"

function authHeader() {
  const key = process.env.AI_GATEWAY_API_KEY
  if (!key) throw new Error("AI_GATEWAY_API_KEY is not configured")
  return `Bearer ${key}`
}

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

export async function generateMarketingCopy(productName: string, specifications: string): Promise<CopyResult> {
  const system =
    "You are a senior copywriter for Vivid Events, a premium audio, video, lighting and event-production rental company. " +
    "You write punchy, professional marketing copy for product data sheets that help event planners rent gear. " +
    "Always respond with valid minified JSON only — no markdown, no code fences."

  const user = `Product / fixture name: ${productName || "(unnamed product)"}
Owner-supplied specifications & details:
"""
${specifications || "(none provided)"}
"""

Return JSON with exactly this shape:
{
  "tagline": "a short, punchy 4-8 word headline",
  "marketingCopy": "2 short paragraphs (max ~90 words total) of persuasive marketing copy describing the product in action at live events. Confident, vivid, benefit-led. Plain text, no markdown.",
  "specItems": [ { "label": "Spec name", "value": "Spec value" } ]
}

Rules for specItems:
- Extract concrete technical specs from the details above into clean label/value pairs (e.g. "Power": "300W", "Weight": "4.2 kg", "DMX Channels": "16").
- If the details are sparse, infer sensible, realistic professional specs for this kind of product.
- Provide between 4 and 8 spec rows. Keep values concise.`

  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      throw new Error(`AI Gateway text error ${res.status}: ${detail.slice(0, 300)}`)
    }

    const json = await res.json()
    const content: string = json?.choices?.[0]?.message?.content ?? ""
    const parsed = safeParseJson(content)

    const specItems: SpecItem[] = Array.isArray(parsed?.specItems)
      ? parsed.specItems
          .map((s: any) => ({ label: String(s?.label ?? "").trim(), value: String(s?.value ?? "").trim() }))
          .filter((s: SpecItem) => s.label && s.value)
          .slice(0, 8)
      : []

    return {
      tagline: String(parsed?.tagline ?? "").trim() || "Professional-grade event production",
      marketingCopy:
        String(parsed?.marketingCopy ?? "").trim() ||
        "Engineered for demanding live events, this product delivers reliable, standout performance every time.",
      specItems: specItems.length ? specItems : fallbackSpecs(specifications),
    }
  } catch (err) {
    console.error("[v0] generateMarketingCopy failed:", err instanceof Error ? err.message : err)
    // Deterministic fallback so the brochure still generates.
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
  // Turn free-text lines like "Power: 300W" into rows; otherwise a single note row.
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

function safeParseJson(text: string): any {
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    // Strip code fences / extract first {...} block if the model wrapped it.
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        /* ignore */
      }
    }
    return {}
  }
}

/* ------------------------------------------------------------------ */
/* Event-action image generation (Nano Banana)                         */
/* ------------------------------------------------------------------ */

const IMAGE_PROMPTS = [
  "Re-render this exact product as a dramatic hero shot at a live event: on a large stage during a concert or gala, " +
    "high-contrast cinematic lighting, vivid colored beams, atmospheric haze, crowd bokeh in the background. " +
    "Keep the product's real design, shape and branding faithful. Ultra-detailed, professional event photography, 4k.",
  "Show this exact product in action at an elegant wedding reception: warm ambient uplighting, tasteful decor, " +
    "guests softly blurred in the background. Faithful to the real product design. Professional photography, high detail.",
  "Show this exact product at a high-energy corporate event or festival: bold stage lighting, LED walls glowing, " +
    "dynamic beams and haze. Faithful to the real product design. Professional event photography, high contrast, 4k.",
]

/**
 * Generates up to `count` event-action images from reference photos.
 * Returns data URLs. Returns [] if image generation is unavailable.
 */
export async function generateEventImages(
  productName: string,
  refImages: RefImage[],
  count: number,
): Promise<string[]> {
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const prompt =
      `Product: ${productName || "event equipment"}. ` + IMAGE_PROMPTS[i % IMAGE_PROMPTS.length]
    try {
      const url = await generateOneImage(prompt, refImages)
      if (url) out.push(url)
    } catch (err) {
      console.error("[v0] generateEventImages failed:", err instanceof Error ? err.message : err)
      // Stop trying on the first hard failure (e.g. no credits) — caller falls back.
      break
    }
  }
  return out
}

async function generateOneImage(prompt: string, refImages: RefImage[]): Promise<string | null> {
  const content: any[] = [{ type: "text", text: prompt }]
  for (const img of refImages.slice(0, 3)) {
    content.push({ type: "image_url", image_url: { url: img.dataUrl } })
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      messages: [{ role: "user", content }],
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`AI Gateway image error ${res.status}: ${detail.slice(0, 200)}`)
  }

  const json = await res.json()
  const message = json?.choices?.[0]?.message
  // The gateway returns generated images on message.images[].image_url.url as data URLs.
  const images = message?.images
  if (Array.isArray(images) && images.length) {
    const url = images[0]?.image_url?.url ?? images[0]?.url
    if (typeof url === "string" && url.startsWith("data:")) return url
  }
  return null
}
