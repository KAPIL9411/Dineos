'use client'

import { useEffect, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface UseRealtimeOrdersOptions {
  restaurantId: string
  onInsert?: (order: Record<string, unknown>) => void
  onUpdate?: (order: Record<string, unknown>) => void
}

/**
 * Subscribes to Supabase Realtime for order changes in a specific restaurant.
 * Subscription is scoped to the restaurant_id to prevent cross-tenant leakage.
 * Cleanup happens automatically on unmount.
 */
export function useRealtimeOrders({ restaurantId, onInsert, onUpdate }: UseRealtimeOrdersOptions) {
  // Stable refs so we don't need to re-subscribe when callbacks change
  const onInsertRef = useRef(onInsert)
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onInsertRef.current = onInsert
    onUpdateRef.current = onUpdate
  })

  useEffect(() => {
    if (!restaurantId) return

    const supabase = getSupabaseBrowserClient()

    const channel = supabase
      .channel(`orders:${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => onInsertRef.current?.(payload.new as Record<string, unknown>)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => onUpdateRef.current?.(payload.new as Record<string, unknown>)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId])
}
