import "server-only"
import Stripe from "stripe"

/**
 * Server-only Stripe client. Uses the SDK's pinned API version so we never
 * send a value the installed package doesn't understand.
 *
 * STRIPE_SECRET_KEY is injected by the Vercel Stripe integration.
 */
let cached: Stripe | null = null

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getStripe(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY.")
  }
  cached = new Stripe(key)
  return cached
}
