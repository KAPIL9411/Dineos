import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { OrderTrackingClient } from './order-tracking-client'
import { getOrder } from '@/lib/orders'

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { 
  title: 'Track Order',
  robots: { index: false, follow: false } 
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params
  const order = await getOrder(id)
  
  if (!order) notFound()

  return (
    <OrderTrackingClient
      orderId={id}
      initialOrder={order}
    />
  )
}
