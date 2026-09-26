/**
 * Supabase database type definitions.
 * These mirror the PostgreSQL schema defined in db/migrations/.
 * Generated manually — run `supabase gen types typescript` after migrations to auto-generate.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ─── Enums ────────────────────────────────────────────────────────────────────

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export type PaymentMethod = 'PAY_AT_RESTAURANT' | 'CASH_ON_DELIVERY' | 'ONLINE'

export type StaffRole =
  | 'PLATFORM_ADMIN'
  | 'RESTAURANT_OWNER'
  | 'RESTAURANT_MANAGER'
  | 'KITCHEN_STAFF'
  | 'WAITER'
  | 'DELIVERY_STAFF'

export type DeliveryStatus = 'ASSIGNED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED'

// ─── Table row types ──────────────────────────────────────────────────────────

export interface TenantRow {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface RestaurantRow {
  id: string
  tenant_id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  primary_color: string
  secondary_color: string
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  opening_hours: Json
  is_open: boolean
  is_active: boolean
  delivery_enabled: boolean
  delivery_fee: number // paise
  minimum_order_amount: number // paise
  tax_rate: number // percentage * 100, e.g. 500 = 5%
  created_at: string
  updated_at: string
}

export interface StaffRow {
  id: string
  tenant_id: string
  restaurant_id: string
  user_id: string
  role: StaffRole
  name: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CategoryRow {
  id: string
  tenant_id: string
  restaurant_id: string
  name: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductRow {
  id: string
  tenant_id: string
  restaurant_id: string
  category_id: string
  name: string
  description: string | null
  image_url: string | null
  price: number // paise
  is_available: boolean
  is_veg: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TableRow {
  id: string
  tenant_id: string
  restaurant_id: string
  name: string
  capacity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TableSessionRow {
  id: string
  tenant_id: string
  restaurant_id: string
  table_id: string
  is_active: boolean
  created_at: string
  closed_at: string | null
}

export interface CustomerRow {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  user_id: string | null // null for guests
  created_at: string
  updated_at: string
}

export interface AddressRow {
  id: string
  customer_id: string
  label: string | null
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  pincode: string
  landmark: string | null
  created_at: string
}

export interface OrderRow {
  id: string
  tenant_id: string
  restaurant_id: string
  customer_id: string
  order_type: OrderType
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  subtotal: number // paise
  discount: number // paise
  tax: number // paise
  delivery_fee: number // paise
  total: number // paise
  table_id: string | null
  table_session_id: string | null
  delivery_address_id: string | null
  notes: string | null
  idempotency_key: string | null
  created_at: string
  updated_at: string
}

export interface OrderItemRow {
  id: string
  order_id: string
  tenant_id: string
  product_id: string
  product_name: string // snapshotted at order time
  product_image_url: string | null // snapshotted at order time
  quantity: number
  unit_price: number // paise, snapshotted at order time
  total_price: number // paise
  notes: string | null
  created_at: string
}

export interface PaymentRow {
  id: string
  order_id: string
  tenant_id: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number // paise
  provider_payment_id: string | null
  provider_order_id: string | null
  metadata: Json
  created_at: string
  updated_at: string
}

export interface DeliveryRow {
  id: string
  order_id: string
  tenant_id: string
  delivery_staff_id: string | null
  status: DeliveryStatus
  assigned_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AuditLogRow {
  id: string
  tenant_id: string | null
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  metadata: Json
  ip_address: string | null
  created_at: string
}

// ─── Supabase Database interface ──────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: TenantRow
        Insert: Omit<TenantRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<TenantRow, 'id' | 'created_at'>>
      }
      restaurants: {
        Row: RestaurantRow
        Insert: Omit<RestaurantRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<RestaurantRow, 'id' | 'created_at'>>
      }
      staff: {
        Row: StaffRow
        Insert: Omit<StaffRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<StaffRow, 'id' | 'created_at'>>
      }
      categories: {
        Row: CategoryRow
        Insert: Omit<CategoryRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<CategoryRow, 'id' | 'created_at'>>
      }
      products: {
        Row: ProductRow
        Insert: Omit<ProductRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProductRow, 'id' | 'created_at'>>
      }
      tables: {
        Row: TableRow
        Insert: Omit<TableRow, 'created_at'>
        Update: Partial<Omit<TableRow, 'id' | 'created_at'>>
      }
      table_sessions: {
        Row: TableSessionRow
        Insert: Omit<TableSessionRow, 'created_at'>
        Update: Partial<Omit<TableSessionRow, 'id' | 'created_at'>>
      }
      customers: {
        Row: CustomerRow
        Insert: Omit<CustomerRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<CustomerRow, 'id' | 'created_at'>>
      }
      addresses: {
        Row: AddressRow
        Insert: Omit<AddressRow, 'created_at'>
        Update: Partial<Omit<AddressRow, 'id' | 'created_at'>>
      }
      orders: {
        Row: OrderRow
        Insert: Omit<OrderRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<OrderRow, 'id' | 'created_at'>>
      }
      order_items: {
        Row: OrderItemRow
        Insert: Omit<OrderItemRow, 'created_at'>
        Update: Partial<Omit<OrderItemRow, 'id' | 'created_at'>>
      }
      payments: {
        Row: PaymentRow
        Insert: Omit<PaymentRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<PaymentRow, 'id' | 'created_at'>>
      }
      deliveries: {
        Row: DeliveryRow
        Insert: Omit<DeliveryRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<DeliveryRow, 'id' | 'created_at'>>
      }
      audit_logs: {
        Row: AuditLogRow
        Insert: Omit<AuditLogRow, 'id' | 'created_at'>
        Update: never
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_type: OrderType
      order_status: OrderStatus
      payment_status: PaymentStatus
      payment_method: PaymentMethod
      staff_role: StaffRole
      delivery_status: DeliveryStatus
    }
  }
}
