'use client'

import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'

export function OnlineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5">
      <WifiOff className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 text-sm">
        <p className="font-medium">You&apos;re offline</p>
        <p className="text-red-100 text-xs">Some features may be unavailable</p>
      </div>
    </div>
  )
}
