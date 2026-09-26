'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ChevronRight, Store, Palette, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveOnboardingStep1, saveOnboardingStep2 } from './actions'

// ─── Step 1 schema — basic info ───────────────────────────────────────────────

const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
  description: z.string().max(500).trim(),
  phone: z.string().max(20).trim(),
  city: z.string().max(100).trim(),
})

type Step1Values = z.infer<typeof step1Schema>

// ─── Step 2 schema — branding ─────────────────────────────────────────────────

const step2Schema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Pick a valid hex color'),
})

type Step2Values = z.infer<typeof step2Schema>

// ─── Component ────────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
  restaurantId: string
  defaultSlug: string
}

const STEPS = [
  { label: 'Basic info', icon: Store },
  { label: 'Branding', icon: Palette },
  { label: 'Done', icon: CheckCircle2 },
]

const PRESET_COLORS = [
  '#FF6B35', '#E63946', '#2A9D8F', '#457B9D',
  '#6A0572', '#F4A261', '#2DC653', '#1D3557',
]

export function OnboardingWizard({ restaurantId, defaultSlug }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { name: '', slug: defaultSlug, description: '', phone: '', city: '' },
  })

  // Step 2 form
  const form2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { primaryColor: '#FF6B35' },
  })

  const selectedColor = form2.watch('primaryColor')

  function handleStep1Submit(values: Step1Values) {
    startTransition(async () => {
      const result = await saveOnboardingStep1(restaurantId, values)
      if (result.error) {
        toast.error(result.error)
        if (result.field) form1.setError(result.field as keyof Step1Values, { message: result.error })
        return
      }
      setStep(1)
    })
  }

  function handleStep2Submit(values: Step2Values) {
    startTransition(async () => {
      const result = await saveOnboardingStep2(restaurantId, values)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setStep(2)
    })
  }

  function handleFinish() {
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Step indicator */}
      <div className="flex border-b border-gray-100">
        {STEPS.map(({ label, icon: Icon }, i) => (
          <div
            key={label}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
              i === step
                ? 'text-orange-600 border-b-2 border-orange-500'
                : i < step
                  ? 'text-green-600'
                  : 'text-gray-400'
            }`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {label}
          </div>
        ))}
      </div>

      <div className="p-6">
        {/* Step 0 — Basic Info */}
        {step === 0 && (
          <form onSubmit={form1.handleSubmit(handleStep1Submit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Restaurant name *</Label>
              <Input id="name" {...form1.register('name')} className="mt-1" placeholder="e.g. Chai Point Bandra" />
              {form1.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">{form1.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="slug">URL slug *</Label>
              <div className="flex items-center mt-1">
                <span className="px-3 py-2 bg-gray-50 border border-r-0 border-gray-200 rounded-l-md text-sm text-gray-400">
                  tableorder.app/r/
                </span>
                <Input
                  id="slug"
                  {...form1.register('slug')}
                  className="rounded-l-none"
                  placeholder="chai-point-bandra"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Only lowercase letters, numbers and hyphens</p>
              {form1.formState.errors.slug && (
                <p className="text-sm text-red-600 mt-1">{form1.formState.errors.slug.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form1.register('description')}
                className="mt-1"
                rows={3}
                placeholder="A short description shown to customers"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form1.register('phone')} className="mt-1" placeholder="98765 43210" />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" {...form1.register('city')} className="mt-1" placeholder="Mumbai" />
              </div>
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        )}

        {/* Step 1 — Branding */}
        {step === 1 && (
          <form onSubmit={form2.handleSubmit(handleStep2Submit)} className="space-y-5">
            <div>
              <Label>Brand colour</Label>
              <p className="text-xs text-gray-400 mt-0.5 mb-3">
                Used on your customer menu page as the primary colour.
              </p>

              {/* Preset swatches */}
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => form2.setValue('primaryColor', color)}
                    className={`w-9 h-9 rounded-lg border-2 transition-transform hover:scale-110 ${
                      selectedColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select colour ${color}`}
                    aria-pressed={selectedColor === color}
                  />
                ))}
              </div>

              {/* Custom hex */}
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-lg border border-gray-200 shrink-0"
                  style={{ backgroundColor: selectedColor }}
                  aria-hidden="true"
                />
                <Input
                  {...form2.register('primaryColor')}
                  placeholder="#FF6B35"
                  className="font-mono text-sm"
                  maxLength={7}
                />
              </div>
              {form2.formState.errors.primaryColor && (
                <p className="text-sm text-red-600 mt-1">{form2.formState.errors.primaryColor.message}</p>
              )}
            </div>

            {/* Preview strip */}
            <div
              className="rounded-xl p-4 text-white text-center text-sm font-medium"
              style={{ backgroundColor: selectedColor }}
            >
              Preview — this is your brand colour
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save & continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        )}

        {/* Step 2 — Done */}
        {step === 2 && (
          <div className="text-center py-6">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">You&apos;re all set!</h2>
            <p className="text-sm text-gray-500 mb-6">
              Next step: add your menu categories and products, then set up tables and QR codes.
            </p>
            <Button onClick={handleFinish} className="w-full">
              Go to dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
