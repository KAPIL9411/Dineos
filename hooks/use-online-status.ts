'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot() {
  return navigator.onLine
}

function getServerSnapshot() {
  return true
}

export function useOnlineStatus() {
  // Use useSyncExternalStore for proper external state subscription
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
