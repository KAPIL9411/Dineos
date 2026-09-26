'use client'

import { useActionState } from 'react'
import { signupAction } from '@/app/actions/auth'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2 } from 'lucide-react'

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, {})

  if (state.success && state.message === 'CHECK_EMAIL') {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">Check your email</h3>
        <p className="text-sm text-gray-500">
          We sent a confirmation link to your email address. Click it to activate your account.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          required
          className="mt-1"
          aria-describedby={state.fieldErrors?.name ? 'name-error' : undefined}
        />
        {state.fieldErrors?.name && (
          <p id="name-error" className="text-sm text-red-600 mt-1" role="alert">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@yourrestaurant.com"
          required
          className="mt-1"
          aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
        />
        {state.fieldErrors?.email && (
          <p id="email-error" className="text-sm text-red-600 mt-1" role="alert">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          className="mt-1"
          aria-describedby={state.fieldErrors?.password ? 'password-error' : undefined}
        />
        {state.fieldErrors?.password && (
          <p id="password-error" className="text-sm text-red-600 mt-1" role="alert">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>

      {state.error && (
        <div
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </div>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating account…
          </>
        ) : (
          'Create account'
        )}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  )
}
