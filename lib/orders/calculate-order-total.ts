/**
 * Authoritative order total calculation.
 *
 * This is the ONLY place where order totals are computed.
 * The server calls this before persisting an order — any total sent
 * by the client is ignored and recalculated here.
 *
 * All values are in integer paise. No floating-point arithmetic.
 */

export interface OrderLineItem {
  unitPrice: number // paise — fetched from DB, not from client
  quantity: number
}

export interface OrderTotals {
  subtotal: number // sum of (unitPrice * quantity) for all items
  discount: number // coupon or promotional discount (paise) — always 0 in MVP
  taxAmount: number // calculated from taxRate on (subtotal - discount)
  deliveryFee: number // flat fee from restaurant config (paise)
  total: number // subtotal - discount + taxAmount + deliveryFee
}

/**
 * Calculates the authoritative order total from server-fetched prices.
 *
 * @param items      - Array of line items with server-fetched unit prices
 * @param taxRate    - Restaurant tax rate in basis points (e.g. 500 = 5%)
 * @param deliveryFee - Flat delivery fee in paise (0 for dine-in/takeaway)
 * @param discount   - Discount in paise (0 for MVP — no coupons yet)
 */
export function calculateOrderTotal(
  items: OrderLineItem[],
  taxRate: number,
  deliveryFee: number,
  discount = 0
): OrderTotals {
  // Integer arithmetic only — no Math.round until the very end of each step
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  const discountedSubtotal = Math.max(0, subtotal - discount)

  // Tax is calculated on the discounted subtotal.
  // taxRate is basis points: 500 = 5.00%
  // Math.round to nearest paise — this is the standard approach for indirect tax.
  const taxAmount = Math.round((discountedSubtotal * taxRate) / 10000)

  const total = discountedSubtotal + taxAmount + deliveryFee

  return {
    subtotal,
    discount,
    taxAmount,
    deliveryFee,
    total,
  }
}

/**
 * Validates that all quantities are positive integers and there's at least one item.
 * Returns a string error message or null if valid.
 */
export function validateOrderItems(items: OrderLineItem[]): string | null {
  if (items.length === 0) return 'Order must contain at least one item'

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return 'Item quantities must be positive integers'
    }
    if (!Number.isInteger(item.unitPrice) || item.unitPrice < 0) {
      return 'Item prices must be non-negative integers (paise)'
    }
  }

  return null
}
