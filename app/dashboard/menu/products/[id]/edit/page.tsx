import { notFound, redirect } from 'next/navigation'
import { resolveAuthContext } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { ProductEditForm } from './product-edit-form'

export const metadata = {
  title: 'Edit Product',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const result = await resolveAuthContext()
  if (!result.ok) redirect('/login')
  const { restaurant } = result.ctx

  // Fetch product
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { data: product } = await db
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('restaurant_id', restaurant.id)
    .eq('tenant_id', restaurant.tenantId)
    .single()

  if (!product) notFound()

  // Fetch categories
  const { data: categories } = await db
    .from('categories')
    .select('id, name')
    .eq('restaurant_id', restaurant.id)
    .eq('tenant_id', restaurant.tenantId)
    .eq('is_active', true)
    .order('sort_order')

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit Product</h1>
        <p className="text-sm text-gray-500 mt-0.5">Update product details</p>
      </div>
      <ProductEditForm product={product} categories={categories ?? []} />
    </div>
  )
}
