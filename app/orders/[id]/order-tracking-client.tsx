'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Clock, ChefHat, Package, CheckCircle2, XCircle, MapPin, Phone, Mail } from 'lucide-react'
import Image from 'next/image'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types/domain'

// Extended Order type for tracking with additional fields
interface OrderTracking {
  id: string
  orderNumber?: string
  orderType: string
  status: OrderStatus
  paymentStatus: string
  paymentMethod: string
  subtotal: number
  tax: number
  deliveryFee: number
  total: number
  notes: string | null
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  estimatedPrepTime?: number
  createdAt: string
  updatedAt: string
  restaurant: {
    id: string
    name: string
    slug: string
    primaryColor: string
  }
  items: Array<{
    id: string
    productId: string
    quantity: number
    unitPrice: number
    notes: string | null
    product: {
      id: string
      name: string
      imageUrl: string | null
    }
  }>
}

interface OrderTrackingClientProps {
  orderId: string
  initialOrder: any // We'll transform it
}

const STATUS_CONFIG: Record<OrderStatus, {
  icon: React.ElementType
  label: string
  description: string
  color: string
  bgColor: string
}> = {
  PENDING: {
    icon: Clock,
    label: 'Order Received',
    description: 'Your order has been received and is being confirmed',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  ACCEPTED: {
    icon: CheckCircle2,
    label: 'Accepted',
    description: 'Restaurant accepted your order',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  PREPARING: {
    icon: ChefHat,
    label: 'Preparing',
    description: 'Your delicious food is being prepared',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  READY: {
    icon: Package,
    label: 'Ready',
    description: 'Your order is ready!',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  OUT_FOR_DELIVERY: {
    icon: MapPin,
    label: 'Out for Delivery',
    description: 'Your order is on its way',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  DELIVERED: {
    icon: CheckCircle2,
    label: 'Delivered',
    description: 'Order delivered successfully',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  COMPLETED: {
    icon: CheckCircle2,
    label: 'Completed',
    description: 'Order completed. Bon appétit!',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  CANCELLED: {
    icon: XCircle,
    label: 'Cancelled',
    description: 'This order was cancelled',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  REJECTED: {
    icon: XCircle,
    label: 'Rejected',
    description: 'Restaurant rejected this order',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
}

const STATUS_ORDER: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED']

export function OrderTrackingClient({ orderId, initialOrder }: OrderTrackingClientProps) {
  const router = useRouter()
  const [order, setOrder] = useState<OrderTracking>(transformOrder(initialOrder))
  const [isPolling, setIsPolling] = useState(true)

  // Transform order data to match our interface
  function transformOrder(data: any): OrderTracking {
    return {
      id: data.id,
      orderNumber: data.orderNumber,
      orderType: data.orderType,
      status: data.status,
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod,
      subtotal: data.subtotal,
      tax: data.tax,
      deliveryFee: data.deliveryFee,
      total: data.total,
      notes: data.notes,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      estimatedPrepTime: data.estimatedPrepTime,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      restaurant: data.restaurant || {
        id: '',
        name: 'Restaurant',
        slug: '',
        primaryColor: '#e23744',
      },
      items: (data.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice || item.unitPricePaisa || 0,
        notes: item.notes,
        product: {
          id: item.product?.id || item.productId,
          name: item.product?.name || item.productName || 'Item',
          imageUrl: item.product?.imageUrl || item.productImageUrl || null,
        },
      })),
    }
  }

  // Poll for order updates every 5 seconds
  useEffect(() => {
    if (!isPolling || order.status === 'COMPLETED' || order.status === 'DELIVERED' || order.status === 'CANCELLED' || order.status === 'REJECTED') {
      return
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/orders/${orderId}`)
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const newOrder = transformOrder(json.data)
            setOrder(newOrder)
            
            // Stop polling if order is completed or cancelled
            if (['COMPLETED', 'DELIVERED', 'CANCELLED', 'REJECTED'].includes(json.data.status)) {
              setIsPolling(false)
            }
            
            // Vibrate on status change
            if (json.data.status !== order.status && 'vibrate' in navigator) {
              navigator.vibrate(200)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch order update:', error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [orderId, isPolling, order.status])

  const config = STATUS_CONFIG[order.status]
  const Icon = config.icon
  
  const currentStepIndex = STATUS_ORDER.indexOf(order.status)
  const isActive = (status: OrderStatus) => {
    const stepIndex = STATUS_ORDER.indexOf(status)
    return stepIndex <= currentStepIndex && order.status !== 'CANCELLED' && order.status !== 'REJECTED'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-20 glass-effect border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => router.push(`/restaurant/${order.restaurant.slug}/menu`)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors active:scale-95"
          aria-label="Go back to menu"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900">Track Order</h1>
          {order.orderNumber && (
            <p className="text-xs text-gray-500">Order #{order.orderNumber}</p>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Current Status Card */}
        <div className={cn(
          "rounded-2xl p-6 text-center animate-scale-in shadow-sm",
          config.bgColor
        )}>
          <div className={cn(
            "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
            !['CANCELLED', 'REJECTED', 'COMPLETED', 'DELIVERED'].includes(order.status) && 'animate-pulse-glow'
          )}>
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md">
              <Icon className={cn("w-8 h-8", config.color)} />
            </div>
          </div>
          <h2 className={cn("text-xl font-bold mb-1", config.color)}>
            {config.label}
          </h2>
          <p className="text-sm text-gray-700">{config.description}</p>
          
          {order.estimatedPrepTime && order.status === 'PREPARING' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">Estimated time</p>
              <p className="text-lg font-bold text-gray-900">{order.estimatedPrepTime} mins</p>
            </div>
          )}
        </div>

        {/* Progress Timeline */}
        {!['CANCELLED', 'REJECTED'].includes(order.status) && (
          <div className="bg-white rounded-2xl p-5 animate-fade-in-up shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Order Timeline</h3>
            <div className="space-y-4">
              {STATUS_ORDER.filter(s => s !== 'OUT_FOR_DELIVERY' || order.orderType === 'DELIVERY').map((status) => {
                const stepConfig = STATUS_CONFIG[status]
                const StepIcon = stepConfig.icon
                const active = isActive(status)
                const isCurrent = status === order.status
                
                return (
                  <div key={status} className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                      active ? stepConfig.bgColor : 'bg-gray-100',
                      isCurrent && 'ring-2 ring-offset-2',
                      isCurrent && status === 'PREPARING' && 'ring-purple-500',
                      isCurrent && status === 'ACCEPTED' && 'ring-blue-500',
                      isCurrent && status === 'READY' && 'ring-green-500'
                    )}>
                      {active ? (
                        <StepIcon className={cn("w-5 h-5", stepConfig.color)} />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 pt-1.5">
                      <p className={cn(
                        "text-sm font-medium",
                        active ? 'text-gray-900' : 'text-gray-400'
                      )}>
                        {stepConfig.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-gray-500 mt-0.5">In progress...</p>
                      )}
                    </div>
                    {active && status !== order.status && (
                      <Check className="w-5 h-5 text-green-600 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl p-5 animate-fade-in-up shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Order Items</h3>
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                {item.product.imageUrl && (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.quantity}× {item.product.name}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-gray-500 truncate">Note: {item.notes}</p>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900 shrink-0">
                  {formatPrice(item.quantity * item.unitPrice)}
                </span>
              </li>
            ))}
          </ul>

          {/* Bill Details */}
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
            )}
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-100 text-base">
              <span>Total Paid</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        {(order.customerName || order.customerPhone || order.customerEmail) && (
          <div className="bg-white rounded-2xl p-5 animate-fade-in-up shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Customer Details</h3>
            <div className="space-y-2 text-sm">
              {order.customerName && (
                <p className="text-gray-700 font-medium">{order.customerName}</p>
              )}
              {order.customerPhone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${order.customerPhone}`} className="hover:text-orange-600 transition-colors">
                    {order.customerPhone}
                  </a>
                </div>
              )}
              {order.customerEmail && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${order.customerEmail}`} className="hover:text-orange-600 transition-colors text-xs">
                    {order.customerEmail}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Restaurant Info */}
        <div className="bg-white rounded-2xl p-5 animate-fade-in-up shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-2 text-sm">Restaurant</h3>
          <p className="text-sm font-medium text-gray-900">{order.restaurant.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            {order.orderType === 'DINE_IN' ? '🍽️ Dine-in' : order.orderType === 'DELIVERY' ? '🛵 Delivery' : '🥡 Takeaway'}
          </p>
        </div>

        {/* Help Section */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 text-center animate-fade-in-up border border-orange-100">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Need help with your order?
          </p>
          <button 
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:shadow-md active:scale-95"
            style={{ backgroundColor: order.restaurant.primaryColor, color: 'white' }}
          >
            Contact Restaurant
          </button>
        </div>
      </div>
    </div>
  )
}
