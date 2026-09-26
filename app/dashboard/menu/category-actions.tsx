'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Trash2, EyeOff, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { deleteCategory, updateCategory } from '@/app/actions/menu'

interface CategoryActionsProps {
  categoryId: string
  categoryName: string
  isActive: boolean
}

export function CategoryActions({ categoryId, categoryName, isActive }: CategoryActionsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggleVisibility() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('name', categoryName)
      fd.set('isActive', String(!isActive))
      const result = await updateCategory(categoryId, fd)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isActive ? 'Category hidden' : 'Category shown')
        router.refresh()
      }
    })
  }

  function handleDelete() {
    if (!confirm(`Delete "${categoryName}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteCategory(categoryId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Category deleted')
        router.refresh()
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-gray-100 disabled:opacity-50"
        disabled={isPending}
        aria-label="Category actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => router.push(`/dashboard/menu/categories/${categoryId}/edit`)}>
          <Pencil className="w-3.5 h-3.5 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleVisibility}>
          {isActive ? <EyeOff className="w-3.5 h-3.5 mr-2" /> : <Eye className="w-3.5 h-3.5 mr-2" />}
          {isActive ? 'Hide' : 'Show'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
