'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateCategory } from '@/app/actions/menu'
import type { CategoryRow } from '@/types/database'

interface CategoryEditFormProps {
  category: CategoryRow
}

export function CategoryEditForm({ category }: CategoryEditFormProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateCategory(category.id, formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Category updated')
      router.push('/dashboard/menu')
    }
    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div>
        <Label htmlFor="cat-name">Category name *</Label>
        <Input
          id="cat-name"
          name="name"
          required
          className="mt-1"
          defaultValue={category.name}
        />
      </div>
      <div>
        <Label htmlFor="cat-desc">Description</Label>
        <Textarea
          id="cat-desc"
          name="description"
          rows={2}
          className="mt-1"
          defaultValue={category.description ?? ''}
        />
      </div>
      <div>
        <Label htmlFor="cat-sort">Sort order</Label>
        <Input
          id="cat-sort"
          name="sortOrder"
          type="number"
          min="0"
          className="mt-1 w-24"
          defaultValue={category.sort_order}
        />
        <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="cat-active"
          name="isActive"
          value="true"
          defaultChecked={category.is_active}
          className="rounded border-gray-300"
        />
        <Label htmlFor="cat-active" className="cursor-pointer">
          Active (visible to customers)
        </Label>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save changes
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
