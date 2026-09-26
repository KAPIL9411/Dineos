import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Sign in',
}

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const redirectTo = params.redirectTo ?? '/dashboard'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
        <p className="text-sm text-gray-500 mt-1">Sign in to your restaurant dashboard</p>
      </div>

      {params.error === 'auth_callback_failed' && (
        <div
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4"
          role="alert"
        >
          Email confirmation failed. The link may have expired. Please try again.
        </div>
      )}

      <LoginForm redirectTo={redirectTo} />

      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-orange-600 hover:text-orange-700 font-medium">
          Create one free
        </Link>
      </p>
    </div>
  )
}
