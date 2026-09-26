import { redirect } from 'next/navigation'
import { resolveAuthContext } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/format'
import { DashboardMetricsCards } from './dashboard-metrics'

export default async function DashboardPage() {
  const result = await resolveAuthContext()
  if (!result.ok) redirect('/login')

  const { restaurant } = result.ctx

  // Send to onboarding if restaurant is still a placeholder
  const isOnboarded = restaurant.slug && !restaurant.name.endsWith("'s Restaurant")
  if (!isOnboarded) {
    redirect('/dashboard/onboarding')
  }

  // Fetch today's order metrics
  const db = createServiceClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = db as any
  const { data: todayOrders } = await dbAny
    .from('orders')
    .select('status, total')
    .eq('restaurant_id', restaurant.id)
    .gte('created_at', today.toISOString())

  const orders = (todayOrders ?? []) as Array<{ status: string; total: number }>
  const pending = orders.filter((o) => o.status === 'PENDING').length
  const active = orders.filter((o) => ['ACCEPTED', 'PREPARING', 'READY'].includes(o.status)).length
  const completed = orders.filter((o) => o.status === 'COMPLETED').length
  const revenue = orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.total, 0)
  const avgValue = completed > 0 ? Math.round(revenue / completed) : 0

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          {restaurant.name}
        </h1>
        <p className="text-sm text-gray-500">
          {restaurant.isOpen ? (
            <span className="text-green-600 font-medium">● Open</span>
          ) : (
            <span className="text-red-500 font-medium">● Closed</span>
          )}{' '}
          · Today&apos;s overview
        </p>
      </div>

      <DashboardMetricsCards
        todayOrders={orders.length}
        todayRevenue={formatPrice(revenue)}
        pendingOrders={pending}
        activeOrders={active}
        completedOrders={completed}
        averageOrderValue={formatPrice(avgValue)}
      />
    </div>
  )
}
