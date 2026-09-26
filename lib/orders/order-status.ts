/**
 * Order status state machine.
 *
 * Defines which transitions are valid for each order type.
 * The server MUST validate every status change through this module.
 * Invalid transitions are rejected with INVALID_ORDER_TRANSITION.
 */
import type { OrderType, OrderStatus } from '@/types/domain'

// Valid transitions per order type.
// Key = current status, Value = set of statuses it can move to.
const DINE_IN_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  // Terminal states — no outgoing transitions
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
}

const TAKEAWAY_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
}

const DELIVERY_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
}

const TRANSITIONS_BY_TYPE: Record<OrderType, Partial<Record<OrderStatus, OrderStatus[]>>> = {
  DINE_IN: DINE_IN_TRANSITIONS,
  TAKEAWAY: TAKEAWAY_TRANSITIONS,
  DELIVERY: DELIVERY_TRANSITIONS,
}

/**
 * Returns true if the transition from `current` to `next` is valid
 * for the given order type.
 */
export function isValidTransition(
  orderType: OrderType,
  current: OrderStatus,
  next: OrderStatus
): boolean {
  const transitions = TRANSITIONS_BY_TYPE[orderType]
  const allowed = transitions[current]
  if (!allowed) return false
  return allowed.includes(next)
}

/**
 * Returns all valid next statuses for a given order type and current status.
 * Useful for building UI controls that only show valid actions.
 */
export function getValidNextStatuses(orderType: OrderType, current: OrderStatus): OrderStatus[] {
  const transitions = TRANSITIONS_BY_TYPE[orderType]
  return transitions[current] ?? []
}

/**
 * Returns true if the status is a terminal state (no further transitions possible).
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(status)
}

/**
 * Returns a human-readable label for each order status.
 */
export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    PREPARING: 'Preparing',
    READY: 'Ready',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    REJECTED: 'Rejected',
  }
  return labels[status]
}

/**
 * Returns a Tailwind color class for badge styling per status.
 */
export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-blue-100 text-blue-800',
    PREPARING: 'bg-orange-100 text-orange-800',
    READY: 'bg-green-100 text-green-800',
    OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-teal-100 text-teal-800',
    COMPLETED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REJECTED: 'bg-red-100 text-red-700',
  }
  return colors[status]
}
