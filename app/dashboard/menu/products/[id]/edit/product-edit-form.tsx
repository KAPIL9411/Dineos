'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Leaf, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateProduct } from '@/app/actions/menu'
import type { ProductRow } from '@/types/database'

interface ProductEditFormProps {
  product: ProductRow
  categories: Array<{ id: string; name: string }>
}

export function ProductEditForm({ product, categories }: ProductEditFormProps) {
  const router = useRouter()
  const [state, action, pending] = useActionState(updateProduct, {})
  const [isVeg, setIsVeg] = useState(product.is_veg)
  const [selectedCategory, setSelectedCategory] = useState(product.category_id)
  const [imagePreview, setImagePreview] = useState<string | null>(product.image_url)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    if (state.product) {
      toast.success(`"${state.product.name}" updated`)
      router.push('/dashboard/menu')
    }
  }, [state.product, router])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  return (
    <form action={action} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="categoryId" value={selectedCategory} />
      <input type="hidden" name="isVeg" value={String(isVeg)} />

      {/* Image Upload */}
      <div>
        <Label>Product Image</Label>
        <div className="mt-2">
          {imagePreview ? (
            <div className="relative w-full h-48 rounded-lg border-2 border-gray-200 overflow-hidden">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Click to upload image</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
              <input
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageChange}
                name="image"
              />
            </label>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="prod-category">Category *</Label>
        <Select value={selectedCategory} onValueChange={(value) => { if (value !== null) setSelectedCategory(value) }}>
          <SelectTrigger id="prod-category" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="prod-name">Product name *</Label>
        <Input
          id="prod-name"
          name="name"
          required
          className="mt-1"
          defaultValue={product.name}
        />
      </div>

      <div>
        <Label htmlFor="prod-desc">Description</Label>
        <Textarea
          id="prod-desc"
          name="description"
          rows={2}
          className="mt-1"
          defaultValue={product.description ?? ''}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="prod-price">Price (₹) *</Label>
          <Input
            id="prod-price"
            name="priceRupees"
            type="number"
            step="0.5"
            min="0"
            required
            className="mt-1"
            defaultValue={(product.price / 100).toFixed(2)}
          />
        </div>
        <div>
          <Label htmlFor="prod-sort">Sort order</Label>
          <Input
            id="prod-sort"
            name="sortOrder"
            type="number"
            min="0"
            className="mt-1"
            defaultValue={product.sort_order}
          />
        </div>
      </div>

      <div>
        <Label>Type</Label>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => setIsVeg(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              isVeg
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            Vegetarian
          </button>
          <button
            type="button"
            onClick={() => setIsVeg(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              !isVeg
                ? 'border-red-400 bg-red-50 text-red-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            Non-vegetarian
          </button>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save changes
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
