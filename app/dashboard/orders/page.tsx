import { redirect } from 'next/navigation'
import { resolveAuthContext } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { OrderQueue } from './order-queue'

export default async function OrdersPage() {
  const result = await resolveAuthContext()
  if (!result.ok) redirect('/login')
  const { restaurant } = result.ctx

  // Fetch today's orders for initial render (realtime takes over after mount)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { data: rows } = await db
    .from('orders')
    .select(`
      id, order_type, status, payment_status, payment_method,
      subtotal, tax, delivery_fee, total, notes, created_at, updated_at,
      order_items ( id, product_name, quantity, unit_price, notes )
    `)
    .eq('restaurant_id', restaurant.id)
    .eq('tenant_id', restaurant.tenantId)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">Today&apos;s orders — updates in real time</p>
      </div>
      <OrderQueue
        restaurantId={restaurant.id}
        initialOrders={rows ?? []}
      />
    </div>
  )
}
