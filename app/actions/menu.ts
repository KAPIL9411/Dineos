'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveAuthContext, hasMinRole, createAuditLog } from '@/lib/auth'
import { createCategorySchema, updateCategorySchema, createProductSchema, updateProductSchema } from '@/lib/validate'
import { rupeesToPaise } from '@/lib/format'
import type { Category, Product } from '@/types/domain'

// ─── Helper ───────────────────────────────────────────────────────────────────

function revalidateMenu(slug: string) {
  revalidatePath('/dashboard/menu')
  revalidatePath(`/restaurant/${slug}`)
  revalidatePath(`/restaurant/${slug}/menu`)
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function createCategory(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string; category?: Category }> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }
  if (!hasMinRole(auth.ctx.staffMember, 'RESTAURANT_MANAGER')) return { error: 'Insufficient permissions' }

  const parsed = createCategorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    sortOrder: Number(formData.get('sortOrder') ?? 0),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { data, error } = await db
    .from('categories')
    .insert({
      tenant_id: auth.ctx.restaurant.tenantId,
      restaurant_id: auth.ctx.restaurant.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      sort_order: parsed.data.sortOrder,
      is_active: true,
    })
    .select('*')
    .single()

  if (error) {
    console.error('createCategory error', error)
    return { error: 'Could not create category' }
  }

  await createAuditLog({
    tenantId: auth.ctx.restaurant.tenantId,
    userId: auth.ctx.userId,
    action: 'CATEGORY_CREATED',
    resourceType: 'category',
    resourceId: data.id,
  })

  revalidateMenu(auth.ctx.restaurant.slug)
  return { category: rowToCategory(data) }
}

export async function updateCategory(
  categoryId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }
  if (!hasMinRole(auth.ctx.staffMember, 'RESTAURANT_MANAGER')) return { error: 'Insufficient permissions' }

  const parsed = updateCategorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    sortOrder: Number(formData.get('sortOrder') ?? 0),
    isActive: formData.get('isActive') === 'true',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any

  // Tenant-scope the update — never trust the categoryId alone
  const { error } = await db
    .from('categories')
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      sort_order: parsed.data.sortOrder,
      is_active: parsed.data.isActive,
    })
    .eq('id', categoryId)
    .eq('restaurant_id', auth.ctx.restaurant.id)
    .eq('tenant_id', auth.ctx.restaurant.tenantId)

  if (error) return { error: 'Could not update category' }

  revalidateMenu(auth.ctx.restaurant.slug)
  return {}
}

export async function deleteCategory(categoryId: string): Promise<{ error?: string }> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }
  if (!hasMinRole(auth.ctx.staffMember, 'RESTAURANT_OWNER')) return { error: 'Only owners can delete categories' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any

  // Check if products exist — on delete restrict in the DB would catch this anyway
  const { data: products } = await db
    .from('products')
    .select('id')
    .eq('category_id', categoryId)
    .eq('restaurant_id', auth.ctx.restaurant.id)
    .limit(1)

  if (products && products.length > 0) {
    return { error: 'Remove all products from this category before deleting it' }
  }

  const { error } = await db
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('restaurant_id', auth.ctx.restaurant.id)
    .eq('tenant_id', auth.ctx.restaurant.tenantId)

  if (error) return { error: 'Could not delete category' }

  await createAuditLog({
    tenantId: auth.ctx.restaurant.tenantId,
    userId: auth.ctx.userId,
    action: 'CATEGORY_DELETED',
    resourceType: 'category',
    resourceId: categoryId,
  })

  revalidateMenu(auth.ctx.restaurant.slug)
  return {}
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function createProduct(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string; product?: Product }> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }
  if (!hasMinRole(auth.ctx.staffMember, 'RESTAURANT_MANAGER')) return { error: 'Insufficient permissions' }

  const parsed = createProductSchema.safeParse({
    categoryId: formData.get('categoryId'),
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    priceRupees: Number(formData.get('priceRupees') ?? 0),
    isVeg: formData.get('isVeg') === 'true',
    sortOrder: Number(formData.get('sortOrder') ?? 0),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Verify the category belongs to this restaurant (tenant isolation)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { data: cat } = await db
    .from('categories')
    .select('id')
    .eq('id', parsed.data.categoryId)
    .eq('restaurant_id', auth.ctx.restaurant.id)
    .single()

  if (!cat) return { error: 'Category not found' }

  const priceInPaise = rupeesToPaise(parsed.data.priceRupees)

  const { data, error } = await db
    .from('products')
    .insert({
      tenant_id: auth.ctx.restaurant.tenantId,
      restaurant_id: auth.ctx.restaurant.id,
      category_id: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: priceInPaise,
      is_veg: parsed.data.isVeg,
      sort_order: parsed.data.sortOrder,
      is_available: true,
    })
    .select('*')
    .single()

  if (error) {
    console.error('createProduct error', error)
    return { error: 'Could not create product' }
  }

  await createAuditLog({
    tenantId: auth.ctx.restaurant.tenantId,
    userId: auth.ctx.userId,
    action: 'PRODUCT_CREATED',
    resourceType: 'product',
    resourceId: data.id,
  })

  revalidateMenu(auth.ctx.restaurant.slug)
  return { product: rowToProduct(data) }
}

export async function updateProduct(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string; product?: Product }> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }
  if (!hasMinRole(auth.ctx.staffMember, 'RESTAURANT_MANAGER')) return { error: 'Insufficient permissions' }

  const productId = formData.get('productId') as string
  if (!productId) return { error: 'Product ID required' }

  const parsed = updateProductSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    priceRupees: Number(formData.get('priceRupees') ?? 0),
    isVeg: formData.get('isVeg') === 'true',
    isAvailable: formData.get('isAvailable') !== 'false',
    sortOrder: Number(formData.get('sortOrder') ?? 0),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const updates: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updates.name = parsed.data.name
  if (parsed.data.description !== undefined) updates.description = parsed.data.description || null
  if (parsed.data.priceRupees !== undefined) updates.price = rupeesToPaise(parsed.data.priceRupees)
  if (parsed.data.isVeg !== undefined) updates.is_veg = parsed.data.isVeg
  if (parsed.data.isAvailable !== undefined) updates.is_available = parsed.data.isAvailable
  if (parsed.data.sortOrder !== undefined) updates.sort_order = parsed.data.sortOrder
  
  // Handle category change
  const categoryId = formData.get('categoryId')
  if (categoryId) updates.category_id = categoryId

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { data, error } = await db
    .from('products')
    .update(updates)
    .eq('id', productId)
    .eq('restaurant_id', auth.ctx.restaurant.id)
    .eq('tenant_id', auth.ctx.restaurant.tenantId)
    .select('*')
    .single()

  if (error) return { error: 'Could not update product' }

  revalidateMenu(auth.ctx.restaurant.slug)
  return { product: rowToProduct(data) }
}

