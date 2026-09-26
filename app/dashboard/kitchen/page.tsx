import { createServiceClient } from '@/lib/supabase/server'
import { resolveAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { KitchenDisplay } from './kitchen-display'

export const metadata = {
  title: 'Kitchen Display',
}

export default async function KitchenPage() {
  const auth = await resolveAuthContext()
  
  if (!auth.ok) {
    redirect('/login')
  }

  const supabase = createServiceClient()

  // Fetch active orders (pending, preparing)
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      tables(name),
      customers(name, phone)
    `)
    .eq('tenant_id', auth.ctx.staffMember.tenantId)
    .in('status', ['PENDING', 'PREPARING'])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch kitchen orders:', error)
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load orders</p>
      </div>
    )
  }

  return <KitchenDisplay initialOrders={orders || []} restaurantId={auth.ctx.restaurant.id} />
}
