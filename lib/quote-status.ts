/**
 * Central definitions for the quote/payment lifecycle so every consumer agrees
 * on what each status means.
 *
 * Lifecycle:
 *   draft → sent → approved (signed)
 *     → authorized        (card hold placed for rental + deposit, nothing captured)
 *     → completed_and_captured  (rental captured after the event; deposit released or kept)
 *
 * Legacy rows may still carry "paid" / "invoiced" from the old charge-then-refund
 * flow — those are treated as fully collected for reporting and UI.
 */

/** Card hold placed (rental + deposit authorized), funds not yet captured. */
export const AUTHORIZED_STATUS = "authorized" as const

/** Terminal state once the rental has been captured after the event. */
export const CAPTURED_STATUS = "completed_and_captured" as const

/** Statuses where money has actually been collected (captured or legacy paid). */
export const COLLECTED_STATUSES = ["paid", "invoiced", CAPTURED_STATUS] as const

/** True once funds have been captured/collected (terminal, booking fulfilled). */
export function isCollected(status: string | null | undefined): boolean {
  return COLLECTED_STATUSES.includes(status as (typeof COLLECTED_STATUSES)[number])
}

/** True while the card hold is placed but not yet captured. */
export function isAuthorized(status: string | null | undefined): boolean {
  return status === AUTHORIZED_STATUS
}

/**
 * True once payment is secured — either an active hold or already captured.
 * Used to lock the booking (no more approve/pay actions, counts as confirmed).
 */
export function isSecured(status: string | null | undefined): boolean {
  return isAuthorized(status) || isCollected(status)
}
