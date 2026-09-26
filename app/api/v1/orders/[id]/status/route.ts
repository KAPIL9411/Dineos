/**
 * PATCH /api/v1/orders/:id/status
 *
 * Updates order status. Called by restaurant dashboard and kitchen display.
 * Validates:
 *  - authenticated staff
 *  - order belongs to this staff's restaurant (tenant isolation)
 *  - transition is valid for the order type (state machine)
 */
import { createServiceClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { resolveAuthContext, hasMinRole, createAuditLog } from '@/lib/auth'
import { updateOrderStatusSchema } from '@/lib/validate'
import { isValidTransition } from '@/lib/orders/order-status'
import type { NextRequest } from 'next/server'
import type { OrderStatus, OrderType } from '@/types/domain'

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await resolveAuthContext()
  if (!auth.ok) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

  // Kitchen staff can update to PREPARING and READY; others need manager+
  const { staffMember, restaurant } = auth.ctx

  const { id: orderId } = await ctx.params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_INPUT', 'Invalid request body', 400)
  }

  const parsed = updateOrderStatusSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0].message, 400)
  }

  const { status: nextStatus } = parsed.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any

  // Fetch current order — scoped to this restaurant (tenant isolation)
  const { data: order } = await db
    .from('orders')
    .select('id, status, order_type, restaurant_id, tenant_id')
    .eq('id', orderId)
    .eq('restaurant_id', restaurant.id)
    .eq('tenant_id', restaurant.tenantId)
    .single()

  if (!order) {
    return apiError('ORDER_NOT_FOUND', 'Order not found', 404)
  }

  const currentStatus = order.status as OrderStatus
  const orderType = order.order_type as OrderType

  // Validate the transition is allowed
  if (!isValidTransition(orderType, currentStatus, nextStatus)) {
    return apiError(
      'INVALID_ORDER_TRANSITION',
      `Cannot move order from ${currentStatus} to ${nextStatus}`,
      400
    )
  }

  // Role check: kitchen staff may only do PREPARING and READY transitions
  const kitchenOnlyStatuses: OrderStatus[] = ['PREPARING', 'READY']
  if (
    !hasMinRole(staffMember, 'RESTAURANT_MANAGER') &&
    !kitchenOnlyStatuses.includes(nextStatus)
  ) {
    return apiError('FORBIDDEN', 'Insufficient permissions for this status change', 403)
  }

  const { error } = await db
    .from('orders')
    .update({ status: nextStatus })
    .eq('id', orderId)
    .eq('restaurant_id', restaurant.id)
    .eq('tenant_id', restaurant.tenantId)

  if (error) {
    console.error('Order status update failed', error)
    return apiError('INTERNAL_ERROR', 'Could not update order status', 500)
  }

  await createAuditLog({
    tenantId: restaurant.tenantId,
    userId: staffMember.userId,
    action: 'ORDER_STATUS_UPDATED',
    resourceType: 'order',
    resourceId: orderId,
    metadata: { from: currentStatus, to: nextStatus },
  })

  return apiSuccess({ orderId, status: nextStatus })
}
