import { useEffect, useState, useMemo } from 'react'
import { useRecommendationStore } from '../lib/recommendation-store'
import type { ProductRecommendation, Product } from '@ecommerce/shared'

interface PersonalizedContentConfig {
  userId: string
  autoRefresh?: boolean
  refreshInterval?: number // in minutes
  enableFallback?: boolean
}

interface PersonalizedContent {
  forYou: ProductRecommendation[]
  trending: ProductRecommendation[]
  becauseYouViewed: ProductRecommendation[]
  similarToCart: ProductRecommendation[]
  trendingInCategories: ProductRecommendation[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => Promise<void>
}

export function usePersonalizedContent(config: PersonalizedContentConfig): PersonalizedContent {
  const {
    userId,
    autoRefresh = true,
    refreshInterval = 30, // 30 minutes default
    enableFallback = true
  } = config

  const {
    personalizedRecommendations,
    trendingProducts,
    getPersonalizedRecommendations,
    getTrendingProducts,
    loading,
    error
  } = useRecommendationStore()

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Manual refresh function
  const refresh = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await Promise.all([
        getPersonalizedRecommendations(userId),
        getTrendingProducts()
      ])
      setLastUpdated(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }

  // Initial load and auto-refresh setup
  useEffect(() => {
    const loadInitialContent = async () => {
      if (!personalizedRecommendations || !lastUpdated) {
        await refresh()
      }
    }

    loadInitialContent()

    // Set up auto-refresh interval
    if (autoRefresh && refreshInterval > 0) {
      const intervalId = setInterval(() => {
        refresh()
      }, refreshInterval * 60 * 1000) // Convert minutes to milliseconds

      return () => clearInterval(intervalId)
    }
  }, [userId, autoRefresh, refreshInterval])

  // Check if content is stale
  const isContentStale = useMemo(() => {
    if (!lastUpdated) return true
    const staleThreshold = refreshInterval * 60 * 1000 // Convert to milliseconds
    return Date.now() - lastUpdated.getTime() > staleThreshold
  }, [lastUpdated, refreshInterval])

  // Extract personalized content sections
  const content = useMemo(() => {
    const forYou = personalizedRecommendations?.for_you || []
    const becauseYouViewed = personalizedRecommendations?.because_you_viewed || []
    const similarToCart = personalizedRecommendations?.similar_to_cart || []
    const trendingInCategories = personalizedRecommendations?.trending_in_categories || []
    
    // Use trending products as fallback if personalized content is empty
    const trending = trendingProducts?.length > 0 ? trendingProducts : []

    // Fallback logic
    let fallbackContent: ProductRecommendation[] = []
    if (enableFallback && forYou.length === 0 && trending.length > 0) {
      fallbackContent = trending.slice(0, 10).map(item => ({
        ...item,
        reason: 'Popular product',
        algorithm_used: 'trending_fallback'
      }))
    }

    return {
      forYou: forYou.length > 0 ? forYou : fallbackContent,
      becauseYouViewed,
      similarToCart,
      trendingInCategories,
      trending
    }
  }, [personalizedRecommendations, trendingProducts, enableFallback])

  return {
    forYou: content.forYou,
    trending: content.trending,
    becauseYouViewed: content.becauseYouViewed,
    similarToCart: content.similarToCart,
    trendingInCategories: content.trendingInCategories,
    isLoading: loading || isRefreshing,
    error,
    lastUpdated,
    refresh
  }
}