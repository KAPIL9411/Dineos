import { describe, it, expect } from 'vitest'
import { calculateOrderTotal, validateOrderItems } from '@/lib/orders/calculate-order-total'

describe('calculateOrderTotal', () => {
  it('computes subtotal as sum of unit_price * quantity', () => {
    const result = calculateOrderTotal(
      [
        { unitPrice: 10000, quantity: 2 }, // ₹100 × 2
        { unitPrice: 5000, quantity: 1 },  // ₹50 × 1
      ],
      0,   // no tax
      0    // no delivery
    )
    expect(result.subtotal).toBe(25000) // ₹250
  })

  it('calculates tax in integer paise without floating-point drift', () => {
    // 5% tax on ₹249 (24900 paise) = ₹12.45 = 1245 paise
    const result = calculateOrderTotal([{ unitPrice: 24900, quantity: 1 }], 500, 0)
    expect(result.taxAmount).toBe(1245)
    expect(result.total).toBe(24900 + 1245)
  })

  it('adds delivery fee to total', () => {
    const result = calculateOrderTotal([{ unitPrice: 10000, quantity: 1 }], 0, 4000)
    expect(result.deliveryFee).toBe(4000)
    expect(result.total).toBe(14000)
  })

  it('applies discount before computing tax', () => {
    // ₹200 item, ₹50 discount → taxable base = ₹150, 10% tax = ₹15
    const result = calculateOrderTotal([{ unitPrice: 20000, quantity: 1 }], 1000, 0, 5000)
    expect(result.discount).toBe(5000)
    expect(result.taxAmount).toBe(1500) // 10% of 15000
    expect(result.total).toBe(15000 + 1500)
  })

  it('never returns negative total when discount exceeds subtotal', () => {
    const result = calculateOrderTotal([{ unitPrice: 5000, quantity: 1 }], 0, 0, 10000)
    expect(result.total).toBeGreaterThanOrEqual(0)
  })

  it('handles zero-price items (free items)', () => {
    const result = calculateOrderTotal([{ unitPrice: 0, quantity: 5 }], 0, 0)
    expect(result.subtotal).toBe(0)
    expect(result.total).toBe(0)
  })

  it('handles multiple items with tax and delivery correctly', () => {
    const result = calculateOrderTotal(
      [
        { unitPrice: 15000, quantity: 2 }, // 30000
        { unitPrice: 8000, quantity: 1 },  // 8000
      ],
      500,  // 5% tax
      3000  // ₹30 delivery
    )
    // subtotal = 38000, tax = 38000 * 500 / 10000 = 1900
    expect(result.subtotal).toBe(38000)
    expect(result.taxAmount).toBe(1900)
    expect(result.total).toBe(38000 + 1900 + 3000) // 42900
  })

  it('uses only integer paise — no floats in output', () => {
    const result = calculateOrderTotal([{ unitPrice: 33333, quantity: 3 }], 333, 0)
    expect(Number.isInteger(result.subtotal)).toBe(true)
    expect(Number.isInteger(result.taxAmount)).toBe(true)
    expect(Number.isInteger(result.total)).toBe(true)
  })
})

describe('validateOrderItems', () => {
  it('returns null for valid items', () => {
    expect(
      validateOrderItems([
        { unitPrice: 10000, quantity: 2 },
        { unitPrice: 5000, quantity: 1 },
      ])
    ).toBeNull()
  })

  it('rejects empty items array', () => {
    expect(validateOrderItems([])).not.toBeNull()
  })

  it('rejects quantity of 0', () => {
    expect(validateOrderItems([{ unitPrice: 10000, quantity: 0 }])).not.toBeNull()
  })

  it('rejects negative price', () => {
    expect(validateOrderItems([{ unitPrice: -100, quantity: 1 }])).not.toBeNull()
  })

  it('rejects fractional quantity', () => {
    expect(validateOrderItems([{ unitPrice: 10000, quantity: 1.5 }])).not.toBeNull()
  })
})
