/**
 * Shared Zod schemas used across route handlers and Server Actions.
 * Client-side forms can import these too for consistent validation.
 */
import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long'),
})

export const loginSchema = z.object({
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})

export const resetPasswordSchema = z.object({
  email: z.email('Enter a valid email address').trim().toLowerCase(),
})

// ─── Restaurant ───────────────────────────────────────────────────────────────

export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(60)
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens')

export const createRestaurantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  slug: slugSchema,
  description: z.string().max(500).trim().default(''),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
    .default('#FF6B35'),
})

export const updateRestaurantSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  phone: z.string().max(20).trim().nullable().optional(),
  email: z.email().trim().nullable().optional(),
  address: z.string().max(200).trim().nullable().optional(),
  city: z.string().max(100).trim().nullable().optional(),
  state: z.string().max(100).trim().nullable().optional(),
  pincode: z.string().max(10).trim().nullable().optional(),
  isOpen: z.boolean().optional(),
  deliveryEnabled: z.boolean().optional(),
  deliveryFee: z.number().int().min(0).optional(),
  minimumOrderAmount: z.number().int().min(0).optional(),
  taxRate: z.number().int().min(0).max(10000).optional(),
})

// ─── Category ─────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100).trim(),
  description: z.string().max(300).trim().default(''),
  sortOrder: z.number().int().min(0).default(0),
})

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
})

// ─── Product ──────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  categoryId: z.string().uuid('Invalid category'),
  name: z.string().min(1, 'Product name is required').max(100).trim(),
  description: z.string().max(500).trim().default(''),
  // Price is submitted as rupees from the form, converted to paise server-side
  priceRupees: z
    .number()
    .min(0, 'Price must be 0 or more')
    .max(100000, 'Price seems too high'),
  isVeg: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
})

export const updateProductSchema = createProductSchema.partial().extend({
  isAvailable: z.boolean().optional(),
})

// ─── Table ────────────────────────────────────────────────────────────────────

export const createTableSchema = z.object({
  name: z.string().min(1, 'Table name is required').max(50).trim(),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(50),
})

export const updateTableSchema = createTableSchema.partial().extend({
  isActive: z.boolean().optional(),
})

// ─── Order ────────────────────────────────────────────────────────────────────

const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(20),
  notes: z.string().max(200).trim().default(''),
})

export const createOrderSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  orderType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  tableSessionId: z.string().uuid().nullable().default(null),
  deliveryAddressId: z.string().uuid().nullable().default(null),
  paymentMethod: z.enum(['PAY_AT_RESTAURANT', 'CASH_ON_DELIVERY', 'ONLINE']),
  notes: z.string().max(500).trim().default(''),
  idempotencyKey: z.string().min(1, 'Idempotency key is required').max(128),
  customerName: z.string().min(1, 'Name is required').max(100).trim(),
  customerPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  customerEmail: z.string().max(200).trim().default(''),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'ACCEPTED',
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'REJECTED',
  ]),
})

// ─── Address ──────────────────────────────────────────────────────────────────

export const createAddressSchema = z.object({
  label: z.string().max(50).trim().nullable().default(null),
  addressLine1: z.string().min(5, 'Address is required').max(200).trim(),
  addressLine2: z.string().max(200).trim().default(''),
  city: z.string().min(1, 'City is required').max(100).trim(),
  state: z.string().min(1, 'State is required').max(100).trim(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  landmark: z.string().max(200).trim().default(''),
})

// ─── Pagination ───────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
