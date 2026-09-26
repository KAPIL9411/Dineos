/**
 * Server-side order validation.
 *
 * All business rules from docs/09-BUSINESS-RULES.md are enforced here.
 * This runs inside the order creation route handler, AFTER schema validation.
 *
 * Returns { valid: true } or { valid: false, code, message }.
 */
import { createServiceClient } from '@/lib/supabase/server'
import { ErrorCode, type ErrorCodeValue } from '@/types/api'
import type { OrderType, PaymentMethod } from '@/types/domain'

interface ValidationFailure {
  valid: false
  code: ErrorCodeValue
  message: string
}

interface ValidationSuccess {
  valid: true
}

type ValidationResult = ValidationSuccess | ValidationFailure

function fail(code: ErrorCodeValue, message: string): ValidationFailure {
  return { valid: false, code, message }
}

// ─── Restaurant validation ────────────────────────────────────────────────────

export async function validateRestaurantAcceptsOrders(
  restaurantId: string,
  orderType: OrderType
): Promise<ValidationResult> {
  const db = createServiceClient()
  const { data: restaurant } = await db
    .from('restaurants')
    .select('is_open, is_active, delivery_enabled, minimum_order_amount')
    .eq('id', restaurantId)
    .returns<{ is_open: boolean; is_active: boolean; delivery_enabled: boolean; minimum_order_amount: number }[]>()
    .single()

  if (!restaurant) {
    return fail(ErrorCode.RESTAURANT_NOT_FOUND, 'Restaurant not found')
  }
  if (!restaurant.is_active) {
    return fail(ErrorCode.RESTAURANT_SUSPENDED, 'This restaurant is currently unavailable')
  }
  if (!restaurant.is_open) {
    return fail(ErrorCode.RESTAURANT_CLOSED, 'This restaurant is currently closed')
  }
  if (orderType === 'DELIVERY' && !restaurant.delivery_enabled) {
    return fail(ErrorCode.DELIVERY_NOT_AVAILABLE, 'This restaurant does not offer delivery')
  }

  return { valid: true }
}

// ─── Products validation ──────────────────────────────────────────────────────

interface ProductLookup {
  productId: string
  quantity: number
}

interface ProductFetchResult {
  valid: boolean
  code?: ErrorCodeValue
  message?: string
  // Fetched product data keyed by productId — used for price snapshotting
  products: Record<string, { name: string; price: number; imageUrl: string | null }>
}

/**
 * Verifies all ordered products:
 *  - exist in the DB
 *  - belong to this restaurant (cross-tenant protection)
 *  - are currently available
 *
 * Returns the server-fetched product data for price snapshotting.
 */
export async function fetchAndValidateProducts(
  restaurantId: string,
  tenantId: string,
  items: ProductLookup[]
): Promise<ProductFetchResult> {
  const db = createServiceClient()
  const productIds = items.map((i) => i.productId)

  const { data: products } = await db
    .from('products')
    .select('id, name, price, image_url, is_available, restaurant_id, tenant_id')
    .in('id', productIds)
    .returns<Array<{
      id: string
      name: string
      price: number
      image_url: string | null
      is_available: boolean
      restaurant_id: string
      tenant_id: string
    }>>()

  if (!products || products.length !== productIds.length) {
    return {
      valid: false,
      code: ErrorCode.PRODUCT_NOT_FOUND,
      message: 'One or more products were not found',
      products: {},
    }
  }

  const productMap: Record<string, { name: string; price: number; imageUrl: string | null }> = {}

  for (const product of products) {
    // Tenant isolation: reject if product belongs to a different restaurant
    if (product.restaurant_id !== restaurantId || product.tenant_id !== tenantId) {
      return {
        valid: false,
        code: ErrorCode.PRODUCT_WRONG_TENANT,
        message: 'One or more products do not belong to this restaurant',
        products: {},
      }
    }

    if (!product.is_available) {
      return {
        valid: false,
        code: ErrorCode.PRODUCT_UNAVAILABLE,
        message: `"${product.name}" is currently unavailable`,
        products: {},
      }
    }

    productMap[product.id] = {
      name: product.name,
      price: product.price,
      imageUrl: product.image_url,
    }
  }

  return { valid: true, products: productMap }
}

// ─── Minimum order validation ─────────────────────────────────────────────────

export async function validateMinimumOrder(
  restaurantId: string,
  subtotal: number,
  orderType: OrderType
): Promise<ValidationResult> {
  // Minimum order only applies to delivery
  if (orderType !== 'DELIVERY') return { valid: true }

  const db = createServiceClient()
  const { data: restaurant } = await db
    .from('restaurants')
    .select('minimum_order_amount')
    .eq('id', restaurantId)
    .returns<{ minimum_order_amount: number }[]>()
    .single()

  if (!restaurant) return { valid: true }

  if (subtotal < restaurant.minimum_order_amount) {
    return fail(
      ErrorCode.MINIMUM_ORDER_NOT_MET,
      `Minimum order amount not met. Add ₹${Math.ceil((restaurant.minimum_order_amount - subtotal) / 100)} more to your order`
    )
  }

  return { valid: true }
}

// ─── Payment method validation ────────────────────────────────────────────────

export function validatePaymentMethod(
  orderType: OrderType,
  paymentMethod: PaymentMethod
): ValidationResult {
  if (orderType === 'DELIVERY' && paymentMethod === 'PAY_AT_RESTAURANT') {
    return fail(
      ErrorCode.INVALID_INPUT,
      'Pay at restaurant is not available for delivery orders'
    )
  }
  if (
    (orderType === 'DINE_IN' || orderType === 'TAKEAWAY') &&
    paymentMethod === 'CASH_ON_DELIVERY'
  ) {
    return fail(
      ErrorCode.INVALID_INPUT,
      'Cash on delivery is only available for delivery orders'
    )
  }
  return { valid: true }
}

// ─── Idempotency check ────────────────────────────────────────────────────────

/**
 * Checks if an order with the same idempotency key already exists.
 * Returns the existing order ID if found, null if this is a new submission.
 */
export async function checkIdempotency(
  restaurantId: string,
  idempotencyKey: string
): Promise<string | null> {
  const db = createServiceClient()
  const { data } = await db
    .from('orders')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('idempotency_key', idempotencyKey)
    .returns<{ id: string }[]>()
    .single()

  return (data as { id: string } | null)?.id ?? null
}
