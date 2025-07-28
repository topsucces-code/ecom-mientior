import { supabase } from '@ecommerce/shared'
import type { 
  Product,
  UserInteraction,
  ProductSimilarity,
  RecommendationConfig,
  ProductRecommendation,
  RecommendationResponse,
  TrendingProduct,
  PersonalizedRecommendations
} from '@ecommerce/shared'

export class RecommendationEngine {
  private cache: Map<string, { data: any; expires: number }> = new Map()
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes

  // Track user interactions
  async trackInteraction(
    userId: string,
    productId: string,
    interactionType: UserInteraction['interaction_type'],
    interactionData?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('user_interactions').insert({
        user_id: userId,
        product_id: productId,
        interaction_type: interactionType,
        interaction_data: interactionData
      })

      // Update user preferences asynchronously
      this.updateUserPreferences(userId).catch(console.error)
    } catch (error) {
      console.error('Error tracking interaction:', error)
    }
  }

  // Generate collaborative filtering recommendations
  async getCollaborativeRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      // Find users with similar behavior
      const { data: userInteractions } = await supabase
        .from('user_interactions')
        .select('product_id, interaction_type')
        .eq('user_id', userId)
        .in('interaction_type', ['purchase', 'cart', 'wishlist'])

      if (!userInteractions || userInteractions.length === 0) {
        return []
      }

      const userProductIds = userInteractions.map(i => i.product_id)

      // Find similar users who interacted with the same products
      const { data: similarUsers } = await supabase
        .from('user_interactions')
        .select('user_id, product_id, interaction_type')
        .in('product_id', userProductIds)
        .neq('user_id', userId)
        .in('interaction_type', ['purchase', 'cart', 'wishlist'])

      if (!similarUsers || similarUsers.length === 0) {
        return []
      }

      // Calculate user similarity scores
      const userSimilarity: Record<string, number> = {}
      
      similarUsers.forEach(interaction => {
        if (!userSimilarity[interaction.user_id]) {
          userSimilarity[interaction.user_id] = 0
        }
        
        // Weight different interactions differently
        const weight = {
          purchase: 3,
          cart: 2,
          wishlist: 1
        }[interaction.interaction_type] || 1
        
        userSimilarity[interaction.user_id] += weight
      })

      // Get recommendations from similar users
      const topSimilarUsers = Object.entries(userSimilarity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([userId]) => userId)

      const { data: recommendations } = await supabase
        .from('user_interactions')
        .select(`
          product_id,
          interaction_type,
          products!inner(
            id, name, price, category, brand, inventory_quantity
          )
        `)
        .in('user_id', topSimilarUsers)
        .not('product_id', 'in', `(${userProductIds.join(',')})`)
        .in('interaction_type', ['purchase', 'cart'])
        .gt('products.inventory_quantity', 0)

      if (!recommendations) return []

      // Score products based on similar user interactions
      const productScores: Record<string, number> = {}
      const productData: Record<string, any> = {}

      recommendations.forEach(rec => {
        if (!productScores[rec.product_id]) {
          productScores[rec.product_id] = 0
          productData[rec.product_id] = rec.products
        }
        
        const weight = rec.interaction_type === 'purchase' ? 2 : 1
        productScores[rec.product_id] += weight
      })

      return Object.entries(productScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([productId, score]) => ({
          product_id: productId,
          score: Math.min(score / 10, 1), // Normalize score
          reason: 'Customers like you also bought this',
          algorithm_used: 'collaborative',
          explanation: `Recommended based on similar customer preferences`
        }))

    } catch (error) {
      console.error('Error getting collaborative recommendations:', error)
      return []
    }
  }

  // Generate content-based recommendations
  async getContentBasedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      // Get user's interaction history
      const { data: userHistory } = await supabase
        .from('user_interactions')
        .select(`
          product_id,
          interaction_type,
          products!inner(category, brand, tags, price)
        `)
        .eq('user_id', userId)
        .in('interaction_type', ['view', 'cart', 'purchase', 'wishlist'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (!userHistory || userHistory.length === 0) {
        return []
      }

      // Analyze user preferences
      const categoryScores: Record<string, number> = {}
      const brandScores: Record<string, number> = {}
      const tagScores: Record<string, number> = {}
      const priceRanges: number[] = []

      userHistory.forEach(item => {
        const product = item.products
        const weight = {
          purchase: 3,
          cart: 2,
          wishlist: 2,
          view: 1
        }[item.interaction_type] || 1

        // Category preferences
        if (product.category) {
          categoryScores[product.category] = (categoryScores[product.category] || 0) + weight
        }

        // Brand preferences
        if (product.brand) {
          brandScores[product.brand] = (brandScores[product.brand] || 0) + weight
        }

        // Tag preferences
        if (product.tags && Array.isArray(product.tags)) {
          product.tags.forEach((tag: string) => {
            tagScores[tag] = (tagScores[tag] || 0) + weight
          })
        }

        // Price range
        priceRanges.push(product.price)
      })

      // Calculate preferred price range
      priceRanges.sort((a, b) => a - b)
      const minPrice = priceRanges[Math.floor(priceRanges.length * 0.25)] || 0
      const maxPrice = priceRanges[Math.floor(priceRanges.length * 0.75)] || 1000

      // Get products matching user preferences
      const preferredCategories = Object.keys(categoryScores).slice(0, 5)
      const preferredBrands = Object.keys(brandScores).slice(0, 5)
      const viewedProductIds = userHistory.map(item => item.product_id)

      const { data: candidateProducts } = await supabase
        .from('products')
        .select('id, name, category, brand, tags, price')
        .or(`category.in.(${preferredCategories.join(',')}),brand.in.(${preferredBrands.join(',')})`)
        .gte('price', minPrice * 0.8)
        .lte('price', maxPrice * 1.2)
        .gt('inventory_quantity', 0)
        .not('id', 'in', `(${viewedProductIds.join(',')})`)
        .limit(100)

      if (!candidateProducts) return []

      // Score products based on content similarity
      const recommendations: ProductRecommendation[] = candidateProducts
        .map(product => {
          let score = 0
          let reasons: string[] = []

          // Category match
          if (product.category && categoryScores[product.category]) {
            score += (categoryScores[product.category] / Math.max(...Object.values(categoryScores))) * 0.4
            reasons.push(`same category: ${product.category}`)
          }

          // Brand match
          if (product.brand && brandScores[product.brand]) {
            score += (brandScores[product.brand] / Math.max(...Object.values(brandScores))) * 0.3
            reasons.push(`preferred brand: ${product.brand}`)
          }

          // Tag matches
          if (product.tags && Array.isArray(product.tags)) {
            const tagScore = product.tags.reduce((sum: number, tag: string) => {
              return sum + (tagScores[tag] || 0)
            }, 0)
            
            if (tagScore > 0) {
              score += (tagScore / Math.max(...Object.values(tagScores))) * 0.2
              reasons.push('similar features')
            }
          }

          // Price range match
          if (product.price >= minPrice && product.price <= maxPrice) {
            score += 0.1
            reasons.push('in your price range')
          }

          return {
            product_id: product.id,
            score: Math.min(score, 1),
            reason: reasons.length > 0 ? `Because you like ${reasons.join(', ')}` : 'Recommended for you',
            algorithm_used: 'content',
            explanation: `Based on your browsing and purchase history`
          }
        })
        .filter(rec => rec.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      return recommendations

    } catch (error) {
      console.error('Error getting content-based recommendations:', error)
      return []
    }
  }

  // Get trending products
  async getTrendingRecommendations(
    limit: number = 10,
    category?: string,
    timePeriod: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<ProductRecommendation[]> {
    try {
      const cacheKey = `trending_${category || 'all'}_${timePeriod}_${limit}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      // Calculate time threshold
      const timeThresholds = {
        '1h': new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        '24h': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }

      // Get interaction counts for trending calculation
      let query = supabase
        .from('user_interactions')
        .select(`
          product_id,
          interaction_type,
          products!inner(id, name, category, brand, inventory_quantity)
        `)
        .gte('created_at', timeThresholds[timePeriod])
        .gt('products.inventory_quantity', 0)

      if (category) {
        query = query.eq('products.category', category)
      }

      const { data: interactions } = await query

      if (!interactions || interactions.length === 0) {
        return []
      }

      // Calculate trending scores
      const productScores: Record<string, {
        views: number
        carts: number
        purchases: number
        total: number
      }> = {}

      interactions.forEach(interaction => {
        if (!productScores[interaction.product_id]) {
          productScores[interaction.product_id] = {
            views: 0,
            carts: 0,
            purchases: 0,
            total: 0
          }
        }

        const scores = productScores[interaction.product_id]
        
        switch (interaction.interaction_type) {
          case 'view':
            scores.views += 1
            scores.total += 1
            break
          case 'cart':
            scores.carts += 2
            scores.total += 2
            break
          case 'purchase':
            scores.purchases += 3
            scores.total += 3
            break
          default:
            scores.total += 1
        }
      })

      // Calculate trending score with momentum
      const recommendations: ProductRecommendation[] = Object.entries(productScores)
        .map(([productId, scores]) => {
          // Weight recent activity more heavily
          const trendingScore = (
            scores.views * 1 +
            scores.carts * 2 +
            scores.purchases * 3
          ) * (timePeriod === '1h' ? 2 : timePeriod === '24h' ? 1.5 : 1)

          return {
            product_id: productId,
            score: Math.min(trendingScore / 100, 1), // Normalize
            reason: `Trending now - ${scores.total} recent interactions`,
            algorithm_used: 'trending',
            explanation: `Popular with customers in the last ${timePeriod}`
          }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      this.setCache(cacheKey, recommendations)
      return recommendations

    } catch (error) {
      console.error('Error getting trending recommendations:', error)
      return []
    }
  }

  // Get similar products
  async getSimilarProducts(
    productId: string,
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      const cacheKey = `similar_${productId}_${limit}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      // Get the source product
      const { data: sourceProduct } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (!sourceProduct) return []

      // Find similar products based on multiple factors
      const { data: similarProducts } = await supabase
        .from('products')
        .select('id, name, category, brand, tags, price')
        .neq('id', productId)
        .gt('inventory_quantity', 0)
        .limit(100)

      if (!similarProducts) return []

      const recommendations: ProductRecommendation[] = similarProducts
        .map(product => {
          let score = 0
          let reasons: string[] = []

          // Category match (high weight)
          if (product.category === sourceProduct.category) {
            score += 0.4
            reasons.push('same category')
          }

          // Brand match (medium weight)
          if (product.brand === sourceProduct.brand) {
            score += 0.3
            reasons.push('same brand')
          }

          // Price similarity (medium weight)
          const priceDiff = Math.abs(product.price - sourceProduct.price) / sourceProduct.price
          if (priceDiff < 0.5) {
            score += 0.2 * (1 - priceDiff * 2)
            reasons.push('similar price')
          }

          // Tag similarity (low weight)
          if (product.tags && sourceProduct.tags) {
            const productTags = new Set(Array.isArray(product.tags) ? product.tags : [])
            const sourceTags = new Set(Array.isArray(sourceProduct.tags) ? sourceProduct.tags : [])
            const intersection = new Set([...productTags].filter(tag => sourceTags.has(tag)))
            const union = new Set([...productTags, ...sourceTags])
            
            if (union.size > 0) {
              const similarity = intersection.size / union.size
              score += similarity * 0.1
              if (similarity > 0.3) {
                reasons.push('similar features')
              }
            }
          }

          return {
            product_id: product.id,
            score,
            reason: reasons.length > 0 ? `Similar product: ${reasons.join(', ')}` : 'Similar product',
            algorithm_used: 'similarity',
            explanation: 'Customers who viewed this item also viewed'
          }
        })
        .filter(rec => rec.score > 0.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      this.setCache(cacheKey, recommendations)
      return recommendations

    } catch (error) {
      console.error('Error getting similar products:', error)
      return []
    }
  }

  // Generate hybrid recommendations combining multiple algorithms
  async getHybridRecommendations(
    userId: string,
    config: RecommendationConfig = {}
  ): Promise<RecommendationResponse> {
    try {
      const {
        weights = {
          collaborative: 0.3,
          content: 0.3,
          trending: 0.2,
          similarity: 0.2
        },
        limit = 20,
        filters = {}
      } = config

      const recommendations: ProductRecommendation[] = []

      // Get recommendations from different algorithms
      const [collaborative, content, trending] = await Promise.all([
        weights.collaborative ? this.getCollaborativeRecommendations(userId, Math.ceil(limit * 0.4)) : [],
        weights.content ? this.getContentBasedRecommendations(userId, Math.ceil(limit * 0.4)) : [],
        weights.trending ? this.getTrendingRecommendations(Math.ceil(limit * 0.3)) : []
      ])

      // Combine and weight recommendations
      const productScores: Record<string, {
        score: number
        reasons: string[]
        algorithms: string[]
        explanations: string[]
      }> = {}

      // Process collaborative recommendations
      collaborative.forEach(rec => {
        if (!productScores[rec.product_id]) {
          productScores[rec.product_id] = {
            score: 0,
            reasons: [],
            algorithms: [],
            explanations: []
          }
        }
        
        const entry = productScores[rec.product_id]
        entry.score += rec.score * weights.collaborative!
        entry.reasons.push(rec.reason)
        entry.algorithms.push(rec.algorithm_used)
        entry.explanations.push(rec.explanation || '')
      })

      // Process content-based recommendations
      content.forEach(rec => {
        if (!productScores[rec.product_id]) {
          productScores[rec.product_id] = {
            score: 0,
            reasons: [],
            algorithms: [],
            explanations: []
          }
        }
        
        const entry = productScores[rec.product_id]
        entry.score += rec.score * weights.content!
        entry.reasons.push(rec.reason)
        entry.algorithms.push(rec.algorithm_used)
        entry.explanations.push(rec.explanation || '')
      })

      // Process trending recommendations
      trending.forEach(rec => {
        if (!productScores[rec.product_id]) {
          productScores[rec.product_id] = {
            score: 0,
            reasons: [],
            algorithms: [],
            explanations: []
          }
        }
        
        const entry = productScores[rec.product_id]
        entry.score += rec.score * weights.trending!
        entry.reasons.push(rec.reason)
        entry.algorithms.push(rec.algorithm_used)
        entry.explanations.push(rec.explanation || '')
      })

      // Convert to final recommendations
      const finalRecommendations = Object.entries(productScores)
        .map(([productId, data]) => ({
          product_id: productId,
          score: data.score,
          reason: data.reasons[0] || 'Recommended for you',
          algorithm_used: 'hybrid',
          explanation: `Combined recommendation using ${data.algorithms.join(', ')} algorithms`
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      return {
        recommendations: finalRecommendations,
        total_score: finalRecommendations.reduce((sum, rec) => sum + rec.score, 0),
        algorithms_used: Object.keys(weights).filter(key => weights[key as keyof typeof weights]! > 0),
        generated_at: new Date().toISOString()
      }

    } catch (error) {
      console.error('Error getting hybrid recommendations:', error)
      return {
        recommendations: [],
        total_score: 0,
        algorithms_used: [],
        generated_at: new Date().toISOString()
      }
    }
  }

  // Update user preferences based on interactions
  private async updateUserPreferences(userId: string): Promise<void> {
    try {
      // This would run in the background to update user preference profiles
      // Implementation depends on your specific user preference storage strategy
      console.log(`Updating preferences for user ${userId}`)
    } catch (error) {
      console.error('Error updating user preferences:', error)
    }
  }

  // Cache management
  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.CACHE_TTL
    })
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine()