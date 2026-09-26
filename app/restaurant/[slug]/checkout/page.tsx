import { notFound } from 'next/navigation'
import { getRestaurantBySlug } from '@/lib/auth'
import type { Metadata } from 'next'
import { CheckoutClient } from './checkout-client'

interface CheckoutPageProps {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } }

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params
  const restaurant = await getRestaurantBySlug(slug)
  if (!restaurant) notFound()

  return (
    <CheckoutClient
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
    />
  )
}
