/**
 * Skeleton loaders for menu pages - Zomato/Swiggy style
 */

export function MenuItemSkeleton() {
  return (
    <div className="flex gap-3 p-3 bg-white rounded-lg border border-gray-100 animate-pulse">
      {/* Image skeleton */}
      <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0" />
      
      {/* Content skeleton */}
      <div className="flex-1 space-y-2">
        {/* Veg indicator */}
        <div className="w-4 h-4 bg-gray-200 rounded" />
        
        {/* Title */}
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        
        {/* Description */}
        <div className="space-y-1">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
        
        {/* Price and button */}
        <div className="flex items-center justify-between pt-1">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-8 w-20 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function MenuCategorySkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Category header */}
      <div className="h-6 bg-gray-200 rounded w-32" />
      
      {/* Menu items */}
      <div className="space-y-3">
        <MenuItemSkeleton />
        <MenuItemSkeleton />
        <MenuItemSkeleton />
      </div>
    </div>
  )
}

export function MenuPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant header skeleton */}
      <div className="bg-white border-b border-gray-200 animate-pulse">
        <div className="max-w-4xl mx-auto p-4 space-y-3">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-100 rounded w-64" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 animate-pulse">
        <div className="max-w-4xl mx-auto p-4">
          <div className="h-12 bg-gray-100 rounded-lg w-full" />
        </div>
      </div>

      {/* Menu content skeleton */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <MenuCategorySkeleton />
        <MenuCategorySkeleton />
      </div>
    </div>
  )
}

export function CartDrawerSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Item skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded" />
        </div>
      ))}
      
      {/* Total skeleton */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
        <div className="h-12 bg-gray-200 rounded-lg w-full" />
      </div>
    </div>
  )
}

export function OrderStatusSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 space-y-6 animate-pulse">
      {/* Progress bar skeleton */}
      <div className="space-y-3">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gray-300 rounded-full" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      </div>

      {/* Order details skeleton */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 rounded w-32" />
        {[1, 2].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
      {/* Image */}
      <div className="w-full h-48 bg-gray-200" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="space-y-1">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 bg-gray-200 rounded w-20" />
          <div className="h-9 w-24 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 border animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-white rounded-xl p-6 border animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-6" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    </div>
  )
}
