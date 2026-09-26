'use server'

import { redirect } from 'next/navigation'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'
import { signupSchema, loginSchema, resetPasswordSchema } from '@/lib/validate'
import { generateSlug } from '@/lib/format'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionState {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
  message?: string
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export async function signupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { name, email, password } = parsed.data
  const supabase = await createServerClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    if (error.code === 'user_already_exists' || error.message?.includes('already registered')) {
      return { fieldErrors: { email: ['An account with this email already exists'] } }
    }
    return { error: 'Could not create your account. Please try again.' }
  }

  if (!data.user) {
    return { error: 'Could not create your account. Please try again.' }
  }

  // Provision tenant + restaurant + staff for the new owner.
  // The service-role client bypasses RLS. We use `any` here because
  // hand-written Database types don't fully satisfy supabase-js v2's
  // internal Insert generic — this is a known limitation.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any

  const { data: tenant, error: tenantError } = await db
    .from('tenants')
    .insert({ name })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    console.error('Failed to create tenant after signup', tenantError)
    return { success: true, message: 'CHECK_EMAIL' }
  }

  // Placeholder restaurant — owner completes setup during onboarding
  const slug = generateSlug(name) + '-' + Math.random().toString(36).slice(2, 6)
  const { data: restaurant, error: restaurantError } = await db
    .from('restaurants')
    .insert({
      tenant_id: tenant.id,
      name: `${name}'s Restaurant`,
      slug,
      primary_color: '#FF6B35',
      secondary_color: '#2C2C2C',
      opening_hours: {},
      is_open: false,
      is_active: true,
      delivery_enabled: false,
      delivery_fee: 0,
      minimum_order_amount: 0,
      tax_rate: 0,
    })
    .select('id')
    .single()

  if (restaurantError || !restaurant) {
    console.error('Failed to create restaurant after signup', restaurantError)
    return { success: true, message: 'CHECK_EMAIL' }
  }

  await db.from('staff').insert({
    tenant_id: tenant.id,
    restaurant_id: restaurant.id,
    user_id: data.user.id,
    role: 'RESTAURANT_OWNER',
    name,
    email,
    is_active: true,
  })

  return { success: true, message: 'CHECK_EMAIL' }
}

// ─── Log In ───────────────────────────────────────────────────────────────────

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data
  const supabase = await createServerClient()
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard'

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.code === 'invalid_credentials') {
      return { error: 'Incorrect email or password' }
    }
    if (error.code === 'email_not_confirmed') {
      return { error: 'Please confirm your email address first. Check your inbox.' }
    }
    return { error: 'Could not sign in. Please try again.' }
  }

  redirect(redirectTo)
}

// ─── Log Out ──────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = { email: formData.get('email') }
  const parsed = resetPasswordSchema.safeParse(raw)

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { email } = parsed.data
  const supabase = await createServerClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
  })

  // Always return success — never confirm whether an email exists (security)
  if (error) {
    console.error('Password reset error', error)
  }

  return {
    success: true,
    message: 'If an account exists with that email, you will receive a password reset link.',
  }
}
