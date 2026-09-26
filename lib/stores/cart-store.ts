/**
 * Cart Zustand store with optimistic UI updates.
 *
 * State lives in memory + localStorage for persistence across page navigations.
 * The cart is scoped to ONE restaurant at a time — adding from a different
 * restaurant clears the previous cart.
 *
 * Important: prices here are DISPLAY ONLY.
 * The server recalculates the authoritative total on order submission.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart, CartItem, OrderType } from '@/types/domain'

// Haptic feedback helper (works on mobile)
const vibrate = (pattern: number | number[] = 10) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

interface CartStore {
  cart: Cart | null
  isAnimating: boolean // For smooth animations

  // Initialise or update the cart context (called on menu page load)
  initCart: (config: Cart) => void

  // Item operations with instant feedback
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  incrementItem: (productId: string) => void
  decrementItem: (productId: string) => void
  updateItemNotes: (productId: string, notes: string) => void
  clearCart: () => void

  // Selectors
  itemCount: () => number
  subtotal: () => number
  getItemQuantity: (productId: string) => number
  setAnimating: (value: boolean) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: null,
      isAnimating: false,

      setAnimating(value) {
        set({ isAnimating: value })
      },

      initCart(config) {
        const existing = get().cart
        // If the same restaurant + order type, keep the items
        if (
          existing &&
          existing.restaurantId === config.restaurantId &&
          existing.orderType === config.orderType
        ) {
          // Update session context only
          set({
            cart: {
              ...existing,
              tableSessionId: config.tableSessionId ?? existing.tableSessionId,
              tableId: config.tableId ?? existing.tableId,
            },
          })
          return
        }
        // Different restaurant or order type — start fresh
        set({ cart: config })
      },

      addItem(item) {
        vibrate(10) // Quick haptic feedback
        set((state) => {
          if (!state.cart) return state
          const existing = state.cart.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              cart: {
                ...state.cart,
                items: state.cart.items.map((i) =>
                  i.productId === item.productId
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
                ),
              },
              isAnimating: true,
            }
          }
          return {
            cart: {
              ...state.cart,
              items: [...state.cart.items, { ...item, quantity: 1 }],
            },
            isAnimating: true,
          }
        })
        // Reset animation after 300ms
        setTimeout(() => set({ isAnimating: false }), 300)
      },

      incrementItem(productId) {
        vibrate(10)
        set((state) => {
          if (!state.cart) return state
          return {
            cart: {
              ...state.cart,
              items: state.cart.items.map((i) =>
                i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
              ),
            },
            isAnimating: true,
          }
        })
        setTimeout(() => set({ isAnimating: false }), 300)
      },

      decrementItem(productId) {
        vibrate(10)
        set((state) => {
          if (!state.cart) return state
          const item = state.cart.items.find((i) => i.productId === productId)
          if (!item) return state
          if (item.quantity === 1) {
            return {
              cart: {
                ...state.cart,
                items: state.cart.items.filter((i) => i.productId !== productId),
              },
              isAnimating: true,
            }
          }
          return {
            cart: {
              ...state.cart,
              items: state.cart.items.map((i) =>
                i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
              ),
            },
            isAnimating: true,
          }
        })
        setTimeout(() => set({ isAnimating: false }), 300)
      },

      removeItem(productId) {
        vibrate([10, 50, 10]) // Double vibration for delete
        set((state) => {
          if (!state.cart) return state
          return {
            cart: {
              ...state.cart,
              items: state.cart.items.filter((i) => i.productId !== productId),
            },
          }
        })
      },

      updateItemNotes(productId, notes) {
        set((state) => {
          if (!state.cart) return state
          return {
            cart: {
              ...state.cart,
              items: state.cart.items.map((i) =>
                i.productId === productId ? { ...i, notes } : i
              ),
            },
          }
        })
      },

      clearCart() {
        set({ cart: null })
      },

      itemCount() {
        const cart = get().cart
        if (!cart) return 0
        return cart.items.reduce((sum, i) => sum + i.quantity, 0)
      },

      subtotal() {
        const cart = get().cart
        if (!cart) return 0
        // Display-only total in paise — server recalculates authoritatively
        return cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
      },

      getItemQuantity(productId) {
        const cart = get().cart
        if (!cart) return 0
        return cart.items.find((i) => i.productId === productId)?.quantity ?? 0
      },
    }),
    {
      name: 'tableorder-cart',
      // Only persist cart items, not derived state
      partialize: (state) => ({ cart: state.cart }),
    }
  )
)
