'use client'

import { useRouter } from 'next/navigation'
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

  const items = cart?.items ?? []
  const sub = subtotal()
  const tax = Math.round((sub * restaurant.taxRate) / 10000)
  const delivery = cart?.orderType === 'DELIVERY' ? restaurant.deliveryFee : 0
  const total = sub + tax + delivery

  function handleCheckout() {
    onClose()
    router.push(`/restaurant/${restaurant.slug}/checkout`)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
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
                <li key={item.productId} className="flex items-start gap-3">
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
                      className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 text-sm font-bold"
                      aria-label={`Remove one ${item.name}`}
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => incrementItem(item.productId)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:opacity-90 text-sm font-bold"
                      style={{ backgroundColor: restaurant.primaryColor }}
                      aria-label={`Add one more ${item.name}`}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 ml-1"
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
              className="w-full text-white font-semibold py-3 rounded-xl"
              style={{ backgroundColor: restaurant.primaryColor }}
            >
              Proceed to checkout · {formatPrice(total)}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
