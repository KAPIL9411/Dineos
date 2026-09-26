import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getRestaurantBySlug } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { MenuPageClient } from './menu-page-client'
import type { CategoryWithProducts, OrderType } from '@/types/domain'

// Enable ISR: Revalidate every 60 seconds for fast menu updates
export const revalidate = 60

interface MenuPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ orderType?: string; sessionId?: string }>
}

export async function generateMetadata({ params }: MenuPageProps): Promise<Metadata> {
  const { slug } = await params
  const restaurant = await getRestaurantBySlug(slug)
  return {
    title: restaurant ? `Menu — ${restaurant.name}` : 'Menu',
    robots: { index: true, follow: true },
  }
}

export default async function MenuPage({ params, searchParams }: MenuPageProps) {
  const { slug } = await params
  const qp = await searchParams

  const restaurant = await getRestaurantBySlug(slug)
  if (!restaurant) notFound()

  const orderType: OrderType =
    qp.orderType === 'DINE_IN'
      ? 'DINE_IN'
      : qp.orderType === 'DELIVERY'
        ? 'DELIVERY'
        : 'TAKEAWAY'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { data: categories } = await db
    .from('categories')
    .select(`
      id, name, description, image_url, sort_order, is_active,
      products (
        id, name, description, image_url, price,
        is_available, is_veg, sort_order
      )
    `)
    .eq('restaurant_id', restaurant.id)
    .eq('tenant_id', restaurant.tenantId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const menu: CategoryWithProducts[] = (categories ?? []).map((cat: any) => ({
    id: cat.id,
    tenantId: restaurant.tenantId,
    restaurantId: restaurant.id,
    name: cat.name,
    description: cat.description,
    imageUrl: cat.image_url,
    sortOrder: cat.sort_order,
    isActive: cat.is_active,
    createdAt: '',
    updatedAt: '',
    products: (cat.products ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((p: any) => ({
        id: p.id,
        tenantId: restaurant.tenantId,
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

  return (
    <MenuPageClient
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        primaryColor: restaurant.primaryColor,
        isOpen: restaurant.isOpen,
        deliveryEnabled: restaurant.deliveryEnabled,
        deliveryFee: restaurant.deliveryFee,
        minimumOrderAmount: restaurant.minimumOrderAmount,
        taxRate: restaurant.taxRate,
      }}
      menu={menu}
      orderType={orderType}
      sessionId={qp.sessionId}
    />
  )
}
