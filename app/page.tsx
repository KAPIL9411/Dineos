import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth'

/**
 * Root page — sends authenticated users to dashboard, others to the login page.
 * A proper marketing landing page can replace this redirect later.
 */
export default async function RootPage() {
  const user = await getAuthenticatedUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
