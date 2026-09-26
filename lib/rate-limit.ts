/**
 * Lightweight in-memory rate limiter for abuse-prone endpoints.
 *
 * Uses a sliding window in a Map. Resets on server restart (acceptable for MVP).
 * Replace with Redis/Upstash when scaling beyond a single Vercel instance.
 *
 * Usage:
 *   const result = rateLimit(ip, 'order-create', 5, 60)
 *   if (!result.allowed) return apiError('RATE_LIMITED', 'Too many requests', 429)
 */

interface WindowEntry {
  count: number
  resetAt: number
}

const store = new Map<string, WindowEntry>()

// Clean up expired entries every 5 minutes to avoid memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now()
      for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) store.delete(key)
      }
    },
    5 * 60 * 1000
  )
}

/**
 * @param identifier - Typically the client IP address
 * @param action     - Namespaces the limit per operation (e.g. "order-create")
 * @param limit      - Max requests allowed in the window
 * @param windowSecs - Window duration in seconds
 */
export function rateLimit(
  identifier: string,
  action: string,
  limit: number,
  windowSecs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${action}:${identifier}`
  const now = Date.now()
  const windowMs = windowSecs * 1000

  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    // New window
    const entry: WindowEntry = { count: 1, resetAt: now + windowMs }
    store.set(key, entry)
    return { allowed: true, remaining: limit - 1, resetAt: entry.resetAt }
  }

  existing.count += 1
  const remaining = Math.max(0, limit - existing.count)

  return {
    allowed: existing.count <= limit,
    remaining,
    resetAt: existing.resetAt,
  }
}

/**
 * Extracts the real client IP from Next.js request headers.
 * Vercel sets x-forwarded-for; falls back to a placeholder for local dev.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    'local'
  )
}
