'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { X, ShoppingCart, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { formatPrice } from '@/lib/format'
import { useCartStore } from '@/lib/stores/cart-store'
import { Button } from '@/components/ui/button'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  restaurant: {
    slug: string
    primaryColor: string
    deliveryFee: number
    minimumOrderAmount: number
    taxRate: number
  }
}

export function CartDrawer({ open, onClose, restaurant }: CartDrawerProps) {
  const router = useRouter()
  const { cart, removeItem, incrementItem, decrementItem, subtotal } = useCartStore()
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const drawerRef = useRef<HTMLDivElement>(null)

  const items = cart?.items ?? []
  const sub = subtotal()
  const tax = Math.round((sub * restaurant.taxRate) / 10000)
  const delivery = cart?.orderType === 'DELIVERY' ? restaurant.deliveryFee : 0
  const total = sub + tax + delivery

  // Reset drag state when drawer opens/closes
  useEffect(() => {
    if (!open) {
      setDragOffset(0)
      setIsDragging(false)
    }
  }, [open])

  function handleTouchStart(e: React.TouchEvent) {
    // Only allow drag from handle area or header
    const target = e.target as HTMLElement
    const isHandle = target.closest('[data-drawer-handle]')
    const isHeader = target.closest('[data-drawer-header]')
    if (!isHandle && !isHeader) return

    startY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current

    // Only allow downward drag
    if (diff > 0) {
      setDragOffset(diff)
    }
  }

  function handleTouchEnd() {
    if (!isDragging) return
    setIsDragging(false)

    // Close if dragged down more than 100px
    if (dragOffset > 100) {
      onClose()
    }

    setDragOffset(0)
  }

  function handleCheckout() {
    onClose()
    router.push(`/restaurant/${restaurant.slug}/checkout`)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col transition-transform duration-300 ease-out"
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 300ms ease-out',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1" data-drawer-handle>
          <div className="w-10 h-1 rounded-full bg-gray-300 cursor-grab active:cursor-grabbing" />
        </div>

        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
          data-drawer-header
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            <h2 className="font-semibold text-gray-900">Your order</h2>
            {items.length > 0 && (
              <span className="text-xs text-gray-400">
                {cart?.orderType === 'DINE_IN' ? 'Dine-in' : cart?.orderType === 'DELIVERY' ? 'Delivery' : 'Takeaway'}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" aria-label="Close cart">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Your cart is empty</p>
              <p className="text-xs text-gray-300 mt-1">Add items from the menu</p>
            </div>
          ) : (
            <ul className="space-y-3 py-2">
              {items.map((item) => (
                <li key={item.productId} className="flex items-start gap-3 animate-fade-in-up">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatPrice(item.unitPrice)} each</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => decrementItem(item.productId)}
                      className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 text-sm font-bold active:scale-95 transition-transform"
                      aria-label={`Remove one ${item.name}`}
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => incrementItem(item.productId)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:opacity-90 text-sm font-bold active:scale-95 transition-transform"
                      style={{ backgroundColor: restaurant.primaryColor }}
                      aria-label={`Add one more ${item.name}`}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 ml-1 active:scale-95 transition-transform"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Totals + checkout */}
        {items.length > 0 && (
          <div className="px-4 py-4 border-t border-gray-100 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(sub)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax ({restaurant.taxRate / 100}%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
              )}
              {delivery > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>{formatPrice(delivery)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={sub < restaurant.minimumOrderAmount}
              className="w-full text-white font-semibold py-3 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: restaurant.primaryColor }}
            >
              {sub < restaurant.minimumOrderAmount ? (
                `Minimum order ${formatPrice(restaurant.minimumOrderAmount)}`
              ) : (
                `Proceed to checkout · ${formatPrice(total)}`
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
