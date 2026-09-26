'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { resolveAuthContext, createAuditLog } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { OrderStatus } from '@/types/domain'
import type { Database } from '@/types/database'

interface UpdateOrderStatusInput {
  orderId: string
  status: OrderStatus
}

export async function updateOrderStatus(input: UpdateOrderStatusInput) {
  const auth = await resolveAuthContext()
  
  if (!auth.ok) {
    return { error: 'Not authenticated' }
  }

  const supabase = createServiceClient()

  type OrderUpdate = Database['public']['Tables']['orders']['Update']
  const updatePayload: OrderUpdate = { status: input.status }

  const { error } = await supabase
    .from('orders')
    // @ts-ignore - Supabase type inference issue
    .update(updatePayload)
    .eq('id', input.orderId)
    .eq('tenant_id', auth.ctx.staffMember.tenantId)

  if (error) {
    console.error('Update order status error:', error)
    return { error: 'Failed to update order status' }
  }

  // Audit log
  await createAuditLog({
    userId: auth.ctx.userId,
    tenantId: auth.ctx.staffMember.tenantId,
    action: 'order.status_updated',
    resourceType: 'order',
    resourceId: input.orderId,
    metadata: { newStatus: input.status },
  })

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/kitchen')
  
  return { success: true }
}
