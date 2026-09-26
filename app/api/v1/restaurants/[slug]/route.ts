import { createServiceClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import type { NextRequest } from 'next/server'

/**
 * GET /api/v1/restaurants/:slug
 * Public endpoint — returns basic restaurant info for the customer page.
 */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any

  const { data: restaurant } = await db
    .from('restaurants')
    .select(
      'id, name, slug, description, logo_url, cover_url, primary_color, secondary_color, ' +
      'phone, city, state, is_open, delivery_enabled, delivery_fee, minimum_order_amount, tax_rate'
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!restaurant) {
    return apiError('RESTAURANT_NOT_FOUND', 'Restaurant not found', 404)
  }

  return apiSuccess({
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    description: restaurant.description,
    logoUrl: restaurant.logo_url,
    coverUrl: restaurant.cover_url,
    primaryColor: restaurant.primary_color,
    secondaryColor: restaurant.secondary_color,
    phone: restaurant.phone,
    city: restaurant.city,
    state: restaurant.state,
    isOpen: restaurant.is_open,
    deliveryEnabled: restaurant.delivery_enabled,
    deliveryFee: restaurant.delivery_fee,
    minimumOrderAmount: restaurant.minimum_order_amount,
    taxRate: restaurant.tax_rate,
  })
}
