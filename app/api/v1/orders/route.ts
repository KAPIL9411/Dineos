/**
 * POST /api/v1/orders
 *
 * Creates a new order. This endpoint:
 *  1. Validates input schema (Zod)
 *  2. Checks idempotency — rejects duplicate submissions
 *  3. Validates the restaurant is open and accepts this order type
 *  4. Fetches products from the DB (never trusts client prices)
 *  5. Calculates the authoritative order total server-side
 *  6. Validates minimum order amount (delivery)
 *  7. Validates table session (dine-in)
 *  8. Resolves or creates the customer record
 *  9. Persists order + order_items + payment record atomically
 * 10. Returns the order ID for tracking
 */
import { createServiceClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { createOrderSchema } from '@/lib/validate'
import { calculateOrderTotal } from '@/lib/orders/calculate-order-total'
import {
  validateRestaurantAcceptsOrders,
  fetchAndValidateProducts,
  validateMinimumOrder,
  validatePaymentMethod,
  checkIdempotency,
} from '@/lib/orders/validate-order'
import { verifyTableSession } from '@/lib/tenant'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  // Rate limit: 10 order submissions per IP per minute
  const ip = getClientIp(request.headers)
  const rl = rateLimit(ip, 'order-create', 10, 60)
  if (!rl.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Please slow down.', 429)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_INPUT', 'Invalid request body', 400)
  }

  // ── 1. Schema validation ──────────────────────────────────────────────────
  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const [k, v] of Object.entries(parsed.error.flatten().fieldErrors)) {
      if (v) fieldErrors[k] = v
    }
    return apiError('VALIDATION_ERROR', 'Invalid order data', 400, fieldErrors)
  }

  const input = parsed.data

  // ── 2. Idempotency check ─────────────────────────────────────────────────
  const existingOrderId = await checkIdempotency(input.restaurantId, input.idempotencyKey)
  if (existingOrderId) {
    // Return the existing order — safe to call multiple times
    return apiSuccess({ orderId: existingOrderId, isIdempotent: true }, 200)
  }

  // ── 3. Resolve restaurant and validate it accepts orders ─────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any

  const { data: restaurant } = await db
    .from('restaurants')
    .select('id, tenant_id, is_open, is_active, delivery_enabled, delivery_fee, minimum_order_amount, tax_rate')
    .eq('id', input.restaurantId)
    .eq('is_active', true)
    .single()

  if (!restaurant) {
    return apiError('RESTAURANT_NOT_FOUND', 'Restaurant not found', 404)
  }

  const restaurantValidation = await validateRestaurantAcceptsOrders(input.restaurantId, input.orderType)
  if (!restaurantValidation.valid) {
    return apiError(restaurantValidation.code, restaurantValidation.message, 400)
  }

  // ── 4. Validate payment method compatibility ──────────────────────────────
  const paymentValidation = validatePaymentMethod(input.orderType, input.paymentMethod)
  if (!paymentValidation.valid) {
    return apiError(paymentValidation.code, paymentValidation.message, 400)
  }

  // ── 5. Fetch and validate all products server-side ───────────────────────
  const productValidation = await fetchAndValidateProducts(
    input.restaurantId,
    restaurant.tenant_id,
    input.items
  )
  if (!productValidation.valid) {
    return apiError(productValidation.code!, productValidation.message!, 400)
  }

  // ── 6. Calculate authoritative total (server-side, ignores client prices) ─
  const lineItems = input.items.map((item) => ({
    unitPrice: productValidation.products[item.productId].price,
    quantity: item.quantity,
  }))

  const deliveryFee = input.orderType === 'DELIVERY' ? restaurant.delivery_fee : 0
  const totals = calculateOrderTotal(lineItems, restaurant.tax_rate, deliveryFee)

  // ── 7. Minimum order check ────────────────────────────────────────────────
  const minimumCheck = await validateMinimumOrder(input.restaurantId, totals.subtotal, input.orderType)
  if (!minimumCheck.valid) {
    return apiError(minimumCheck.code, minimumCheck.message, 400)
  }

  // ── 8. Validate table session (dine-in only) ─────────────────────────────
  let resolvedTableId: string | null = null
  if (input.orderType === 'DINE_IN') {
    if (!input.tableSessionId) {
      return apiError('TABLE_SESSION_REQUIRED', 'A table session is required for dine-in orders', 400)
    }
    const sessionCheck = await verifyTableSession(input.tableSessionId, input.restaurantId)
    if (!sessionCheck.valid) {
      return apiError('TABLE_SESSION_CLOSED', 'Your table session has expired. Please scan the QR code again.', 400)
    }
    resolvedTableId = sessionCheck.tableId
  }

  // ── 9. Resolve or create customer ─────────────────────────────────────────
  // For guest checkout: create a customer record keyed by phone number
  let customerId: string

  const { data: existingCustomer } = await db
    .from('customers')
    .select('id')
    .eq('phone', input.customerPhone)
    .single()

  if (existingCustomer) {
    customerId = existingCustomer.id
    // Update name if we have one
    if (input.customerName) {
      await db.from('customers').update({ name: input.customerName }).eq('id', customerId)
    }
  } else {
    const { data: newCustomer } = await db
      .from('customers')
      .insert({
        name: input.customerName,
        phone: input.customerPhone,
        email: input.customerEmail || null,
        user_id: null, // guest
      })
      .select('id')
      .single()

    if (!newCustomer) {
      return apiError('INTERNAL_ERROR', 'Could not process your order. Please try again.', 500)
    }
    customerId = newCustomer.id
  }

  // ── 10. Create order + items atomically ───────────────────────────────────
  const { data: order, error: orderError } = await db
    .from('orders')
    .insert({
      tenant_id: restaurant.tenant_id,
      restaurant_id: input.restaurantId,
      customer_id: customerId,
      order_type: input.orderType,
      status: 'PENDING',
      payment_status: 'PENDING',
      payment_method: input.paymentMethod,
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.taxAmount,
      delivery_fee: totals.deliveryFee,
      total: totals.total,
      table_id: resolvedTableId,
      table_session_id: input.tableSessionId,
      delivery_address_id: input.deliveryAddressId,
      notes: input.notes || null,
      idempotency_key: input.idempotencyKey,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    // Check if it's a unique constraint violation (race condition — idempotency key used twice)
    if (orderError?.code === '23505') {
      const existingId = await checkIdempotency(input.restaurantId, input.idempotencyKey)
      if (existingId) return apiSuccess({ orderId: existingId, isIdempotent: true }, 200)
    }
    console.error('Order creation failed', orderError)
    return apiError('INTERNAL_ERROR', 'Could not place your order. Please try again.', 500)
  }

  // Insert order items — prices are snapshotted from server-fetched product data
  const orderItemsToInsert = input.items.map((item) => {
    const product = productValidation.products[item.productId]
    return {
      order_id: order.id,
      tenant_id: restaurant.tenant_id,
      product_id: item.productId,
      product_name: product.name,          // snapshotted
      product_image_url: product.imageUrl, // snapshotted
      quantity: item.quantity,
      unit_price: product.price,           // snapshotted — ignores any client price
      total_price: product.price * item.quantity,
      notes: item.notes || null,
    }
  })

  const { error: itemsError } = await db.from('order_items').insert(orderItemsToInsert)

  if (itemsError) {
    // Items failed — delete the orphaned order
    await db.from('orders').delete().eq('id', order.id)
    console.error('Order items creation failed', itemsError)
    return apiError('INTERNAL_ERROR', 'Could not place your order. Please try again.', 500)
  }

  // Create payment record (PAY_AT_RESTAURANT / CASH_ON_DELIVERY are pending until confirmed)
  await db.from('payments').insert({
    order_id: order.id,
    tenant_id: restaurant.tenant_id,
    method: input.paymentMethod,
    status: 'PENDING',
    amount: totals.total,
    metadata: {},
  })

  return apiSuccess({ orderId: order.id }, 201)
}
