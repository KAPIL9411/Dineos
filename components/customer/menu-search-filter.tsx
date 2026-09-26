'use client'

import { Search, X, Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuSearchFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  vegFilter: 'all' | 'veg' | 'nonveg'
  onVegFilterChange: (filter: 'all' | 'veg' | 'nonveg') => void
}

export function MenuSearchFilter({
  searchQuery,
  onSearchChange,
  vegFilter,
  onVegFilterChange,
}: MenuSearchFilterProps) {
  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search for dishes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onVegFilterChange('all')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
            vegFilter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          All
        </button>

        <button
          onClick={() => onVegFilterChange('veg')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
            vegFilter === 'veg'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <div className={cn(
            "w-3 h-3 rounded-sm border-2 flex items-center justify-center",
            vegFilter === 'veg' ? 'border-white' : 'border-green-600'
          )}>
            <Leaf className={cn("w-1.5 h-1.5", vegFilter === 'veg' ? 'text-white' : 'text-green-600')} />
          </div>
          Veg Only
        </button>

        <button
          onClick={() => onVegFilterChange('nonveg')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
            vegFilter === 'nonveg'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <div className={cn(
            "w-3 h-3 rounded-sm border-2",
            vegFilter === 'nonveg' ? 'border-white' : 'border-red-600'
          )} />
          Non-Veg Only
        </button>
      </div>

      {/* Active filter indicator */}
      {(vegFilter !== 'all' || searchQuery) && (
        <div className="flex items-center gap-2 text-xs animate-fade-in-up">
          <span className="text-gray-500">
            {searchQuery && vegFilter !== 'all' 
              ? `Showing ${vegFilter} items matching "${searchQuery}"`
              : searchQuery
              ? `Searching for "${searchQuery}"`
              : `Showing ${vegFilter} items only`}
          </span>
          <button
            onClick={() => {
              onSearchChange('')
              onVegFilterChange('all')
            }}
            className="ml-auto text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
