'use client'

import { useEffect, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface UseRealtimeOrderOptions {
  orderId: string
  onUpdate: (order: Record<string, unknown>) => void
}

/**
 * Subscribes to a single order's status changes.
 * Used by the customer order tracking page.
 */
export function useRealtimeOrder({ orderId, onUpdate }: UseRealtimeOrderOptions) {
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  })

  useEffect(() => {
    if (!orderId) return

    const supabase = getSupabaseBrowserClient()

    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => onUpdateRef.current(payload.new as Record<string, unknown>)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])
}
