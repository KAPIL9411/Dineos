import { redirect } from 'next/navigation'
import { resolveAuthContext } from '@/lib/auth'
import { hasMinRole } from '@/lib/auth'
import { paiseToRupees } from '@/lib/format'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const result = await resolveAuthContext()
  if (!result.ok) redirect('/login')

  const { staffMember, restaurant } = result.ctx

  if (!hasMinRole(staffMember, 'RESTAURANT_MANAGER')) {
    redirect('/dashboard')
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Restaurant settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your restaurant profile and configuration</p>
      </div>

      <SettingsForm
        restaurantId={restaurant.id}
        defaultValues={{
          name: restaurant.name,
          description: restaurant.description ?? '',
          phone: restaurant.phone ?? '',
          email: restaurant.email ?? '',
          address: restaurant.address ?? '',
          city: restaurant.city ?? '',
          state: restaurant.state ?? '',
          pincode: restaurant.pincode ?? '',
          primaryColor: restaurant.primaryColor,
          isOpen: restaurant.isOpen,
          deliveryEnabled: restaurant.deliveryEnabled,
          deliveryFeeRupees: paiseToRupees(restaurant.deliveryFee),
          minimumOrderRupees: paiseToRupees(restaurant.minimumOrderAmount),
          taxRatePct: restaurant.taxRate / 100, // basis points → percentage
        }}
      />
    </div>
  )
}
