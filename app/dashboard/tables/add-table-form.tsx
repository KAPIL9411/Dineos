'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTable } from '@/app/actions/tables'

export function AddTableForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState(createTable, {})

  useEffect(() => {
    if (state.table) {
      router.refresh()
    }
  }, [state.table, router])

  return (
    <form action={action} className="space-y-3">
      <div>
        <Label htmlFor="table-name">Table name / number *</Label>
        <Input
          id="table-name"
          name="name"
          required
          className="mt-1"
          placeholder="e.g. Table 1, Window Seat A"
        />
      </div>
      <div>
        <Label htmlFor="table-capacity">Seating capacity</Label>
        <Input
          id="table-capacity"
          name="capacity"
          type="number"
          min="1"
          max="50"
          defaultValue="4"
          className="mt-1"
        />
      </div>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Add table
      </Button>
    </form>
  )
}
