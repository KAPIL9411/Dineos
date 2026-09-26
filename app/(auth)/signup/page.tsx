import type { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from './signup-form'

export const metadata: Metadata = {
  title: 'Create account',
}

export default function SignupPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Create your account</h2>
        <p className="text-sm text-gray-500 mt-1">Start accepting orders in minutes</p>
      </div>

      <SignupForm />

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
