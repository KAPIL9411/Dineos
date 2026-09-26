'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { ShoppingCart, Leaf, AlertCircle } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/stores/cart-store'
import { CartDrawer } from '@/components/customer/cart-drawer'
import { MenuSearchFilter } from '@/components/customer/menu-search-filter'
import { cn } from '@/lib/utils'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'nonveg'>('all')
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({})
  const { cart, initCart, itemCount } = useCartStore()
  const items = cart?.items ?? []

  // Filter menu based on search and veg filter
  const filteredMenu = useMemo(() => {
    if (!searchQuery && vegFilter === 'all') return menu

    return menu
      .map((category) => ({
        ...category,
        products: category.products.filter((product) => {
          // Search filter
          const matchesSearch = !searchQuery || 
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase())

          // Veg filter
          const matchesVeg = vegFilter === 'all' || 
            (vegFilter === 'veg' && product.isVeg) ||
            (vegFilter === 'nonveg' && !product.isVeg)

          return matchesSearch && matchesVeg
        }),
      }))
      .filter((category) => category.products.length > 0) // Remove empty categories
  }, [menu, searchQuery, vegFilter])

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
    if (searchQuery || vegFilter !== 'all') return // Skip observer when filtering

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
  }, [menu, searchQuery, vegFilter])

  function scrollToCategory(categoryId: string) {
    const el = categoryRefs.current[categoryId]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const totalItems = itemCount()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Sticky header */}
      <header
        className="sticky top-0 z-30 glass-effect border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              {orderType === 'DINE_IN' ? '🍽️ Dine-in' : orderType === 'DELIVERY' ? '🛵 Delivery' : '🥡 Takeaway'}
            </p>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{restaurant.name}</h1>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: restaurant.primaryColor }}
            aria-label={`View cart — ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
          >
            <ShoppingCart className="w-4 h-4" />
            {totalItems > 0 && (
              <>
                <span className="font-bold">{totalItems}</span>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold shadow-md" style={{ color: restaurant.primaryColor }}>
                  {totalItems}
                </span>
              </>
            )}
            {totalItems === 0 && <span>Cart</span>}
          </button>
        </div>

        {/* Restaurant closed banner */}
        {!restaurant.isOpen && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-t border-red-200 px-4 py-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-xs text-red-800 font-medium">Restaurant is currently closed. Browse the menu but orders can't be placed right now.</p>
          </div>
        )}

        {/* Category nav */}
        <nav className="overflow-x-auto hide-scrollbar" aria-label="Menu categories">
          <div className="flex gap-2 px-4 pb-3 pt-2 min-w-max">
            {filteredMenu.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'text-white shadow-md scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
                style={activeCategory === cat.id ? { backgroundColor: restaurant.primaryColor } : undefined}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>

        {/* Search and filters */}
        <div className="px-4 pb-3">
          <MenuSearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            vegFilter={vegFilter}
            onVegFilterChange={setVegFilter}
          />
        </div>
      </header>

      {/* Menu content */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-32">
        {filteredMenu.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-400 text-sm">
              {searchQuery || vegFilter !== 'all' 
                ? 'No items match your search or filter.' 
                : 'Menu not available yet.'}
            </p>
            {(searchQuery || vegFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setVegFilter('all')
                }}
                className="mt-3 text-xs underline"
                style={{ color: restaurant.primaryColor }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filteredMenu.map((category) => (
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
    <div className={cn(
      "bg-white rounded-2xl overflow-hidden flex gap-4 p-4 shadow-sm hover:shadow-md transition-all animate-fade-in-up border border-gray-100",
      unavailable && 'opacity-50'
    )}>
      {/* Image */}
      {product.imageUrl && (
        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100 relative group">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={96}
            height={96}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
          />
          {!unavailable && quantity === 0 && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          )}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start gap-2 mb-1">
          {/* Veg/non-veg indicator */}
          <div
            className={cn(
              "mt-0.5 w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0",
              product.isVeg ? 'border-green-600' : 'border-red-600'
            )}
            title={product.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
          >
            {product.isVeg && <Leaf className="w-2.5 h-2.5 text-green-600" />}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 leading-snug flex-1">
            {product.name}
          </h3>
        </div>

        {product.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-base font-bold text-gray-900">{formatPrice(product.price)}</span>

          {/* Add / quantity control */}
          {unavailable ? (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              {!product.isAvailable ? 'Not Available' : 'Closed'}
            </span>
          ) : quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-1 shadow-md transition-all hover:shadow-lg active:scale-95"
              style={{ backgroundColor: primaryColor }}
              aria-label={`Add ${product.name} to cart`}
            >
              <span>Add</span>
              <span className="text-lg">+</span>
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
