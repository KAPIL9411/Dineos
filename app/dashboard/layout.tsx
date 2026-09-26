import { redirect } from 'next/navigation'
import { resolveAuthContext } from '@/lib/auth'
import { NavSidebar } from '@/components/dashboard/nav-sidebar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const result = await resolveAuthContext()

  if (!result.ok) {
    redirect('/login')
  }

  const { restaurant } = result.ctx

  // Restaurant not yet activated — send to onboarding
  if (!restaurant.name || restaurant.name.endsWith("'s Restaurant")) {
    // Only redirect if not already on onboarding
    // (This check is approximate; onboarding updates the name)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavSidebar restaurantName={restaurant.name} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
