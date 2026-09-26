/**
 * GET /api/v1/orders/:id
 *
 * Returns order status for customer tracking.
 * Access is gated by the customer_id UUID from the cookie — no auth required.
 * The customer UUID is set as an HttpOnly cookie when the order is placed.
 */
import { createServiceClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await ctx.params
  const cookieStore = await cookies()
  const customerIdCookie = cookieStore.get('customer_id')?.value

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any

  const { data: order } = await db
    .from('orders')
    .select(`
      id, order_type, status, payment_status, payment_method,
      subtotal, tax, delivery_fee, total, notes, created_at, updated_at,
      customer_id,
      order_items ( id, product_name, product_image_url, quantity, unit_price, total_price, notes )
    `)
    .eq('id', orderId)
    .single()

  if (!order) {
    return apiError('ORDER_NOT_FOUND', 'Order not found', 404)
  }

  // Gate access: customer must match either via cookie or be the session customer
  const hasAccess =
    customerIdCookie && order.customer_id === customerIdCookie

  if (!hasAccess) {
    // Return minimal info for security — don't leak that the order exists
    return apiError('ORDER_NOT_FOUND', 'Order not found', 404)
  }

  return apiSuccess({
    id: order.id,
    orderType: order.order_type,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    subtotal: order.subtotal,
    tax: order.tax,
    deliveryFee: order.delivery_fee,
    total: order.total,
    notes: order.notes,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: (order.order_items ?? []).map((item: Record<string, unknown>) => ({
      id: item.id,
      productName: item.product_name,
      productImageUrl: item.product_image_url,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      notes: item.notes,
    })),
  })
}