export async function toggleProductAvailability(
  productId: string,
  isAvailable: boolean
): Promise<{ error?: string }> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { error } = await db
    .from('products')
    .update({ is_available: isAvailable })
    .eq('id', productId)
    .eq('restaurant_id', auth.ctx.restaurant.id)
    .eq('tenant_id', auth.ctx.restaurant.tenantId)

  if (error) return { error: 'Could not update availability' }

  revalidatePath('/dashboard/menu')
  revalidatePath(`/restaurant/${auth.ctx.restaurant.slug}/menu`)
  return {}
}

export async function deleteProduct(productId: string): Promise<{ error?: string }> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }
  if (!hasMinRole(auth.ctx.staffMember, 'RESTAURANT_OWNER')) return { error: 'Only owners can delete products' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { error } = await db
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('restaurant_id', auth.ctx.restaurant.id)
    .eq('tenant_id', auth.ctx.restaurant.tenantId)

  if (error) return { error: 'Could not delete product' }

  await createAuditLog({
    tenantId: auth.ctx.restaurant.tenantId,
    userId: auth.ctx.userId,
    action: 'PRODUCT_DELETED',
    resourceType: 'product',
    resourceId: productId,
  })

  revalidateMenu(auth.ctx.restaurant.slug)
  return {}
}

// ─── Image upload ──────────────────────────────────────────────────────────────

export async function uploadProductImage(
  productId: string,
  formData: FormData
): Promise<{ error?: string; imageUrl?: string }> {
  const auth = await resolveAuthContext()
  if (!auth.ok) return { error: 'Not authenticated' }

  const file = formData.get('image') as File | null
  if (!file) return { error: 'No image provided' }

  // Validate type and size (3MB limit)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Only JPEG, PNG and WebP images are allowed' }
  }
  if (file.size > 3 * 1024 * 1024) {
    return { error: 'Image must be smaller than 3MB' }
  }

  const db = createServiceClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${auth.ctx.restaurant.id}/${productId}-${Date.now()}.${ext}`

  const { error: uploadError } = await db.storage
    .from('product-images')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    console.error('Image upload error', uploadError)
    return { error: 'Failed to upload image' }
  }

  const { data: { publicUrl } } = db.storage
    .from('product-images')
    .getPublicUrl(path)

  // Update the product with the image URL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = db as any
  await dbAny
    .from('products')
    .update({ image_url: publicUrl })
    .eq('id', productId)
    .eq('restaurant_id', auth.ctx.restaurant.id)

  revalidateMenu(auth.ctx.restaurant.slug)
  return { imageUrl: publicUrl }
}

// ─── Row → domain mappers ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCategory(row: any): Category {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    restaurantId: row.restaurant_id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProduct(row: any): Product {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    restaurantId: row.restaurant_id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    price: row.price,
    isAvailable: row.is_available,
    isVeg: row.is_veg,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
