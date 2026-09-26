import { redirect } from 'next/navigation'
import { resolveAuthContext } from '@/lib/auth'
import { OnboardingWizard } from './onboarding-wizard'

export default async function OnboardingPage() {
  const result = await resolveAuthContext()
  if (!result.ok) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Set up your restaurant</h1>
          <p className="text-sm text-gray-500 mt-1">
            This takes about 2 minutes. You can always change these later.
          </p>
        </div>
        <OnboardingWizard
          restaurantId={result.ctx.restaurant.id}
          defaultSlug={result.ctx.restaurant.slug}
        />
      </div>
    </div>
  )
}
