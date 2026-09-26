'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction } from '@/app/actions/auth'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface LoginFormProps {
  redirectTo: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [state, action, pending] = useActionState(loginAction, {})

  return (
    <form action={action} className="space-y-4">
      {/* Pass redirectTo through a hidden field so the server action can read it */}
      <input type="hidden" name="redirectTo" value={redirectTo} />

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
        <div className="flex items-center justify-between mb-1">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/reset-password"
            className="text-xs text-gray-500 hover:text-orange-600"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          required
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
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  )
}
