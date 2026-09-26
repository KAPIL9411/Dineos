import { createServiceClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import type { NextRequest } from 'next/server'
import type { CategoryWithProducts } from '@/types/domain'

/**
 * GET /api/v1/restaurants/:slug/menu
 * Public endpoint — returns the active menu for a restaurant.
 * Response is safe to cache at the CDN level (ISR-friendly).
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
    .select('id, tenant_id, name, is_active, is_open')
    .eq('slug', slug)
    .single()

  if (!restaurant || !restaurant.is_active) {
    return apiError('RESTAURANT_NOT_FOUND', 'Restaurant not found', 404)
  }

  const { data: categories } = await db
    .from('categories')
    .select(`
      id, name, description, image_url, sort_order,
      products (
        id, name, description, image_url, price,
        is_available, is_veg, sort_order
      )
    `)
    .eq('restaurant_id', restaurant.id)
    .eq('tenant_id', restaurant.tenant_id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const menu: CategoryWithProducts[] = (categories ?? []).map((cat: any) => ({
    id: cat.id,
    tenantId: restaurant.tenant_id,
    restaurantId: restaurant.id,
    name: cat.name,
    description: cat.description,
    imageUrl: cat.image_url,
    sortOrder: cat.sort_order,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    products: (cat.products ?? [])
      .filter((p: any) => p.is_available)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((p: any) => ({
        id: p.id,
        tenantId: restaurant.tenant_id,
        restaurantId: restaurant.id,
        categoryId: cat.id,
        name: p.name,
        description: p.description,
        imageUrl: p.image_url,
        price: p.price,
        isAvailable: p.is_available,
        isVeg: p.is_veg,
        sortOrder: p.sort_order,
        createdAt: '',
        updatedAt: '',
      })),
  }))

  return apiSuccess({ menu, isOpen: restaurant.is_open })
}
