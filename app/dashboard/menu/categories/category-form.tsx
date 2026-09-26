'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createCategory } from '@/app/actions/menu'

interface CategoryFormProps {
  onSuccess?: () => void
}

export function CategoryForm({ onSuccess }: CategoryFormProps) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createCategory, {})

  useEffect(() => {
    if (state.category) {
      toast.success(`"${state.category.name}" added`)
      router.push('/dashboard/menu')
    }
  }, [state.category, router])

  return (
    <form action={action} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div>
        <Label htmlFor="cat-name">Category name *</Label>
        <Input id="cat-name" name="name" required className="mt-1" placeholder="e.g. Starters, Main Course, Beverages" />
      </div>
      <div>
        <Label htmlFor="cat-desc">Description</Label>
        <Textarea id="cat-desc" name="description" rows={2} className="mt-1" placeholder="Optional" />
      </div>
      <div>
        <Label htmlFor="cat-sort">Sort order</Label>
        <Input id="cat-sort" name="sortOrder" type="number" min="0" defaultValue="0" className="mt-1 w-24" />
        <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
      </div>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">{state.error}</p>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save category
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
