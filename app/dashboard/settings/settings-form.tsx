'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { saveSettings } from './actions'

const settingsSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).trim(),
  phone: z.string().max(20).trim(),
  email: z.string().max(200).trim(),
  address: z.string().max(200).trim(),
  city: z.string().max(100).trim(),
  state: z.string().max(100).trim(),
  pincode: z.string().max(10).trim(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  isOpen: z.boolean(),
  deliveryEnabled: z.boolean(),
  deliveryFeeRupees: z.number().min(0).max(10000),
  minimumOrderRupees: z.number().min(0).max(100000),
  taxRatePct: z.number().min(0).max(100),
})

type SettingsValues = z.infer<typeof settingsSchema>

interface SettingsFormProps {
  restaurantId: string
  defaultValues: SettingsValues
}

export function SettingsForm({ restaurantId, defaultValues }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  })

  function onSubmit(values: SettingsValues) {
    startTransition(async () => {
      const result = await saveSettings(restaurantId, values)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Settings saved')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Basic info */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-medium text-gray-900 text-sm">Basic information</h2>
        <div>
          <Label htmlFor="s-name">Restaurant name</Label>
          <Input id="s-name" {...register('name')} className="mt-1" />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="s-description">Description</Label>
          <Textarea id="s-description" {...register('description')} className="mt-1" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="s-phone">Phone</Label>
            <Input id="s-phone" {...register('phone')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="s-email">Email</Label>
            <Input id="s-email" type="email" {...register('email')} className="mt-1" />
          </div>
        </div>
        <div>
          <Label htmlFor="s-address">Address</Label>
          <Input id="s-address" {...register('address')} className="mt-1" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="s-city">City</Label>
            <Input id="s-city" {...register('city')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="s-state">State</Label>
            <Input id="s-state" {...register('state')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="s-pincode">Pincode</Label>
            <Input id="s-pincode" {...register('pincode')} className="mt-1" />
          </div>
        </div>
      </section>

      <Separator />

      {/* Status */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-medium text-gray-900 text-sm">Status</h2>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-900">Restaurant is open</p>
            <p className="text-xs text-gray-500">Customers can place new orders</p>
          </div>
          <input type="checkbox" {...register('isOpen')} className="sr-only peer" />
          <div className="relative w-11 h-6 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-5 after:h-5 after:rounded-full after:transition-transform peer-checked:after:translate-x-5" />
        </label>
      </section>

      <Separator />

      {/* Delivery */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-medium text-gray-900 text-sm">Delivery</h2>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-900">Delivery enabled</p>
            <p className="text-xs text-gray-500">Accept home delivery orders</p>
          </div>
          <input type="checkbox" {...register('deliveryEnabled')} className="sr-only peer" />
          <div className="relative w-11 h-6 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-5 after:h-5 after:rounded-full after:transition-transform peer-checked:after:translate-x-5" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="s-delivery-fee">Delivery fee (₹)</Label>
            <Input id="s-delivery-fee" type="number" step="0.5" min="0" {...register('deliveryFeeRupees', { valueAsNumber: true })} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="s-min-order">Minimum order (₹)</Label>
            <Input id="s-min-order" type="number" step="1" min="0" {...register('minimumOrderRupees', { valueAsNumber: true })} className="mt-1" />
          </div>
        </div>
        <div>
          <Label htmlFor="s-tax">Tax rate (%)</Label>
          <Input id="s-tax" type="number" step="0.5" min="0" max="100" {...register('taxRatePct', { valueAsNumber: true })} className="mt-1 max-w-[120px]" />
          <p className="text-xs text-gray-400 mt-1">Applied to all orders. 0 = no tax.</p>
        </div>
      </section>

      <Separator />

      {/* Branding */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-medium text-gray-900 text-sm">Branding</h2>
        <div>
          <Label htmlFor="s-color">Primary colour</Label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" {...register('primaryColor')} className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0.5" />
            <Input {...register('primaryColor')} className="w-36 font-mono text-sm" maxLength={7} />
          </div>
          {errors.primaryColor && <p className="text-sm text-red-600 mt-1">{errors.primaryColor.message}</p>}
        </div>
      </section>

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Save settings
      </Button>
    </form>
  )
}
