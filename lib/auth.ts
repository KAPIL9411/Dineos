import 'server-only'
import { cache } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { StaffMember, Restaurant, AuthContext, StaffRole } from '@/types/domain'
import type { StaffRow, RestaurantRow } from '@/types/database'

// ─── Row → domain mappers ─────────────────────────────────────────────────────

function staffRowToDomain(row: StaffRow): StaffMember {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    restaurantId: row.restaurant_id,
    userId: row.user_id,
    role: row.role,
    name: row.name,
    email: row.email,
    isActive: row.is_active,
    createdAt: row.created_at,
  }
}

function restaurantRowToDomain(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logo_url,
    coverUrl: row.cover_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    phone: row.phone,
    email: row.email,
    address: row.address,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    openingHours: (row.opening_hours ?? {}) as unknown as Restaurant['openingHours'],
    isOpen: row.is_open,
    isActive: row.is_active,
    deliveryEnabled: row.delivery_enabled,
    deliveryFee: row.delivery_fee,
    minimumOrderAmount: row.minimum_order_amount,
    taxRate: row.tax_rate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the authenticated Supabase user or null.
 * Uses getUser() (validates JWT server-side) not getSession() (cookie-only).
 */
export async function getAuthenticatedUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}

/**
 * Resolves the staff membership for a given user + restaurant.
 * Uses the service client so this query is not limited by RLS.
 */
export async function getStaffMembership(
  userId: string,
  restaurantId: string
): Promise<StaffMember | null> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('staff')
    .select('*')
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return staffRowToDomain(data)
}

/**
 * Resolves the staff member for the current user via their active restaurant.
 * The restaurant_id is derived from their staff record, never from the request.
 */
export async function getCurrentStaffMember(userId: string): Promise<StaffMember | null> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('staff')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return staffRowToDomain(data)
}

/**
 * Fetches a restaurant by ID using the service client.
 */
export async function getRestaurantById(restaurantId: string): Promise<Restaurant | null> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('restaurants')
    .select('*')
    .eq('id', restaurantId)
    .single()

  if (error || !data) return null
  return restaurantRowToDomain(data)
}

/**
 * Fetches a restaurant by slug — used for public customer-facing pages.
 * Only returns active restaurants.
 */
export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return restaurantRowToDomain(data)
}

/**
 * Resolves the full auth context for a protected route handler.
 * Cached per-request to avoid duplicate database queries.
 * 
 * Usage inside a route handler:
 *   const ctx = await resolveAuthContext()
 *   if (!ctx.ok) return apiError('UNAUTHORIZED', ctx.error, 401)
 */
export const resolveAuthContext = cache(async (): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; error: string }
> => {
  const user = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const staffMember = await getCurrentStaffMember(user.id)
  if (!staffMember) return { ok: false, error: 'No active staff membership found' }

  const restaurant = await getRestaurantById(staffMember.restaurantId)
  if (!restaurant) return { ok: false, error: 'Restaurant not found' }

  return { ok: true, ctx: { userId: user.id, staffMember, restaurant } }
})

// ─── Authorization ────────────────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<StaffRole, number> = {
  PLATFORM_ADMIN: 100,
  RESTAURANT_OWNER: 80,
  RESTAURANT_MANAGER: 60,
  KITCHEN_STAFF: 40,
  WAITER: 30,
  DELIVERY_STAFF: 20,
}

/**
 * Returns true if the staff member has at least one of the required roles.
 */
export function hasRole(staffMember: StaffMember, allowedRoles: StaffRole[]): boolean {
  return allowedRoles.includes(staffMember.role)
}

/**
 * Returns true if the staff member's role is at or above the minimum level.
 */
export function hasMinRole(staffMember: StaffMember, minimumRole: StaffRole): boolean {
  return ROLE_HIERARCHY[staffMember.role] >= ROLE_HIERARCHY[minimumRole]
}

// ─── Audit logging ────────────────────────────────────────────────────────────

export async function createAuditLog(params: {
  tenantId: string | null
  userId: string | null
  action: string
  resourceType: string
  resourceId: string | null
  metadata?: Record<string, unknown>
  ipAddress?: string | null
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  await db.from('audit_logs').insert({
    tenant_id: params.tenantId,
    user_id: params.userId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    metadata: params.metadata ?? {},
    ip_address: params.ipAddress ?? null,
  })
  // Audit log failures should not break the main operation
}
