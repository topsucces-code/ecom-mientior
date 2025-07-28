'use client'

import { useState, useEffect, useCallback } from 'react'
import { DealService, type DealOfTheDay, type DealStats } from '@ecommerce/shared/src/services/dealService'

interface UseDealsResult {
  deals: DealOfTheDay[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useActiveDeals(limit: number = 10): UseDealsResult {
  const [deals, setDeals] = useState<DealOfTheDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await DealService.getActiveDeals(limit)

      if (result.error) {
        setError(result.error)
        return
      }

      setDeals(result.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [limit])

  const refetch = useCallback(() => {
    return fetchDeals()
  }, [fetchDeals])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  return {
    deals,
    loading,
    error,
    refetch
  }
}

interface UseTodaysDealResult {
  deal: DealOfTheDay | null
  loading: boolean
  error: Error | null
  timeRemaining: {
    hours: number
    minutes: number
    seconds: number
    expired: boolean
  }
  refetch: () => Promise<void>
}

export function useTodaysDeal(): UseTodaysDealResult {
  const [deal, setDeal] = useState<DealOfTheDay | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  })

  const fetchDeal = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await DealService.getTodaysDeal()

      if (result.error) {
        setError(result.error)
        return
      }

      setDeal(result.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(() => {
    return fetchDeal()
  }, [fetchDeal])

  // Update countdown every second
  useEffect(() => {
    if (!deal) return

    const updateCountdown = () => {
      const remaining = DealService.getTimeRemaining(deal.ends_at)
      setTimeRemaining(remaining)
    }

    // Update immediately
    updateCountdown()

    // Then update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [deal])

  useEffect(() => {
    fetchDeal()
  }, [fetchDeal])

  return {
    deal,
    loading,
    error,
    timeRemaining,
    refetch
  }
}

interface UseDealsByCategoryResult {
  deals: DealOfTheDay[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useDealsByCategory(categoryId: string, limit: number = 6): UseDealsByCategoryResult {
  const [deals, setDeals] = useState<DealOfTheDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchDeals = useCallback(async () => {
    if (!categoryId) {
      setDeals([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await DealService.getDealsByCategory(categoryId, limit)

      if (result.error) {
        setError(result.error)
        return
      }

      setDeals(result.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [categoryId, limit])

  const refetch = useCallback(() => {
    return fetchDeals()
  }, [fetchDeals])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  return {
    deals,
    loading,
    error,
    refetch
  }
}

interface UseProductDealResult {
  deal: DealOfTheDay | null
  loading: boolean
  error: Error | null
  isOnDeal: boolean
  refetch: () => Promise<void>
}

export function useProductDeal(productId: string | null): UseProductDealResult {
  const [deal, setDeal] = useState<DealOfTheDay | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchDeal = useCallback(async () => {
    if (!productId) {
      setDeal(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await DealService.isProductOnDeal(productId)

      if (result.error) {
        setError(result.error)
        return
      }

      setDeal(result.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [productId])

  const refetch = useCallback(() => {
    return fetchDeal()
  }, [fetchDeal])

  useEffect(() => {
    fetchDeal()
  }, [fetchDeal])

  return {
    deal,
    loading,
    error,
    isOnDeal: deal !== null,
    refetch
  }
}

interface UseDealStatsResult {
  stats: DealStats | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useDealStats(): UseDealStatsResult {
  const [stats, setStats] = useState<DealStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await DealService.getDealStats()

      if (result.error) {
        setError(result.error)
        return
      }

      setStats(result.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(() => {
    return fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch
  }
}