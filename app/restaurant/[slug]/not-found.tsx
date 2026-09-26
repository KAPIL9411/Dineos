import Link from 'next/link'
import { UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RestaurantNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <UtensilsCrossed className="w-12 h-12 text-gray-300 mb-4" />
      <h1 className="text-lg font-semibold text-gray-900">Restaurant not found</h1>
      <p className="text-sm text-gray-500 mt-1">
        The link you used may be outdated or the restaurant is no longer available.
      </p>
      <Link href="/" className="mt-4">
        <Button variant="outline" size="sm">Go home</Button>
      </Link>
    </div>
  )
}
