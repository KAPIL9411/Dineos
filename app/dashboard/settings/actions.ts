'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveAuthContext, hasMinRole, createAuditLog } from '@/lib/auth'
import { rupeesToPaise } from '@/lib/format'

interface SettingsInput {
  name: string
  description: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  pincode: string
  primaryColor: string
  isOpen: boolean
  deliveryEnabled: boolean
  deliveryFeeRupees: number
  minimumOrderRupees: number
  taxRatePct: number
}

interface ActionResult {
  error?: string
}

export async function saveSettings(
  restaurantId: string,
  values: SettingsInput
): Promise<ActionResult> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }

  if (!hasMinRole(auth.ctx.staffMember, 'RESTAURANT_MANAGER')) {
    return { error: 'You do not have permission to change settings' }
  }

  // Verify restaurant belongs to this user's tenant
  if (auth.ctx.restaurant.id !== restaurantId) {
    return { error: 'Access denied' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any

  const { error } = await db
    .from('restaurants')
    .update({
      name: values.name,
      description: values.description || null,
      phone: values.phone || null,
      email: values.email || null,
      address: values.address || null,
      city: values.city || null,
      state: values.state || null,
      pincode: values.pincode || null,
      primary_color: values.primaryColor,
      is_open: values.isOpen,
      delivery_enabled: values.deliveryEnabled,
      delivery_fee: rupeesToPaise(values.deliveryFeeRupees),
      minimum_order_amount: rupeesToPaise(values.minimumOrderRupees),
      // taxRatePct is percentage (e.g. 5.0), stored as basis points (500)
      tax_rate: Math.round(values.taxRatePct * 100),
    })
    .eq('id', restaurantId)

  if (error) {
    console.error('Failed to save settings', error)
    return { error: 'Could not save settings. Please try again.' }
  }

  await createAuditLog({
    tenantId: auth.ctx.restaurant.tenantId,
    userId: auth.ctx.userId,
    action: 'RESTAURANT_SETTINGS_UPDATED',
    resourceType: 'restaurant',
    resourceId: restaurantId,
  })

  revalidatePath('/dashboard/settings')
  revalidatePath(`/restaurant/${auth.ctx.restaurant.slug}`)

  return {}
}
