'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, ShoppingBag, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCartStore } from '@/lib/stores/cart-store'
import { formatPrice } from '@/lib/format'

const checkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().max(200).trim().optional(),
  notes: z.string().max(500).trim().optional(),
})
type CheckoutValues = z.infer<typeof checkoutSchema>

interface RestaurantInfo {
  id: string
  name: string
  slug: string
  primaryColor: string
  isOpen: boolean
  deliveryEnabled: boolean
  deliveryFee: number
  minimumOrderAmount: number
  taxRate: number
}

interface CheckoutClientProps {
  restaurant: RestaurantInfo
}

export function CheckoutClient({ restaurant }: CheckoutClientProps) {
  const router = useRouter()
  const { cart, subtotal, clearCart } = useCartStore()
  const [isPending, startTransition] = useTransition()
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)

  const sub = subtotal()
  const tax = Math.round((sub * restaurant.taxRate) / 10000)
  const delivery = cart?.orderType === 'DELIVERY' ? restaurant.deliveryFee : 0
  const total = sub + tax + delivery

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
  })

  // Redirect to menu if cart is empty
  if (!cart || cart.items.length === 0) {
    router.replace(`/restaurant/${restaurant.slug}/menu`)
    return null
  }

  if (placedOrderId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-4 text-center animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 animate-bounce-subtle">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
        <p className="text-sm text-gray-600 mb-8 max-w-sm">
          Your order has been received. Track your order status and get live updates.
        </p>
        <Button
          onClick={() => router.push(`/orders/${placedOrderId}`)}
          className="w-full max-w-xs py-3 rounded-xl font-semibold shadow-lg transition-transform active:scale-95"
          style={{ backgroundColor: restaurant.primaryColor }}
        >
          Track My Order
        </Button>
      </div>
    )
  }

  function onSubmit(values: CheckoutValues) {
    if (!cart) return

    startTransition(async () => {
      // Generate idempotency key from cart contents + timestamp
      const idempotencyKey = `${restaurant.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`

      const tableSessionId = sessionStorage.getItem('tableSessionId')

      const payload = {
        restaurantId: restaurant.id,
        orderType: cart.orderType,
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes,
        })),
        tableSessionId: cart.orderType === 'DINE_IN' ? tableSessionId : null,
        deliveryAddressId: null, // TODO: address capture for delivery
        paymentMethod: cart.orderType === 'DELIVERY' ? 'CASH_ON_DELIVERY' : 'PAY_AT_RESTAURANT',
        notes: values.notes ?? '',
        idempotencyKey,
        customerName: values.name,
        customerPhone: values.phone,
        customerEmail: values.email ?? '',
      }

      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        const msg = json.error?.message ?? 'Could not place your order. Please try again.'
        toast.error(msg)
        return
      }

      const { orderId } = json.data
      // Store customer ID association in cookie via the response
      clearCart()
      setPlacedOrderId(orderId)
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-20 glass-effect border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Checkout</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 pb-8 space-y-5">
        {/* Order summary */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-slide-up">
          <h2 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: restaurant.primaryColor }} aria-hidden="true" />
            Your Order
            <span className="ml-auto text-xs font-medium px-2 py-1 rounded-full" style={{ 
              backgroundColor: restaurant.primaryColor + '15',
              color: restaurant.primaryColor
            }}>
              {cart.orderType === 'DINE_IN' ? '🍽️ Dine-in' : cart.orderType === 'DELIVERY' ? '🛵 Delivery' : '🥡 Takeaway'}
            </span>
          </h2>
          <ul className="space-y-2.5">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt={item.name} width={40} height={40}
                    className="w-10 h-10 rounded-xl object-cover shrink-0" />
                )}
                <span className="flex-1 text-sm text-gray-700 truncate">
                  {item.quantity}× {item.name}
                </span>
                <span className="text-sm font-medium text-gray-900 shrink-0">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          {/* Totals */}
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span>{formatPrice(sub)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Tax ({restaurant.taxRate / 100}%)</span><span>{formatPrice(tax)}</span>
              </div>
            )}
            {delivery > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Delivery</span><span>{formatPrice(delivery)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
          </div>
        </section>

        {/* Customer details form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <section className="bg-white rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-gray-900 text-sm">Your details</h2>
            <div>
              <Label htmlFor="co-name">Name *</Label>
              <Input
                id="co-name"
                {...register('name')}
                className="mt-1"
                placeholder="Your name"
                autoComplete="name"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="co-phone">Mobile number *</Label>
              <Input
                id="co-phone"
                {...register('phone')}
                className="mt-1"
                placeholder="98765 43210"
                inputMode="numeric"
                autoComplete="tel"
              />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <Label htmlFor="co-email">Email <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input
                id="co-email"
                type="email"
                {...register('email')}
                className="mt-1"
                placeholder="for order confirmation"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="co-notes">Special instructions <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Textarea
                id="co-notes"
                {...register('notes')}
                rows={2}
                className="mt-1"
                placeholder="Allergies, preferences, etc."
              />
            </div>
          </section>

          {/* Payment note */}
          <section className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
            <p className="text-sm text-orange-800 font-medium">
              {cart.orderType === 'DELIVERY' ? '💵 Pay on delivery' : '🏪 Pay at restaurant'}
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              No payment is collected online. Pay when you receive your order.
            </p>
          </section>

          <Button
            type="submit"
            disabled={isPending || !restaurant.isOpen}
            className="w-full font-semibold py-3 rounded-xl text-white"
            style={{ backgroundColor: restaurant.primaryColor }}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Placing order…
              </>
            ) : !restaurant.isOpen ? (
              'Restaurant is closed'
            ) : (
              `Place order · ${formatPrice(total)}`
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
