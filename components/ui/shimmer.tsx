/**
 * Shimmer effect for skeleton loaders - Premium feel
 */
import { cn } from '@/lib/utils'

interface ShimmerProps {
  className?: string
  children?: React.ReactNode
}

export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <div className={cn('relative overflow-hidden bg-gray-200', className)}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  )
}

// Add to tailwind.config.ts:
// animation: {
//   shimmer: 'shimmer 2s infinite',
// },
// keyframes: {
//   shimmer: {
//     '100%': { transform: 'translateX(100%)' },
//   },
// },
