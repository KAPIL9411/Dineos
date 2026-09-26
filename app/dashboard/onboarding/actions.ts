'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { resolveAuthContext } from '@/lib/auth'
import { createAuditLog } from '@/lib/auth'

interface Step1Input {
  name: string
  slug: string
  description: string
  phone: string
  city: string
}

interface Step2Input {
  primaryColor: string
}

interface ActionResult {
  error?: string
  field?: string
}

export async function saveOnboardingStep1(
  restaurantId: string,
  values: Step1Input
): Promise<ActionResult> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }

  // Verify ownership — the restaurant must belong to this user's tenant
  if (auth.ctx.restaurant.id !== restaurantId) {
    return { error: 'Access denied' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any

  // Check slug uniqueness (excluding this restaurant)
  const { data: existing } = await db
    .from('restaurants')
    .select('id')
    .eq('slug', values.slug)
    .neq('id', restaurantId)
    .single()

  if (existing) {
    return { error: 'This URL is already taken. Choose a different one.', field: 'slug' }
  }

  const { error } = await db
    .from('restaurants')
    .update({
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      phone: values.phone || null,
      city: values.city || null,
    })
    .eq('id', restaurantId)

  if (error) {
    console.error('Failed to save onboarding step 1', error)
    return { error: 'Could not save. Please try again.' }
  }

  await createAuditLog({
    tenantId: auth.ctx.restaurant.tenantId,
    userId: auth.ctx.userId,
    action: 'RESTAURANT_ONBOARDING_STEP1',
    resourceType: 'restaurant',
    resourceId: restaurantId,
  })

  return {}
}

export async function saveOnboardingStep2(
  restaurantId: string,
  values: Step2Input
): Promise<ActionResult> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }

  if (auth.ctx.restaurant.id !== restaurantId) {
    return { error: 'Access denied' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any

  const { error } = await db
    .from('restaurants')
    .update({ primary_color: values.primaryColor })
    .eq('id', restaurantId)

  if (error) {
    return { error: 'Could not save branding. Please try again.' }
  }

  return {}
}
