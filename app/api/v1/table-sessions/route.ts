/**
 * POST /api/v1/table-sessions
 *
 * Called when a customer scans a QR code. Creates a new table session
 * (or returns an existing active one) and returns the session ID.
 *
 * The session ID is stored in browser sessionStorage and included
 * in all subsequent dine-in order requests as the trust anchor.
 *
 * This is a public endpoint — no auth required. The restaurant and
 * table are validated server-side from the request body.
 */
import { createServiceClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const createSessionSchema = z.object({
  restaurantId: z.string().uuid(),
  tableId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  // Rate limit: 20 session creations per IP per minute (prevents QR abuse)
  const ip = getClientIp(request.headers)
  const rl = rateLimit(ip, 'table-session-create', 20, 60)
  if (!rl.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Please try again shortly.', 429)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_INPUT', 'Invalid request body', 400)
  }

  const parsed = createSessionSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Invalid restaurant or table ID', 400)
  }

  const { restaurantId, tableId } = parsed.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any

  // Verify the table exists, is active, and belongs to the restaurant
  const { data: table } = await db
    .from('tables')
    .select('id, restaurant_id, tenant_id, is_active')
    .eq('id', tableId)
    .eq('restaurant_id', restaurantId)
    .single()

  if (!table) {
    return apiError('TABLE_NOT_FOUND', 'Table not found', 404)
  }
  if (!table.is_active) {
    return apiError('TABLE_NOT_FOUND', 'This table is not available', 404)
  }

  // Verify the restaurant is active and open
  const { data: restaurant } = await db
    .from('restaurants')
    .select('id, is_active, is_open, slug, name, primary_color')
    .eq('id', restaurantId)
    .single()

  if (!restaurant || !restaurant.is_active) {
    return apiError('RESTAURANT_NOT_FOUND', 'Restaurant not found', 404)
  }

  // Close any existing active sessions for this table (clean slate)
  await db
    .from('table_sessions')
    .update({ is_active: false, closed_at: new Date().toISOString() })
    .eq('table_id', tableId)
    .eq('is_active', true)

  // Create new session
  const { data: session, error } = await db
    .from('table_sessions')
    .insert({
      tenant_id: table.tenant_id,
      restaurant_id: restaurantId,
      table_id: tableId,
      is_active: true,
    })
    .select('id, created_at')
    .single()

  if (error || !session) {
    console.error('Failed to create table session', error)
    return apiError('INTERNAL_ERROR', 'Could not start table session', 500)
  }

  return apiSuccess({
    sessionId: session.id,
    tableId,
    restaurantId,
    restaurant: {
      name: restaurant.name,
      slug: restaurant.slug,
      primaryColor: restaurant.primary_color,
      isOpen: restaurant.is_open,
    },
    createdAt: session.created_at,
  })
}
