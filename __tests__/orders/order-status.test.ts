import { describe, it, expect } from 'vitest'
import {
  isValidTransition,
  getValidNextStatuses,
  isTerminalStatus,
} from '@/lib/orders/order-status'

describe('isValidTransition — DINE_IN', () => {
  it('allows PENDING → ACCEPTED', () => {
    expect(isValidTransition('DINE_IN', 'PENDING', 'ACCEPTED')).toBe(true)
  })

  it('allows PENDING → REJECTED', () => {
    expect(isValidTransition('DINE_IN', 'PENDING', 'REJECTED')).toBe(true)
  })

  it('allows ACCEPTED → PREPARING', () => {
    expect(isValidTransition('DINE_IN', 'ACCEPTED', 'PREPARING')).toBe(true)
  })

  it('allows PREPARING → READY', () => {
    expect(isValidTransition('DINE_IN', 'PREPARING', 'READY')).toBe(true)
  })

  it('allows READY → COMPLETED', () => {
    expect(isValidTransition('DINE_IN', 'READY', 'COMPLETED')).toBe(true)
  })

  it('blocks PENDING → PREPARING (must be accepted first)', () => {
    expect(isValidTransition('DINE_IN', 'PENDING', 'PREPARING')).toBe(false)
  })

  it('blocks READY → PENDING (no backward transitions)', () => {
    expect(isValidTransition('DINE_IN', 'READY', 'PENDING')).toBe(false)
  })

  it('blocks COMPLETED → ACCEPTED (terminal state)', () => {
    expect(isValidTransition('DINE_IN', 'COMPLETED', 'ACCEPTED')).toBe(false)
  })

  it('blocks CANCELLED → PREPARING (terminal state)', () => {
    expect(isValidTransition('DINE_IN', 'CANCELLED', 'PREPARING')).toBe(false)
  })

  it('blocks DINE_IN from using OUT_FOR_DELIVERY', () => {
    expect(isValidTransition('DINE_IN', 'READY', 'OUT_FOR_DELIVERY')).toBe(false)
  })
})

describe('isValidTransition — DELIVERY', () => {
  it('allows the full delivery path', () => {
    expect(isValidTransition('DELIVERY', 'PENDING', 'ACCEPTED')).toBe(true)
    expect(isValidTransition('DELIVERY', 'ACCEPTED', 'PREPARING')).toBe(true)
    expect(isValidTransition('DELIVERY', 'PREPARING', 'READY')).toBe(true)
    expect(isValidTransition('DELIVERY', 'READY', 'OUT_FOR_DELIVERY')).toBe(true)
    expect(isValidTransition('DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true)
    expect(isValidTransition('DELIVERY', 'DELIVERED', 'COMPLETED')).toBe(true)
  })

  it('blocks READY → COMPLETED for delivery (must go through OUT_FOR_DELIVERY)', () => {
    expect(isValidTransition('DELIVERY', 'READY', 'COMPLETED')).toBe(false)
  })

  it('blocks OUT_FOR_DELIVERY → PENDING', () => {
    expect(isValidTransition('DELIVERY', 'OUT_FOR_DELIVERY', 'PENDING')).toBe(false)
  })
})

describe('isValidTransition — TAKEAWAY', () => {
  it('does not use OUT_FOR_DELIVERY', () => {
    expect(isValidTransition('TAKEAWAY', 'READY', 'OUT_FOR_DELIVERY')).toBe(false)
  })

  it('allows READY → COMPLETED', () => {
    expect(isValidTransition('TAKEAWAY', 'READY', 'COMPLETED')).toBe(true)
  })
})

describe('getValidNextStatuses', () => {
  it('returns correct next statuses for PENDING dine-in', () => {
    const next = getValidNextStatuses('DINE_IN', 'PENDING')
    expect(next).toContain('ACCEPTED')
    expect(next).toContain('REJECTED')
    expect(next).not.toContain('PREPARING')
  })

  it('returns empty array for terminal COMPLETED', () => {
    expect(getValidNextStatuses('DINE_IN', 'COMPLETED')).toHaveLength(0)
  })

  it('returns empty array for terminal CANCELLED', () => {
    expect(getValidNextStatuses('DELIVERY', 'CANCELLED')).toHaveLength(0)
  })
})

describe('isTerminalStatus', () => {
  it('marks COMPLETED, CANCELLED, REJECTED as terminal', () => {
    expect(isTerminalStatus('COMPLETED')).toBe(true)
    expect(isTerminalStatus('CANCELLED')).toBe(true)
    expect(isTerminalStatus('REJECTED')).toBe(true)
  })

  it('does not mark PENDING, ACCEPTED, PREPARING, READY as terminal', () => {
    expect(isTerminalStatus('PENDING')).toBe(false)
    expect(isTerminalStatus('ACCEPTED')).toBe(false)
    expect(isTerminalStatus('PREPARING')).toBe(false)
    expect(isTerminalStatus('READY')).toBe(false)
  })
})
