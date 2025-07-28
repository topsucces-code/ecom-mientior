'use client'

import { useCallback, useEffect, useState } from 'react'
import { PlatformMetrics, RealtimeMetrics, AnalyticsFilters, platformAnalyticsService } from '../lib/platform-analytics'

interface AnalyticsState {
  platformMetrics: PlatformMetrics | null
  realtimeMetrics: RealtimeMetrics | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export const useAnalytics = (filters?: AnalyticsFilters) => {
  const [state, setState] = useState<AnalyticsState>({
    platformMetrics: null,
    realtimeMetrics: null,
    loading: false,
    error: null,
    lastUpdated: null,
  })

  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(false)

  const loadPlatformMetrics = useCallback(async (customFilters?: AnalyticsFilters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const defaultFilters: AnalyticsFilters = {
        date_range: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString(),
        },
        comparison_period: 'previous_period',
      }

      const finalFilters = customFilters || filters || defaultFilters
      const metrics = await platformAnalyticsService.getPlatformMetrics(finalFilters)
      
      setState(prev => ({
        ...prev,
        platformMetrics: metrics,
        loading: false,
        lastUpdated: new Date(),
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load analytics data',
      }))
    }
  }, [filters])

  const loadRealtimeMetrics = useCallback(async () => {
    try {
      const metrics = await platformAnalyticsService.getRealtimeMetrics()
      setState(prev => ({
        ...prev,
        realtimeMetrics: metrics,
      }))
    } catch (error) {
      console.error('Failed to load realtime metrics:', error)
    }
  }, [])

  const trackEvent = useCallback(async (event: {
    name: string
    properties: Record<string, any>
    user_id?: string
    session_id?: string
  }) => {
    try {
      // In a real implementation, this would send events to an analytics service
      console.log('Tracking event:', event)
      
      // Example: Send to analytics service
      // await analyticsService.track(event)
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }, [])

  const trackPageView = useCallback(async (page: {
    path: string
    title: string
    user_id?: string
    session_id?: string
    referrer?: string
  }) => {
    await trackEvent({
      name: 'page_view',
      properties: page,
    })
  }, [trackEvent])

  const trackPurchase = useCallback(async (purchase: {
    order_id: string
    amount: number
    currency: string
    items: Array<{
      product_id: string
      product_name: string
      category: string
      price: number
      quantity: number
    }>
    user_id?: string
  }) => {
    await trackEvent({
      name: 'purchase',
      properties: purchase,
      user_id: purchase.user_id,
    })
  }, [trackEvent])

  const trackProductView = useCallback(async (product: {
    product_id: string
    product_name: string
    category: string
    price: number
    user_id?: string
  }) => {
    await trackEvent({
      name: 'product_view',
      properties: product,
      user_id: product.user_id,
    })
  }, [trackEvent])

  const trackCartAction = useCallback(async (action: {
    type: 'add_to_cart' | 'remove_from_cart' | 'view_cart' | 'begin_checkout'
    product_id?: string
    product_name?: string
    price?: number
    quantity?: number
    cart_total?: number
    user_id?: string
  }) => {
    await trackEvent({
      name: action.type,
      properties: action,
      user_id: action.user_id,
    })
  }, [trackEvent])

  const trackUserAction = useCallback(async (action: {
    type: 'signup' | 'login' | 'logout' | 'profile_update' | 'search'
    user_id?: string
    properties?: Record<string, any>
  }) => {
    await trackEvent({
      name: action.type,
      properties: action.properties || {},
      user_id: action.user_id,
    })
  }, [trackEvent])

  const exportData = useCallback(async (format: 'csv' | 'excel' | 'pdf', customFilters?: AnalyticsFilters) => {
    try {
      const finalFilters = customFilters || filters || {
        date_range: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString(),
        },
      }

      const result = await platformAnalyticsService.exportAnalyticsData(format, finalFilters)
      
      // In a real implementation, this would trigger a download
      window.open(result.download_url, '_blank')
      
      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to export data')
    }
  }, [filters])

  const generateCustomReport = useCallback(async (config: {
    metrics: string[]
    dimensions: string[]
    filters: AnalyticsFilters
    visualization: 'table' | 'chart' | 'graph'
  }) => {
    try {
      return await platformAnalyticsService.getCustomReport(config)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to generate report')
    }
  }, [])

  const getPerformanceInsights = useCallback(async () => {
    try {
      return await platformAnalyticsService.getPerformanceInsights()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get insights')
    }
  }, [])

  // Real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    if (isRealtimeEnabled) {
      unsubscribe = platformAnalyticsService.subscribeToRealtimeUpdates((metrics) => {
        setState(prev => ({
          ...prev,
          realtimeMetrics: metrics,
        }))
      })
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [isRealtimeEnabled])

  // Load initial data
  useEffect(() => {
    loadPlatformMetrics()
    loadRealtimeMetrics()
  }, [loadPlatformMetrics, loadRealtimeMetrics])

  return {
    // State
    platformMetrics: state.platformMetrics,
    realtimeMetrics: state.realtimeMetrics,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    isRealtimeEnabled,

    // Actions
    loadPlatformMetrics,
    loadRealtimeMetrics,
    setIsRealtimeEnabled,
    exportData,
    generateCustomReport,
    getPerformanceInsights,

    // Event tracking
    trackEvent,
    trackPageView,
    trackPurchase,
    trackProductView,
    trackCartAction,
    trackUserAction,

    // Utility
    refresh: () => {
      loadPlatformMetrics()
      loadRealtimeMetrics()
    },
  }
}

// Specialized hooks for different use cases
export const useRealtimeMetrics = () => {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const connect = () => {
      setIsConnected(true)
      unsubscribe = platformAnalyticsService.subscribeToRealtimeUpdates((data) => {
        setMetrics(data)
      })
    }

    connect()

    return () => {
      setIsConnected(false)
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return {
    metrics,
    isConnected,
    refresh: async () => {
      const data = await platformAnalyticsService.getRealtimeMetrics()
      setMetrics(data)
    },
  }
}

export const useEventTracking = () => {
  const { trackEvent, trackPageView, trackPurchase, trackProductView, trackCartAction, trackUserAction } = useAnalytics()

  return {
    trackEvent,
    trackPageView,
    trackPurchase,
    trackProductView,
    trackCartAction,
    trackUserAction,
  }
}