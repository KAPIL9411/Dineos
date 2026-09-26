import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getRestaurantBySlug } from '@/lib/auth'
import { formatPrice } from '@/lib/format'
import { RestaurantHero } from '@/components/customer/restaurant-hero'
import { TableSessionInit } from '@/components/customer/table-session-init'
import { PageLoader } from '@/components/shared/loading-spinner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingBag, UtensilsCrossed, Truck } from 'lucide-react'

interface RestaurantPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    restaurantId?: string
    tableId?: string
    orderType?: string
  }>
}

export async function generateMetadata({ params }: RestaurantPageProps): Promise<Metadata> {
  const { slug } = await params
  const restaurant = await getRestaurantBySlug(slug)
  if (!restaurant) return { title: 'Restaurant not found' }

  return {
    title: restaurant.name,
    description: restaurant.description ?? `Order from ${restaurant.name}`,
    openGraph: {
      title: restaurant.name,
      description: restaurant.description ?? `Order from ${restaurant.name}`,
      images: restaurant.coverUrl ? [{ url: restaurant.coverUrl }] : [],
    },
  }
}

export default async function RestaurantPage({ params, searchParams }: RestaurantPageProps) {
  const { slug } = await params
  const qp = await searchParams

  const restaurant = await getRestaurantBySlug(slug)
  if (!restaurant) notFound()

  const isDineIn = !!(qp.tableId && qp.restaurantId)

  return (
    <div className="min-h-screen bg-white">
      {/* Restaurant hero */}
      <RestaurantHero
        name={restaurant.name}
        description={restaurant.description}
        logoUrl={restaurant.logoUrl}
        coverUrl={restaurant.coverUrl}
        primaryColor={restaurant.primaryColor}
        city={restaurant.city}
        isOpen={restaurant.isOpen}
      />

      <div className="max-w-lg mx-auto px-4 pb-16">
        {/* Dine-in: initialise table session then redirect to menu */}
        {isDineIn && (
          <Suspense fallback={<PageLoader />}>
            <TableSessionInit
              restaurantId={qp.restaurantId!}
              tableId={qp.tableId!}
              restaurantSlug={slug}
            />
          </Suspense>
        )}

        {/* Order type selection (non-QR flow) */}
        {!isDineIn && (
          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              How would you like to order?
            </h2>

            {restaurant.isOpen ? (
              <>
                <Link href={`/restaurant/${slug}/menu?orderType=TAKEAWAY`} className="block">
                  <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors group cursor-pointer">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: restaurant.primaryColor + '20' }}
                    >
                      <ShoppingBag className="w-6 h-6" style={{ color: restaurant.primaryColor }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Takeaway</p>
                      <p className="text-sm text-gray-500">Pick up your order at the counter</p>
                    </div>
                  </div>
                </Link>

                {restaurant.deliveryEnabled && (
                  <Link href={`/restaurant/${slug}/menu?orderType=DELIVERY`} className="block">
                    <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors cursor-pointer">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: restaurant.primaryColor + '20' }}
                      >
                        <Truck className="w-6 h-6" style={{ color: restaurant.primaryColor }} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Delivery</p>
                        <p className="text-sm text-gray-500">
                          {restaurant.deliveryFee === 0
                            ? 'Free delivery'
                            : `${formatPrice(restaurant.deliveryFee)} delivery`}
                          {restaurant.minimumOrderAmount > 0 &&
                            ` · Min. ${formatPrice(restaurant.minimumOrderAmount)}`}
                        </p>
                      </div>
                    </div>
                  </Link>
                )}
              </>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <UtensilsCrossed className="w-6 h-6 text-gray-400 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-700">Currently closed</p>
                  <p className="text-sm text-gray-400">We&apos;re not taking orders right now</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
