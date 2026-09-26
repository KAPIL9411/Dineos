'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  fallback?: string
}

/**
 * Optimized image with blur-up effect like Swiggy/Zomato
 */
export function OptimizedImage({ 
  src, 
  alt, 
  className,
  fallback = '/placeholder-food.png',
  ...props 
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <div className="relative overflow-hidden bg-gray-100">
      <Image
        src={error ? fallback : src}
        alt={alt}
        className={cn(
          'duration-700 ease-in-out',
          isLoading ? 'scale-105 blur-sm' : 'scale-100 blur-0',
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true)
          setIsLoading(false)
        }}
        {...props}
      />
      
      {/* Loading shimmer overlay */}
      {isLoading && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      )}
    </div>
  )
}
