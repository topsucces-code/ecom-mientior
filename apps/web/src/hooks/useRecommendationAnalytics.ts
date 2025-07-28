import { useState, useEffect, useCallback } from 'react'
import { useRecommendationStore } from '../lib/recommendation-store'
import type { UserInteraction } from '@ecommerce/shared'

interface RecommendationMetrics {
  totalInteractions: number
  clickThroughRate: number
  conversionRate: number
  topReasons: { reason: string; count: number }[]
  topCategories: { category: string; count: number }[]
  engagementScore: number
  preferredAlgorithms: { algorithm: string; score: number }[]
}

interface AnalyticsTimeframe {
  start: Date
  end: Date
}

interface UseRecommendationAnalyticsConfig {
  userId: string
  timeframe?: AnalyticsTimeframe
  refreshInterval?: number // in minutes
}

export function useRecommendationAnalytics(config: UseRecommendationAnalyticsConfig) {
  const { userId, timeframe, refreshInterval = 10 } = config
  const { userInteractions } = useRecommendationStore()
  
  const [metrics, setMetrics] = useState<RecommendationMetrics>({
    totalInteractions: 0,
    clickThroughRate: 0,
    conversionRate: 0,
    topReasons: [],
    topCategories: [],
    engagementScore: 0,
    preferredAlgorithms: []
  })
  
  const [isCalculating, setIsCalculating] = useState(false)

  // Filter interactions by timeframe
  const getFilteredInteractions = useCallback(() => {
    let filtered = userInteractions

    if (timeframe) {
      filtered = userInteractions.filter(interaction => {
        const interactionDate = new Date(interaction.created_at)
        return interactionDate >= timeframe.start && interactionDate <= timeframe.end
      })
    }

    return filtered
  }, [userInteractions, timeframe])

  // Calculate recommendation metrics
  const calculateMetrics = useCallback(async () => {
    setIsCalculating(true)
    
    try {
      const interactions = getFilteredInteractions()
      
      // Basic metrics
      const totalInteractions = interactions.length
      
      // Group by interaction type
      const interactionsByType = interactions.reduce((acc, interaction) => {
        acc[interaction.interaction_type] = (acc[interaction.interaction_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const impressions = interactionsByType.impression || 0
      const clicks = interactionsByType.click || 0
      const purchases = interactionsByType.purchase || 0
      
      // Calculate rates
      const clickThroughRate = impressions > 0 ? (clicks / impressions) * 100 : 0
      const conversionRate = clicks > 0 ? (purchases / clicks) * 100 : 0
      
      // Extract recommendation reasons from interaction data
      const reasonCounts: Record<string, number> = {}
      const categoryCounts: Record<string, number> = {}
      const algorithmScores: Record<string, number> = {}
      
      interactions.forEach(interaction => {
        const data = interaction.interaction_data || {}
        
        // Count recommendation reasons
        if (data.recommendation_reason) {
          reasonCounts[data.recommendation_reason] = (reasonCounts[data.recommendation_reason] || 0) + 1
        }
        
        // Count categories
        if (data.category) {
          categoryCounts[data.category] = (categoryCounts[data.category] || 0) + 1
        }
        
        // Track algorithm performance
        if (data.algorithm && data.score) {
          if (!algorithmScores[data.algorithm]) {
            algorithmScores[data.algorithm] = 0
          }
          algorithmScores[data.algorithm] += parseFloat(data.score)
        }
      })
      
      // Sort and format top reasons
      const topReasons = Object.entries(reasonCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count }))
      
      // Sort and format top categories
      const topCategories = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }))
      
      // Calculate algorithm preferences
      const preferredAlgorithms = Object.entries(algorithmScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([algorithm, score]) => ({ algorithm, score: Math.round(score * 100) / 100 }))
      
      // Calculate engagement score (0-100)
      const engagementFactors = {
        interactionVariety: Object.keys(interactionsByType).length * 10,
        clickThroughRate: clickThroughRate,
        conversionRate: conversionRate * 2,
        recentActivity: totalInteractions > 0 ? Math.min(totalInteractions / 10, 30) : 0
      }
      
      const engagementScore = Math.min(
        Object.values(engagementFactors).reduce((sum, factor) => sum + factor, 0),
        100
      )
      
      setMetrics({
        totalInteractions,
        clickThroughRate: Math.round(clickThroughRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        topReasons,
        topCategories,
        engagementScore: Math.round(engagementScore),
        preferredAlgorithms
      })
      
    } catch (error) {
      console.error('Error calculating recommendation metrics:', error)
    } finally {
      setIsCalculating(false)
    }
  }, [getFilteredInteractions])

  // Auto-refresh metrics
  useEffect(() => {
    calculateMetrics()

    if (refreshInterval > 0) {
      const intervalId = setInterval(calculateMetrics, refreshInterval * 60 * 1000)
      return () => clearInterval(intervalId)
    }
  }, [calculateMetrics, refreshInterval])

  // Recalculate when interactions change
  useEffect(() => {
    calculateMetrics()
  }, [userInteractions, calculateMetrics])

  // Get recommendation effectiveness by algorithm
  const getAlgorithmEffectiveness = useCallback(() => {
    const interactions = getFilteredInteractions()
    const algorithmStats: Record<string, {
      impressions: number
      clicks: number
      purchases: number
      totalScore: number
      count: number
    }> = {}

    interactions.forEach(interaction => {
      const data = interaction.interaction_data || {}
      const algorithm = data.algorithm || 'unknown'
      
      if (!algorithmStats[algorithm]) {
        algorithmStats[algorithm] = {
          impressions: 0,
          clicks: 0,
          purchases: 0,
          totalScore: 0,
          count: 0
        }
      }
      
      const stats = algorithmStats[algorithm]
      
      switch (interaction.interaction_type) {
        case 'impression':
          stats.impressions += 1
          break
        case 'click':
          stats.clicks += 1
          break
        case 'purchase':
          stats.purchases += 1
          break
      }
      
      if (data.score) {
        stats.totalScore += parseFloat(data.score)
        stats.count += 1
      }
    })

    return Object.entries(algorithmStats).map(([algorithm, stats]) => ({
      algorithm,
      impressions: stats.impressions,
      clicks: stats.clicks,
      purchases: stats.purchases,
      clickThroughRate: stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0,
      conversionRate: stats.clicks > 0 ? (stats.purchases / stats.clicks) * 100 : 0,
      avgScore: stats.count > 0 ? stats.totalScore / stats.count : 0
    }))
  }, [getFilteredInteractions])

  // Get interaction timeline
  const getInteractionTimeline = useCallback((granularity: 'hour' | 'day' | 'week' = 'day') => {
    const interactions = getFilteredInteractions()
    const timeline: Record<string, number> = {}
    
    interactions.forEach(interaction => {
      const date = new Date(interaction.created_at)
      let key: string
      
      switch (granularity) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
          break
        case 'week':
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
          key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`
          break
        default: // day
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      }
      
      timeline[key] = (timeline[key] || 0) + 1
    })
    
    return Object.entries(timeline)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, count]) => ({ period, count }))
  }, [getFilteredInteractions])

  return {
    metrics,
    isCalculating,
    refreshMetrics: calculateMetrics,
    getAlgorithmEffectiveness,
    getInteractionTimeline
  }
}