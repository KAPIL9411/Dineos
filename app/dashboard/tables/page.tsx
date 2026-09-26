import { redirect } from 'next/navigation'
import { resolveAuthContext } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/shared/empty-state'
import { TablesList } from './tables-list'
import { AddTableForm } from './add-table-form'
import { Table2 } from 'lucide-react'
import type { DiningTable } from '@/types/domain'

export default async function TablesPage() {
  const result = await resolveAuthContext()
  if (!result.ok) redirect('/login')

  const { restaurant } = result.ctx

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { data: rows } = await db
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('tenant_id', restaurant.tenantId)
    .order('name')

  const tables: DiningTable[] = (rows ?? []).map((r: any) => ({
    id: r.id,
    tenantId: r.tenant_id,
    restaurantId: r.restaurant_id,
    name: r.name,
    capacity: r.capacity,
    isActive: r.is_active,
    createdAt: r.created_at,
  }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tables</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {tables.length} {tables.length === 1 ? 'table' : 'tables'} configured
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <div>
          {tables.length === 0 ? (
            <EmptyState
              icon={Table2}
              title="No tables yet"
              description="Add tables to generate QR codes for dine-in ordering."
            />
          ) : (
            <TablesList tables={tables} />
          )}
        </div>

        {/* Add table form in a side panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 h-fit">
          <h2 className="font-medium text-gray-900 text-sm mb-4">Add table</h2>
          <AddTableForm />
        </div>
      </div>
    </div>
  )
}
