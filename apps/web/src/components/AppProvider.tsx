'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '../lib/service-worker'
import { performanceMonitor } from '../lib/performance'
import { AuthProvider } from '../providers/AuthProvider'

interface AppProviderProps {
  children: React.ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  useEffect(() => {
    // Register service worker
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker()
    }

    // Initialize performance monitoring
    performanceMonitor.getWebVitals()

    // Log initial performance metrics
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        console.log('=== Performance Metrics ===')
        console.log(performanceMonitor.getMetrics())
      }, 1000)
    }
  }, [])

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}