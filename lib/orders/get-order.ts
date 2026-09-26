import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getOrder(orderId: string) {
  const cookieStore = await cookies()
  const customerIdCookie = cookieStore.get('customer_id')?.value

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any

  const { data: order, error } = await db
    .from('orders')
    .select(`
      id,
      order_number,
      order_type,
      status,
      payment_status,
      payment_method,
      subtotal_paisa,
      tax_paisa,
      delivery_fee_paisa,
      total_paisa,
      notes,
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      estimated_prep_time,
      created_at,
      updated_at,
      restaurant:restaurant_id (
        id,
        name,
        slug,
        primary_color
      ),
      items:order_items (
        id,
        product_id,
        quantity,
        unit_price_paisa,
        notes,
        product:product_id (
          id,
          name,
          image_url
        )
      )
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return null
  }

  // Gate access: customer must match via cookie
  const hasAccess = customerIdCookie && order.customer_id === customerIdCookie

  if (!hasAccess) {
    return null
  }

  return {
    id: order.id,
    orderNumber: order.order_number,
    orderType: order.order_type,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    subtotal: order.subtotal_paisa,
    tax: order.tax_paisa,
    deliveryFee: order.delivery_fee_paisa,
    total: order.total_paisa,
    notes: order.notes,
    customerId: order.customer_id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerEmail: order.customer_email,
    estimatedPrepTime: order.estimated_prep_time,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    restaurant: {
      id: order.restaurant.id,
      name: order.restaurant.name,
      slug: order.restaurant.slug,
      primaryColor: order.restaurant.primary_color,
    },
    items: (order.items ?? []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      unitPrice: item.unit_price_paisa,
      notes: item.notes,
      product: {
        id: item.product.id,
        name: item.product.name,
        imageUrl: item.product.image_url,
      },
    })),
  }
}
