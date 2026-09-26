'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TableSessionInitProps {
  restaurantId: string
  tableId: string
  restaurantSlug: string
}

/**
 * Called when a customer scans a QR code.
 * Creates a table session on the server and redirects to the menu
 * with the session ID stored in sessionStorage.
 */
export function TableSessionInit({ restaurantId, tableId, restaurantSlug }: TableSessionInitProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function initSession() {
      try {
        const res = await fetch('/api/v1/table-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantId, tableId }),
        })

        if (cancelled) return

        const json = await res.json()

        if (!res.ok || !json.success) {
          setError(json.error?.message ?? 'Could not start your table session')
          return
        }

        const { sessionId } = json.data
        // Store session in sessionStorage — scoped to this browser tab
        sessionStorage.setItem('tableSessionId', sessionId)
        sessionStorage.setItem('tableId', tableId)
        sessionStorage.setItem('restaurantId', restaurantId)

        if (!json.data.restaurant.isOpen) {
          setError('This restaurant is currently closed.')
          return
        }

        // Navigate to the menu with dine-in context
        router.replace(`/restaurant/${restaurantSlug}/menu?orderType=DINE_IN&sessionId=${sessionId}`)
      } catch {
        if (!cancelled) setError('Could not connect. Please check your connection and try again.')
      }
    }

    initSession()
    return () => { cancelled = true }
  }, [restaurantId, tableId, restaurantSlug, router])

  if (error) {
    return (
      <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 p-5 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sm font-medium text-red-700">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-3 py-8">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      <p className="text-sm text-gray-500">Starting your table session…</p>
    </div>
  )
}
