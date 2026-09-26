'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveAuthContext, hasMinRole, createAuditLog } from '@/lib/auth'
import { createTableSchema } from '@/lib/validate'
import type { DiningTable } from '@/types/domain'

function revalidateTables() {
  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/qr')
}

function rowToTable(row: Record<string, unknown>): DiningTable {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    restaurantId: row.restaurant_id as string,
    name: row.name as string,
    capacity: row.capacity as number,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
  }
}

export async function createTable(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string; table?: DiningTable }> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }
  if (!hasMinRole(auth.ctx.staffMember, 'RESTAURANT_MANAGER')) return { error: 'Insufficient permissions' }

  const parsed = createTableSchema.safeParse({
    name: formData.get('name'),
    capacity: Number(formData.get('capacity') ?? 4),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { data, error } = await db
    .from('tables')
    .insert({
      tenant_id: auth.ctx.restaurant.tenantId,
      restaurant_id: auth.ctx.restaurant.id,
      name: parsed.data.name,
      capacity: parsed.data.capacity,
      is_active: true,
    })
    .select('*')
    .single()

  if (error) return { error: 'Could not create table' }

  revalidateTables()
  return { table: rowToTable(data) }
}

export async function updateTable(
  tableId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }
  if (!hasMinRole(auth.ctx.staffMember, 'RESTAURANT_MANAGER')) return { error: 'Insufficient permissions' }

  const parsed = createTableSchema.safeParse({
    name: formData.get('name'),
    capacity: Number(formData.get('capacity') ?? 4),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { error } = await db
    .from('tables')
    .update({ name: parsed.data.name, capacity: parsed.data.capacity })
    .eq('id', tableId)
    .eq('restaurant_id', auth.ctx.restaurant.id)
    .eq('tenant_id', auth.ctx.restaurant.tenantId)

  if (error) return { error: 'Could not update table' }
  revalidateTables()
  return {}
}

export async function toggleTableActive(
  tableId: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { error } = await db
    .from('tables')
    .update({ is_active: isActive })
    .eq('id', tableId)
    .eq('restaurant_id', auth.ctx.restaurant.id)
    .eq('tenant_id', auth.ctx.restaurant.tenantId)

  if (error) return { error: 'Could not update table' }
  revalidateTables()
  return {}
}

export async function deleteTable(tableId: string): Promise<{ error?: string }> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }
  if (!hasMinRole(auth.ctx.staffMember, 'RESTAURANT_OWNER')) return { error: 'Only owners can delete tables' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { error } = await db
    .from('tables')
    .delete()
    .eq('id', tableId)
    .eq('restaurant_id', auth.ctx.restaurant.id)
    .eq('tenant_id', auth.ctx.restaurant.tenantId)

  if (error) return { error: 'Could not delete table. It may have active orders.' }

  await createAuditLog({
    tenantId: auth.ctx.restaurant.tenantId,
    userId: auth.ctx.userId,
    action: 'TABLE_DELETED',
    resourceType: 'table',
    resourceId: tableId,
  })

  revalidateTables()
  return {}
}
