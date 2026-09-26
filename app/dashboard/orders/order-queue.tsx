'use client'

import { useState, useCallback } from 'react'
import { Clock, Check, X, ChefHat } from 'lucide-react'
import { toast } from 'sonner'
import { useRealtimeOrders } from '@/hooks/use-realtime-orders'
import type { OrderStatus } from '@/types/database'

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  notes: string | null
}

interface Order {
  id: string
  order_type: string
  status: OrderStatus
  payment_status: string
  payment_method: string
  subtotal: number
  tax: number
  delivery_fee: number
  total: number
  notes: string | null
  created_at: string
  updated_at: string
  order_items: OrderItem[]
}

interface OrderQueueProps {
  restaurantId: string
  initialOrders: Order[]
}

export function OrderQueue({ restaurantId, initialOrders }: OrderQueueProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)

  const handleInsert = useCallback((newOrder: Record<string, unknown>) => {
    setOrders((prev) => [newOrder as unknown as Order, ...prev])
  }, [])

  const handleUpdate = useCallback((updatedOrder: Record<string, unknown>) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === (updatedOrder as unknown as Order).id
          ? (updatedOrder as unknown as Order)
          : order
      )
    )
  }, [])

  useRealtimeOrders({
    restaurantId,
    onInsert: handleInsert,
    onUpdate: handleUpdate,
  })

  const pending = orders.filter((o) => o.status === 'PENDING')
  const active = orders.filter((o) => ['ACCEPTED', 'PREPARING', 'READY'].includes(o.status))
  const completed = orders.filter((o) => ['COMPLETED', 'CANCELLED'].includes(o.status))

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setProcessingOrderId(orderId)
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error('Failed to update order status')
      toast.success(`Order ${newStatus.toLowerCase()}`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to update order')
    } finally {
      setProcessingOrderId(null)
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatCurrency = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Pending */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Clock className="w-4 h-4" />
          <span>Pending ({pending.length})</span>
        </div>
        <div className="space-y-2">
          {pending.map((order) => (
            <div key={order.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-gray-900">#{order.id.slice(0, 8)}</div>
                  <div className="text-xs text-gray-500">{formatTime(order.created_at)}</div>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(order.total)}
                </div>
              </div>

              <div className="space-y-1 mb-3 text-sm">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-700">
                    <span>
                      {item.quantity}× {item.product_name}
                    </span>
                    {item.notes && <span className="text-xs text-gray-500">({item.notes})</span>}
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="text-xs text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                  Note: {order.notes}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(order.id, 'ACCEPTED')}
                  disabled={processingOrderId === order.id}
                  className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  Accept
                </button>
                <button
                  onClick={() => updateStatus(order.id, 'REJECTED')}
                  disabled={processingOrderId === order.id}
                  className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Reject
                </button>
              </div>
            </div>
          ))}

          {pending.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">No pending orders</div>
          )}
        </div>
      </div>

      {/* Active */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <ChefHat className="w-4 h-4" />
          <span>Active ({active.length})</span>
        </div>
        <div className="space-y-2">
          {active.map((order) => (
            <div key={order.id} className="bg-white border rounded-lg p-4 shadow-sm border-l-4 border-l-orange-500">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-gray-900">#{order.id.slice(0, 8)}</div>
                  <div className="text-xs text-gray-500">{formatTime(order.created_at)}</div>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                    {order.status}
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(order.total)}
                </div>
              </div>

              <div className="space-y-1 text-sm">
                {order.order_items.map((item) => (
                  <div key={item.id} className="text-gray-700">
                    {item.quantity}× {item.product_name}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {active.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">No active orders</div>
          )}
        </div>
      </div>

      {/* Completed */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Check className="w-4 h-4" />
          <span>Completed ({completed.length})</span>
        </div>
        <div className="space-y-2">
          {completed.slice(0, 10).map((order) => (
            <div key={order.id} className="bg-white border rounded-lg p-4 shadow-sm opacity-75">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-gray-900">#{order.id.slice(0, 8)}</div>
                  <div className="text-xs text-gray-500">{formatTime(order.created_at)}</div>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      order.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(order.total)}
                </div>
              </div>

              <div className="space-y-1 text-sm">
                {order.order_items.map((item) => (
                  <div key={item.id} className="text-gray-600">
                    {item.quantity}× {item.product_name}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {completed.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">No completed orders today</div>
          )}
        </div>
      </div>
    </div>
  )
}
