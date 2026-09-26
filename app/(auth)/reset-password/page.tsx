import type { Metadata } from 'next'
import Link from 'next/link'
import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = {
  title: 'Reset password',
}

export default function ResetPasswordPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Reset your password</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <ResetPasswordForm />

      <p className="text-center text-sm text-gray-500 mt-6">
        Remembered it?{' '}
        <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
