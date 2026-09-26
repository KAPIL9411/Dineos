/**
 * Cart Zustand store.
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

interface CartStore {
  cart: Cart | null

  // Initialise or update the cart context (called on menu page load)
  initCart: (config: Cart) => void

  // Item operations
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
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: null,

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
            }
          }
          return {
            cart: {
              ...state.cart,
              items: [...state.cart.items, { ...item, quantity: 1 }],
            },
          }
        })
      },

      incrementItem(productId) {
        set((state) => {
          if (!state.cart) return state
          return {
            cart: {
              ...state.cart,
              items: state.cart.items.map((i) =>
                i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
              ),
            },
          }
        })
      },

      decrementItem(productId) {
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
            }
          }
          return {
            cart: {
              ...state.cart,
              items: state.cart.items.map((i) =>
                i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
              ),
            },
          }
        })
      },

      removeItem(productId) {
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
