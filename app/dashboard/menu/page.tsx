import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveAuthContext } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Plus, UtensilsCrossed, Leaf } from 'lucide-react'
import type { Category, Product } from '@/types/domain'
import { CategoryActions } from './category-actions'
import { ProductActions } from './product-actions'

interface CategoryWithProducts extends Category {
  products: Product[]
}

export default async function MenuPage() {
  const result = await resolveAuthContext()
  if (!result.ok) redirect('/login')

  const { restaurant } = result.ctx

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any

  const { data: categories } = await db
    .from('categories')
    .select('*, products(*)')
    .eq('restaurant_id', restaurant.id)
    .eq('tenant_id', restaurant.tenantId)
    .order('sort_order', { ascending: true })

  const menu: CategoryWithProducts[] = (categories ?? []).map((cat: any) => ({
    id: cat.id,
    tenantId: cat.tenant_id,
    restaurantId: cat.restaurant_id,
    name: cat.name,
    description: cat.description,
    imageUrl: cat.image_url,
    sortOrder: cat.sort_order,
    isActive: cat.is_active,
    createdAt: cat.created_at,
    updatedAt: cat.updated_at,
    products: (cat.products ?? []).map((p: any) => ({
      id: p.id,
      tenantId: p.tenant_id,
      restaurantId: p.restaurant_id,
      categoryId: p.category_id,
      name: p.name,
      description: p.description,
      imageUrl: p.image_url,
      price: p.price,
      isAvailable: p.is_available,
      isVeg: p.is_veg,
      sortOrder: p.sort_order,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })),
  }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Menu</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {menu.length} {menu.length === 1 ? 'category' : 'categories'} ·{' '}
            {menu.reduce((n, c) => n + c.products.length, 0)} products
          </p>
        </div>
        <Link href="/dashboard/menu/categories/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add category
          </Button>
        </Link>
      </div>

      {menu.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No menu yet"
          description="Start by adding a category, then add products to it."
          action={
            <Link href="/dashboard/menu/categories/new">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Add first category
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {menu.map((category) => (
            <section key={category.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Category header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-gray-900 text-sm">{category.name}</h2>
                  {!category.isActive && (
                    <Badge variant="secondary" className="text-xs">Hidden</Badge>
                  )}
                  <span className="text-xs text-gray-400">
                    {category.products.length} item{category.products.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/menu/products/new?categoryId=${category.id}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add product
                    </Button>
                  </Link>
                  <CategoryActions
                    categoryId={category.id}
                    categoryName={category.name}
                    isActive={category.isActive}
                  />
                </div>
              </div>

              {/* Products list */}
              {category.products.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-6 text-center">
                  No products yet.{' '}
                  <Link
                    href={`/dashboard/menu/products/new?categoryId=${category.id}`}
                    className="text-orange-600 hover:underline"
                  >
                    Add one
                  </Link>
                </p>
              ) : (
                <ul>
                  {category.products
                    .sort((a: Product, b: Product) => a.sortOrder - b.sortOrder)
                    .map((product: Product, idx: number) => (
                      <li
                        key={product.id}
                        className={`flex items-center gap-3 px-4 py-3 ${
                          idx !== category.products.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        {/* Veg indicator */}
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                            product.isVeg ? 'border-green-600' : 'border-red-600'
                          }`}
                          title={product.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
                        >
                          {product.isVeg && <Leaf className="w-2.5 h-2.5 text-green-600" />}
                        </div>

                        {/* Product image */}
                        {product.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                        )}

                        {/* Name & description */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-gray-400 truncate">{product.description}</p>
                          )}
                        </div>

                        {/* Price */}
                        <span className="text-sm font-semibold text-gray-900 shrink-0">
                          {formatPrice(product.price)}
                        </span>

                        {/* Availability + actions */}
                        <ProductActions
                          productId={product.id}
                          productName={product.name}
                          isAvailable={product.isAvailable}
                        />
                      </li>
                    ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
