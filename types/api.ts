/**
 * API response shapes.
 *
 * All route handlers return one of these two shapes.
 * Clients can reliably check `result.success` to branch.
 */

// ─── Standard response wrappers ───────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    // Field-level validation errors (from Zod)
    fields?: Record<string, string[]>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── Paginated response ───────────────────────────────────────────────────────

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export type PaginatedResponse<T> = ApiSuccess<PaginatedData<T>>

// ─── Error codes ──────────────────────────────────────────────────────────────

export const ErrorCode = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Restaurant
  RESTAURANT_NOT_FOUND: 'RESTAURANT_NOT_FOUND',
  RESTAURANT_CLOSED: 'RESTAURANT_CLOSED',
  RESTAURANT_SUSPENDED: 'RESTAURANT_SUSPENDED',
  SLUG_TAKEN: 'SLUG_TAKEN',

  // Menu
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_UNAVAILABLE: 'PRODUCT_UNAVAILABLE',
  PRODUCT_WRONG_TENANT: 'PRODUCT_WRONG_TENANT',

  // Tables
  TABLE_NOT_FOUND: 'TABLE_NOT_FOUND',
  TABLE_SESSION_NOT_FOUND: 'TABLE_SESSION_NOT_FOUND',
  TABLE_SESSION_CLOSED: 'TABLE_SESSION_CLOSED',
  TABLE_SESSION_WRONG_RESTAURANT: 'TABLE_SESSION_WRONG_RESTAURANT',

  // Orders
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_ALREADY_EXISTS: 'ORDER_ALREADY_EXISTS',
  INVALID_ORDER_TRANSITION: 'INVALID_ORDER_TRANSITION',
  ORDER_ALREADY_CANCELLED: 'ORDER_ALREADY_CANCELLED',
  ORDER_WRONG_TENANT: 'ORDER_WRONG_TENANT',
  EMPTY_ORDER: 'EMPTY_ORDER',
  DELIVERY_ADDRESS_REQUIRED: 'DELIVERY_ADDRESS_REQUIRED',
  TABLE_SESSION_REQUIRED: 'TABLE_SESSION_REQUIRED',
  MINIMUM_ORDER_NOT_MET: 'MINIMUM_ORDER_NOT_MET',

  // Delivery
  DELIVERY_NOT_AVAILABLE: 'DELIVERY_NOT_AVAILABLE',
  ADDRESS_NOT_FOUND: 'ADDRESS_NOT_FOUND',

  // Customer
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',

  // Generic
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
} as const

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode]
