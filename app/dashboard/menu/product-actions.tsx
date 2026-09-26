'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toggleProductAvailability, deleteProduct } from '@/app/actions/menu'

interface ProductActionsProps {
  productId: string
  productName: string
  isAvailable: boolean
}

export function ProductActions({ productId, productName, isAvailable }: ProductActionsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await toggleProductAvailability(productId, checked)
      if (result.error) {
        toast.error(result.error)
      } else {
        router.refresh()
      }
    })
  }

  function handleDelete() {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteProduct(productId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Product deleted')
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Switch
        checked={isAvailable}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label={isAvailable ? 'Mark unavailable' : 'Mark available'}
        className="data-[state=checked]:bg-green-500"
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-gray-100"
          aria-label="Product actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => router.push(`/dashboard/menu/products/${productId}/edit`)}>
            <Pencil className="w-3.5 h-3.5 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
