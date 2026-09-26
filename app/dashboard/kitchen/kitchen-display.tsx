'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { Leaf, Clock, ChefHat, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updateOrderStatus } from '@/app/actions/orders'
import { toast } from 'sonner'
import type { OrderStatus } from '@/types/domain'

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  notes: string | null
  unit_price: number
}

interface Order {
  id: string
  created_at: string
  status: OrderStatus
  order_type: string
  table_id: string | null
  notes: string | null
  order_items: OrderItem[]
  tables: { name: string } | null
  customers: { name: string | null; phone: string | null } | null
}

interface KitchenDisplayProps {
  initialOrders: Order[]
  restaurantId: string
}

export function KitchenDisplay({ initialOrders, restaurantId }: KitchenDisplayProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    // Subscribe to order changes
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          console.log('Order change:', payload)
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newStatus = (payload.new as any).status
            
            // Only show pending/preparing orders
            if (newStatus === 'PENDING' || newStatus === 'PREPARING') {
              // Fetch full order with items
              const { data } = await supabase
                .from('orders')
                .select(`
                  *,
                  order_items(*),
                  tables(name),
                  customers(name, phone)
                `)
                .eq('id', (payload.new as any).id)
                .single()

              if (data) {
                setOrders((prev) => {
                  const exists = prev.find((o) => o.id === (data as any).id)
                  if (exists) {
                    return prev.map((o) => (o.id === (data as any).id ? (data as any) : o))
                  }
                  return [(data as any), ...prev]
                })
              }
            } else {
              // Remove from display if status changed to ready/completed
              setOrders((prev) => prev.filter((o) => o.id !== (payload.new as any).id))
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== (payload.old as any).id))
          }
        }
      )
      .subscribe()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      window.location.reload()
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [restaurantId])

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setProcessingIds((prev) => new Set(prev).add(orderId))
    
    const result = await updateOrderStatus({ orderId, status: newStatus })
    
    setProcessingIds((prev) => {
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Order marked as ${newStatus}`)
      
      // Remove from display if moved to ready/completed
      if (newStatus === 'READY' || newStatus === 'COMPLETED') {
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
      }
    }
  }

  const pendingOrders = orders.filter((o) => o.status === 'PENDING')
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING')

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-orange-600" />
            Kitchen Display
          </h1>
          <p className="text-gray-600 mt-1">
            {orders.length} active {orders.length === 1 ? 'order' : 'orders'}
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          Auto-refreshes every 30s
        </div>
      </div>

      {/* No orders */}
      {orders.length === 0 && (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h2>
          <p className="text-gray-600">No pending orders at the moment.</p>
        </div>
      )}

      {/* Orders Grid */}
      <div className="space-y-6">
        {/* Pending Orders */}
        {pendingOrders.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">
                New Orders ({pendingOrders.length})
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  isProcessing={processingIds.has(order.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Preparing Orders */}
        {preparingOrders.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900">
                In Progress ({preparingOrders.length})
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {preparingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  isProcessing={processingIds.has(order.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface OrderCardProps {
  order: Order
  onStatusChange: (orderId: string, status: OrderStatus) => void
  isProcessing: boolean
}

function OrderCard({ order, onStatusChange, isProcessing }: OrderCardProps) {
  const isPending = order.status === 'PENDING'
  const isPreparing = order.status === 'PREPARING'

  return (
    <div
      className={`bg-white rounded-xl border-2 p-5 shadow-sm transition-all ${
        isPending
          ? 'border-red-300 bg-red-50'
          : 'border-orange-300 bg-orange-50'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant={isPending ? 'destructive' : 'default'}
              className={isPending ? '' : 'bg-orange-600'}
            >
              {isPending ? 'NEW' : 'PREPARING'}
            </Badge>
            {order.tables && (
              <span className="text-sm font-semibold text-gray-700">
                Table {order.tables.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          #{order.id.slice(0, 8)}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
              {item.quantity}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900">{item.product_name}</div>
              {item.notes && (
                <div className="text-xs text-orange-700 mt-0.5 italic">
                  Note: {item.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Customer Notes */}
      {order.notes && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <span className="font-semibold text-yellow-800">Order Note:</span>{' '}
          <span className="text-yellow-700">{order.notes}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isPending && (
          <Button
            onClick={() => onStatusChange(order.id, 'PREPARING')}
            disabled={isProcessing}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            Start Preparing
          </Button>
        )}
        {isPreparing && (
          <>
            <Button
              onClick={() => onStatusChange(order.id, 'READY')}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Mark Ready
            </Button>
            <Button
              onClick={() => onStatusChange(order.id, 'PENDING')}
              disabled={isProcessing}
              variant="outline"
              size="sm"
            >
              Back
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
