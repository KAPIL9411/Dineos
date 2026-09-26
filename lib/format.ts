/**
 * Formatting utilities.
 * These run on both server and client — no server-only imports here.
 */

/**
 * Converts integer paise to a formatted INR string.
 * e.g. 24900 → "₹249.00"
 */
export function formatPrice(paise: number): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees)
}

/**
 * Converts a rupee float/string to integer paise for storage.
 * e.g. "249" → 24900, "249.50" → 24950
 */
export function rupeesToPaise(rupees: number | string): number {
  const amount = typeof rupees === 'string' ? parseFloat(rupees) : rupees
  if (isNaN(amount)) return 0
  // Round to avoid floating-point drift
  return Math.round(amount * 100)
}

/**
 * Converts paise to a plain rupee number for display/form pre-fill.
 * e.g. 24900 → 249
 */
export function paiseToRupees(paise: number): number {
  return paise / 100
}

/**
 * Formats a date string to a readable local format.
 * e.g. "2026-09-26T10:30:00Z" → "26 Sep 2026, 4:00 PM"
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateString))
}

/**
 * Formats a date to a short time string.
 * e.g. "2026-09-26T10:30:00Z" → "4:00 PM"
 */
export function formatTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateString))
}

/**
 * Returns elapsed time since a date, as a human-readable string.
 * e.g. "5 mins ago", "2 hrs ago"
 */
export function formatElapsed(dateString: string): string {
  const elapsed = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'}`
  const hours = Math.floor(minutes / 60)
  return `${hours} hr${hours === 1 ? '' : 's'}`
}

/**
 * Generates a URL-safe slug from a restaurant name.
 * e.g. "Chai Point & Co." → "chai-point-co"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

/**
 * Formats an order ID for display — shows last 8 characters uppercase.
 * e.g. "8fa3b21c" → "#8FA3B21C"
 */
export function formatOrderId(id: string): string {
  return `#${id.slice(-8).toUpperCase()}`
}
