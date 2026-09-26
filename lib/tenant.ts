import 'server-only'
/**
 * Tenant boundary utilities.
 *
 * These helpers ensure every DB query is scoped to the correct tenant.
 * Never call these from client components — they're server-only.
 *
 * The rule: tenant_id is ALWAYS derived from the authenticated user's
 * staff record or from a trusted server-side slug resolution.
 * It is NEVER accepted from request body / query params.
 */
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Verifies that a product belongs to the given tenant+restaurant.
 * Used before accepting a product in an order.
 */
export async function verifyProductBelongsToRestaurant(
  productId: string,
  restaurantId: string,
  tenantId: string
): Promise<boolean> {
  const db = createServiceClient()
  const { data } = await db
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('restaurant_id', restaurantId)
    .eq('tenant_id', tenantId)
    .single()

  return !!data
}

/**
 * Verifies that an order belongs to the given tenant+restaurant.
 * Used before any status update.
 */
export async function verifyOrderBelongsToRestaurant(
  orderId: string,
  restaurantId: string,
  tenantId: string
): Promise<boolean> {
  const db = createServiceClient()
  const { data } = await db
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('restaurant_id', restaurantId)
    .eq('tenant_id', tenantId)
    .single()

  return !!data
}

/**
 * Verifies that a table session belongs to the given restaurant and is still active.
 */
export async function verifyTableSession(
  tableSessionId: string,
  restaurantId: string
): Promise<{ valid: boolean; tableId: string | null }> {
  const db = createServiceClient()
  const { data } = await db
    .from('table_sessions')
    .select('id, table_id, is_active, restaurant_id')
    .eq('id', tableSessionId)
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .returns<Array<{ id: string; table_id: string; is_active: boolean; restaurant_id: string }>>()
    .single()

  if (!data) return { valid: false, tableId: null }
  return { valid: true, tableId: (data as { table_id: string }).table_id }
}

/**
 * Verifies a delivery address belongs to the given customer.
 */
export async function verifyAddressBelongsToCustomer(
  addressId: string,
  customerId: string
): Promise<boolean> {
  const db = createServiceClient()
  const { data } = await db
    .from('addresses')
    .select('id')
    .eq('id', addressId)
    .eq('customer_id', customerId)
    .single()

  return !!data
}
