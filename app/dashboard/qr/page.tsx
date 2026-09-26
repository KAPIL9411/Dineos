import { redirect } from 'next/navigation'
import { resolveAuthContext } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/shared/empty-state'
import { QrCodesGrid } from './qr-codes-grid'
import { QrCode } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { DiningTable } from '@/types/domain'

interface QRPageProps {
  searchParams: Promise<{ tableId?: string }>
}

export default async function QRPage({ searchParams }: QRPageProps) {
  const result = await resolveAuthContext()
  if (!result.ok) redirect('/login')

  const { restaurant } = result.ctx
  const params = await searchParams

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { data: rows } = await db
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('tenant_id', restaurant.tenantId)
    .eq('is_active', true)
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

  if (tables.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">QR Codes</h1>
        <EmptyState
          icon={QrCode}
          title="No tables to generate QR codes for"
          description="Add tables first, then come back here to generate and print QR codes."
          action={
            <Link href="/dashboard/tables">
              <Button size="sm">Go to Tables</Button>
            </Link>
          }
        />
      </div>
    )
  }

  // Use NEXT_PUBLIC_APP_URL env variable, or fall back to VERCEL_URL in production
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">QR Codes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Print or display these at each table. Customers scan to order.
        </p>
      </div>
      <QrCodesGrid
        tables={tables}
        restaurantId={restaurant.id}
        restaurantSlug={restaurant.slug}
        restaurantName={restaurant.name}
        appUrl={appUrl}
        highlightTableId={params.tableId}
      />
    </div>
  )
}
