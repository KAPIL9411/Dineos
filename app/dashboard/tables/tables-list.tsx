'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Users, QrCode, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toggleTableActive, deleteTable } from '@/app/actions/tables'
import type { DiningTable } from '@/types/domain'

interface TablesListProps {
  tables: DiningTable[]
}

export function TablesList({ tables }: TablesListProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle(tableId: string, isActive: boolean) {
    startTransition(async () => {
      const result = await toggleTableActive(tableId, isActive)
      if (result.error) toast.error(result.error)
      else router.refresh()
    })
  }

  function handleDelete(tableId: string, tableName: string) {
    if (!confirm(`Delete "${tableName}"?`)) return
    startTransition(async () => {
      const result = await deleteTable(tableId)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Table deleted')
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <ul>
        {tables.map((table, idx) => (
          <li
            key={table.id}
            className={`flex items-center gap-4 px-4 py-3 ${
              idx < tables.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            {/* Table info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{table.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Users className="w-3 h-3 text-gray-400" aria-hidden="true" />
                <span className="text-xs text-gray-400">Capacity {table.capacity}</span>
                {!table.isActive && (
                  <Badge variant="secondary" className="text-xs ml-1">Inactive</Badge>
                )}
              </div>
            </div>

            {/* Active toggle */}
            <Switch
              checked={table.isActive}
              onCheckedChange={(checked) => handleToggle(table.id, checked)}
              disabled={isPending}
              aria-label={table.isActive ? 'Deactivate table' : 'Activate table'}
            />

            {/* QR link */}
            <Link href={`/dashboard/qr?tableId=${table.id}`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View QR code">
                <QrCode className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">View QR code for {table.name}</span>
              </Button>
            </Link>

            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
              onClick={() => handleDelete(table.id, table.name)}
              disabled={isPending}
              title="Delete table"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Delete {table.name}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
