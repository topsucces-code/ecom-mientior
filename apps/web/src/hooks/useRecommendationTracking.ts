import { useCallback } from 'react'
import { useRecommendationStore } from '../lib/recommendation-store'
import { useRouter } from 'next/navigation'
import type { UserInteraction } from '@ecommerce/shared'

interface TrackingContext {
  source?: string
  section?: string
  algorithm?: string
  score?: number
  position?: number
  search_query?: string
  category?: string
  [key: string]: any
}

export function useRecommendationTracking() {
  const { trackInteraction } = useRecommendationStore()
  const router = useRouter()

  const trackProductView = useCallback(async (
    productId: string, 
    context: TrackingContext = {}
  ) => {
    await trackInteraction(productId, 'view', {
      timestamp: Date.now(),
      page_url: window.location.pathname,
      ...context
    })
  }, [trackInteraction])

  const trackProductClick = useCallback(async (
    productId: string, 
    context: TrackingContext = {}
  ) => {
    await trackInteraction(productId, 'click', {
      timestamp: Date.now(),
      page_url: window.location.pathname,
      ...context
    })
  }, [trackInteraction])

  const trackAddToCart = useCallback(async (
    productId: string, 
    quantity: number = 1,
    context: TrackingContext = {}
  ) => {
    await trackInteraction(productId, 'cart', {
      quantity,
      timestamp: Date.now(),
      page_url: window.location.pathname,
      ...context
    })
  }, [trackInteraction])

  const trackAddToWishlist = useCallback(async (
    productId: string, 
    context: TrackingContext = {}
  ) => {
    await trackInteraction(productId, 'wishlist', {
      timestamp: Date.now(),
      page_url: window.location.pathname,
      ...context
    })
  }, [trackInteraction])

  const trackPurchase = useCallback(async (
    productId: string, 
    orderValue: number,
    quantity: number = 1,
    context: TrackingContext = {}
  ) => {
    await trackInteraction(productId, 'purchase', {
      order_value: orderValue,
      quantity,
      timestamp: Date.now(),
      page_url: window.location.pathname,
      ...context
    })
  }, [trackInteraction])

  const trackSearch = useCallback(async (
    query: string,
    resultsCount: number,
    context: TrackingContext = {}
  ) => {
    // Track search as a special interaction type
    await trackInteraction('search', 'search' as UserInteraction['interaction_type'], {
      search_query: query,
      results_count: resultsCount,
      timestamp: Date.now(),
      page_url: window.location.pathname,
      ...context
    })
  }, [trackInteraction])

  const trackRecommendationImpression = useCallback(async (
    productIds: string[],
    context: TrackingContext = {}
  ) => {
    // Track multiple product impressions
    await Promise.all(
      productIds.map((productId, index) =>
        trackInteraction(productId, 'impression', {
          position: index,
          total_shown: productIds.length,
          timestamp: Date.now(),
          page_url: window.location.pathname,
          ...context
        })
      )
    )
  }, [trackInteraction])

  const trackRecommendationClick = useCallback(async (
    productId: string,
    position: number,
    totalShown: number,
    context: TrackingContext = {}
  ) => {
    await trackInteraction(productId, 'click', {
      position,
      total_shown: totalShown,
      click_through_rate: 1 / totalShown,
      timestamp: Date.now(),
      page_url: window.location.pathname,
      ...context
    })
  }, [trackInteraction])

  const navigateToProduct = useCallback(async (
    productId: string,
    context: TrackingContext = {}
  ) => {
    await trackProductClick(productId, context)
    router.push(`/products/${productId}`)
  }, [trackProductClick, router])

  const trackCategoryView = useCallback(async (
    categoryName: string,
    context: TrackingContext = {}
  ) => {
    await trackInteraction('category', 'view' as UserInteraction['interaction_type'], {
      category: categoryName,
      timestamp: Date.now(),
      page_url: window.location.pathname,
      ...context
    })
  }, [trackInteraction])

  const trackFilterApplied = useCallback(async (
    filterType: string,
    filterValue: string,
    context: TrackingContext = {}
  ) => {
    await trackInteraction('filter', 'filter' as UserInteraction['interaction_type'], {
      filter_type: filterType,
      filter_value: filterValue,
      timestamp: Date.now(),
      page_url: window.location.pathname,
      ...context
    })
  }, [trackInteraction])

  return {
    // Product interactions
    trackProductView,
    trackProductClick,
    trackAddToCart,
    trackAddToWishlist,
    trackPurchase,
    
    // Recommendation specific
    trackRecommendationImpression,
    trackRecommendationClick,
    
    // Navigation
    navigateToProduct,
    
    // Discovery interactions
    trackSearch,
    trackCategoryView,
    trackFilterApplied
  }
}