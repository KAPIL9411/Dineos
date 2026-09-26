'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ShoppingCart, Leaf, AlertCircle } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/stores/cart-store'
import { CartDrawer } from '@/components/customer/cart-drawer'
import type { CategoryWithProducts, Product, OrderType } from '@/types/domain'

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

interface MenuPageClientProps {
  restaurant: RestaurantInfo
  menu: CategoryWithProducts[]
  orderType: OrderType
  sessionId?: string
}

export function MenuPageClient({ restaurant, menu, orderType, sessionId }: MenuPageClientProps) {
  const [activeCategory, setActiveCategory] = useState(menu[0]?.id ?? '')
  const [cartOpen, setCartOpen] = useState(false)
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({})
  const { cart, initCart, itemCount } = useCartStore()
  const items = cart?.items ?? []

  // Initialise/sync cart with restaurant + order context
  useEffect(() => {
    initCart({
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
      orderType,
      tableId: null,
      tableSessionId: sessionId ?? null,
      items: [],
    })
  }, [restaurant.id, restaurant.slug, orderType, sessionId, initCart])

  // Highlight active category as user scrolls
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id)
          }
        }
      },
      { rootMargin: '-60px 0px -60% 0px', threshold: 0 }
    )
    Object.values(categoryRefs.current).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [menu])

  function scrollToCategory(categoryId: string) {
    const el = categoryRefs.current[categoryId]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const totalItems = itemCount()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header
        className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm"
      >
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              {orderType === 'DINE_IN' ? 'Dine-in' : orderType === 'DELIVERY' ? 'Delivery' : 'Takeaway'}
            </p>
            <h1 className="text-base font-semibold text-gray-900 leading-tight">{restaurant.name}</h1>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: restaurant.primaryColor }}
            aria-label={`View cart — ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
          >
            <ShoppingCart className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="font-semibold">{totalItems}</span>
            )}
            {totalItems === 0 && <span>Cart</span>}
          </button>
        </div>

        {/* Restaurant closed banner */}
        {!restaurant.isOpen && (
          <div className="bg-red-50 border-t border-red-100 px-4 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700">This restaurant is currently closed. You can browse the menu but orders are not accepted.</p>
          </div>
        )}

        {/* Category nav */}
        <nav className="overflow-x-auto hide-scrollbar" aria-label="Menu categories">
          <div className="flex gap-1 px-4 pb-2 pt-1 min-w-max">
            {menu.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={activeCategory === cat.id ? { backgroundColor: restaurant.primaryColor } : undefined}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Menu content */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-32">
        {menu.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-400 text-sm">Menu not available yet.</p>
          </div>
        ) : (
          menu.map((category) => (
            <section
              key={category.id}
              id={category.id}
              ref={(el) => { categoryRefs.current[category.id] = el }}
              className="mb-6 scroll-mt-32"
            >
              <h2 className="text-base font-bold text-gray-900 mb-3">{category.name}</h2>
              {category.description && (
                <p className="text-xs text-gray-500 -mt-2 mb-3">{category.description}</p>
              )}
              <div className="space-y-2">
                {category.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    primaryColor={restaurant.primaryColor}
                    isRestaurantOpen={restaurant.isOpen}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Cart drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        restaurant={restaurant}
      />
    </div>
  )
}

// ─── Product card ─────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product
  primaryColor: string
  isRestaurantOpen: boolean
}

function ProductCard({ product, primaryColor, isRestaurantOpen }: ProductCardProps) {
  const { addItem, getItemQuantity } = useCartStore()
  const quantity = getItemQuantity(product.id)

  function handleAdd() {
    if (!isRestaurantOpen || !product.isAvailable) return
    addItem({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      unitPrice: product.price,
      quantity: 1,
      notes: '',
    })
  }

  const unavailable = !product.isAvailable || !isRestaurantOpen

  return (
    <div className={`bg-white rounded-2xl overflow-hidden flex gap-3 p-3 ${unavailable ? 'opacity-60' : ''}`}>
      {/* Image */}
      {product.imageUrl && (
        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={80}
            height={80}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5 mb-0.5">
          {/* Veg/non-veg indicator */}
          <div
            className={`mt-0.5 w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 ${
              product.isVeg ? 'border-green-600' : 'border-red-600'
            }`}
            title={product.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
          >
            {product.isVeg && <Leaf className="w-2 h-2 text-green-600" />}
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
        </div>

        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <span className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</span>

          {/* Add / quantity control */}
          {unavailable ? (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {!product.isAvailable ? 'Unavailable' : 'Closed'}
            </span>
          ) : quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="w-8 h-8 rounded-full text-white text-lg font-bold flex items-center justify-center transition-opacity hover:opacity-90 active:scale-95"
              style={{ backgroundColor: primaryColor }}
              aria-label={`Add ${product.name} to cart`}
            >
              +
            </button>
          ) : (
            <QuantityControl
              productId={product.id}
              quantity={quantity}
              primaryColor={primaryColor}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Quantity control ─────────────────────────────────────────────────────────

interface QuantityControlProps {
  productId: string
  quantity: number
  primaryColor: string
}

function QuantityControl({ productId, quantity, primaryColor }: QuantityControlProps) {
  const { incrementItem, decrementItem } = useCartStore()

  return (
    <div
      className="flex items-center gap-2 px-2 py-1 rounded-full"
      style={{ backgroundColor: primaryColor + '15' }}
    >
      <button
        onClick={() => decrementItem(productId)}
        className="w-6 h-6 rounded-full text-white flex items-center justify-center text-sm font-bold"
        style={{ backgroundColor: primaryColor }}
        aria-label="Remove one"
      >
        −
      </button>
      <span className="text-sm font-semibold min-w-[1ch] text-center" style={{ color: primaryColor }}>
        {quantity}
      </span>
      <button
        onClick={() => incrementItem(productId)}
        className="w-6 h-6 rounded-full text-white flex items-center justify-center text-sm font-bold"
        style={{ backgroundColor: primaryColor }}
        aria-label="Add one more"
      >
        +
      </button>
    </div>
  )
}
