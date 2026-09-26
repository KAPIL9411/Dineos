/**
 * Application-level domain models.
 *
 * These are the shapes the UI and business logic work with — typically
 * composed from raw DB rows with joins, computed fields, or UI-only state.
 *
 * Rules:
 *  - No `any`. Use `unknown` with narrowing if necessary.
 *  - Money is always in integer paise (₹1 = 100 paise).
 *  - Enums use union string literals — match the DB CHECK constraints exactly.
 */

import type {
  OrderType,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  StaffRole,
  DeliveryStatus,
  Json,
} from './database'

// ─── Re-export enums so callers import from one place ─────────────────────────

export type { OrderType, OrderStatus, PaymentStatus, PaymentMethod, StaffRole, DeliveryStatus }

// ─── Opening hours ─────────────────────────────────────────────────────────────

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export interface DayHours {
  open: string // "HH:MM" 24h
  close: string // "HH:MM" 24h
  is_closed: boolean
}

export type OpeningHours = Record<DayOfWeek, DayHours>

// ─── Restaurant ────────────────────────────────────────────────────────────────

export interface Restaurant {
  id: string
  tenantId: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  coverUrl: string | null
  primaryColor: string
  secondaryColor: string
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  openingHours: OpeningHours
  isOpen: boolean
  isActive: boolean
  deliveryEnabled: boolean
  deliveryFee: number // paise
  minimumOrderAmount: number // paise
  taxRate: number // e.g. 500 = 5.00%
  createdAt: string
  updatedAt: string
}

// ─── Staff / User ──────────────────────────────────────────────────────────────

export interface StaffMember {
  id: string
  tenantId: string
  restaurantId: string
  userId: string
  role: StaffRole
  name: string
  email: string
  isActive: boolean
  createdAt: string
}

// ─── Menu ──────────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  tenantId: string
  restaurantId: string
  name: string
  description: string | null
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  tenantId: string
  restaurantId: string
  categoryId: string
  name: string
  description: string | null
  imageUrl: string | null
  price: number // paise
  isAvailable: boolean
  isVeg: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CategoryWithProducts extends Category {
  products: Product[]
}

// ─── Tables ────────────────────────────────────────────────────────────────────

export interface DiningTable {
  id: string
  tenantId: string
  restaurantId: string
  name: string
  capacity: number
  isActive: boolean
  createdAt: string
}

export interface TableSession {
  id: string
  tenantId: string
  restaurantId: string
  tableId: string
  isActive: boolean
  createdAt: string
  closedAt: string | null
}

// ─── Customer ──────────────────────────────────────────────────────────────────

export interface Customer {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  userId: string | null
  createdAt: string
}

export interface DeliveryAddress {
  id: string
  customerId: string
  label: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  pincode: string
  landmark: string | null
  createdAt: string
}

// ─── Cart (client-side only) ───────────────────────────────────────────────────

export interface CartItem {
  productId: string
  name: string
  imageUrl: string | null
  unitPrice: number // paise — display only, server recalculates
  quantity: number
  notes: string
}

export interface Cart {
  restaurantId: string
  restaurantSlug: string
  orderType: OrderType
  tableId: string | null
  tableSessionId: string | null
  items: CartItem[]
}

// ─── Orders ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string
  orderId: string
  tenantId: string
  productId: string
  productName: string
  productImageUrl: string | null
  quantity: number
  unitPrice: number // paise
  totalPrice: number // paise
  notes: string | null
  createdAt: string
}

export interface Order {
  id: string
  tenantId: string
  restaurantId: string
  customerId: string
  orderType: OrderType
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  subtotal: number // paise
  discount: number // paise
  tax: number // paise
  deliveryFee: number // paise
  total: number // paise
  tableId: string | null
  tableSessionId: string | null
  deliveryAddressId: string | null
  notes: string | null
  idempotencyKey: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
  table: DiningTable | null
  deliveryAddress: DeliveryAddress | null
  customer: Customer | null
}

// ─── Delivery ──────────────────────────────────────────────────────────────────

export interface Delivery {
  id: string
  orderId: string
  tenantId: string
  deliveryStaffId: string | null
  status: DeliveryStatus
  assignedAt: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string
  tenantId: string | null
  userId: string | null
  action: string
  resourceType: string
  resourceId: string | null
  metadata: Json
  ipAddress: string | null
  createdAt: string
}

// ─── Dashboard metrics ────────────────────────────────────────────────────────

export interface DashboardMetrics {
  todayOrders: number
  todayRevenue: number // paise
  pendingOrders: number
  activeOrders: number
  completedOrders: number
  averageOrderValue: number // paise
}

// ─── Request / form input shapes ──────────────────────────────────────────────

export interface CreateOrderInput {
  restaurantId: string
  orderType: OrderType
  items: Array<{
    productId: string
    quantity: number
    notes: string
  }>
  tableSessionId: string | null
  deliveryAddressId: string | null
  paymentMethod: PaymentMethod
  notes: string
  idempotencyKey: string
  // Customer fields for guest checkout
  customerName: string
  customerPhone: string
  customerEmail: string
}

export interface UpdateOrderStatusInput {
  orderId: string
  status: OrderStatus
}

export interface CreateRestaurantInput {
  name: string
  slug: string
  description: string
  primaryColor: string
}

export interface CreateCategoryInput {
  name: string
  description: string
  sortOrder: number
}

export interface CreateProductInput {
  categoryId: string
  name: string
  description: string
  price: number // paise
  isVeg: boolean
  sortOrder: number
}

export interface CreateTableInput {
  name: string
  capacity: number
}

// ─── Session context ──────────────────────────────────────────────────────────

/**
 * The resolved auth context passed into every protected route handler.
 * Never trust these values from the client — always resolve server-side.
 */
export interface AuthContext {
  userId: string
  staffMember: StaffMember
  restaurant: Restaurant
}
