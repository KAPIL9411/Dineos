import { redirect } from 'next/navigation'
import { resolveAuthContext } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { ProductForm } from '../product-form'
import type { Category } from '@/types/domain'

interface NewProductPageProps {
  searchParams: Promise<{ categoryId?: string }>
}

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const result = await resolveAuthContext()
  if (!result.ok) redirect('/login')

  const { restaurant } = result.ctx
  const params = await searchParams

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { data: categories } = await db
    .from('categories')
    .select('id, name')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .order('sort_order')

  const cats: Pick<Category, 'id' | 'name'>[] = (categories ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
  }))

  if (cats.length === 0) redirect('/dashboard/menu/categories/new')

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">New product</h1>
        <p className="text-sm text-gray-500 mt-1">Add an item to your menu</p>
      </div>
      <ProductForm categories={cats} defaultCategoryId={params.categoryId} />
    </div>
  )
}
