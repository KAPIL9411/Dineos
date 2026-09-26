'use client'

import { useActionState } from 'react'
import { resetPasswordAction } from '@/app/actions/auth'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2 } from 'lucide-react'

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, {})

  if (state.success) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">Check your email</h3>
        <p className="text-sm text-gray-500">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
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
            Sending link…
          </>
        ) : (
          'Send reset link'
        )}
      </Button>
    </form>
  )
}
