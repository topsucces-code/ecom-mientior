import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { recommendationEngine } from './recommendation-engine'
import type { 
  ProductRecommendation,
  RecommendationResponse,
  UserInteraction,
  PersonalizedRecommendations,
  RecommendationConfig
} from '@ecommerce/shared'

interface RecommendationStore {
  // State
  personalizedRecommendations: PersonalizedRecommendations | null
  trendingProducts: ProductRecommendation[]
  similarProducts: Record<string, ProductRecommendation[]>
  recentlyViewed: string[]
  loading: boolean
  error: string | null
  
  // Interaction tracking
  userInteractions: UserInteraction[]
  
  // Actions
  trackInteraction: (
    productId: string, 
    interactionType: UserInteraction['interaction_type'],
    interactionData?: Record<string, any>
  ) => Promise<void>
  
  getPersonalizedRecommendations: (userId: string, config?: RecommendationConfig) => Promise<void>
  getTrendingProducts: (category?: string, timePeriod?: '1h' | '24h' | '7d' | '30d') => Promise<void>
  getSimilarProducts: (productId: string, limit?: number) => Promise<void>
  getRecommendationsForProduct: (productId: string, limit?: number) => Promise<ProductRecommendation[]>
  
  addToRecentlyViewed: (productId: string) => void
  clearRecentlyViewed: () => void
  clearError: () => void
  
  // Bulk recommendation fetching
  preloadRecommendations: (userId: string) => Promise<void>
}

export const useRecommendationStore = create<RecommendationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      personalizedRecommendations: null,
      trendingProducts: [],
      similarProducts: {},
      recentlyViewed: [],
      loading: false,
      error: null,
      userInteractions: [],

      // Track user interaction
      trackInteraction: async (productId, interactionType, interactionData) => {
        try {
          // Get current user (in a real app, this would come from auth context)
          const userId = 'current-user-id' // This should be replaced with actual user ID
          
          // Track in recommendation engine
          await recommendationEngine.trackInteraction(
            userId, 
            productId, 
            interactionType, 
            interactionData
          )
          
          // Add to local state
          const newInteraction: UserInteraction = {
            id: `${Date.now()}-${Math.random()}`,
            user_id: userId,
            product_id: productId,
            interaction_type: interactionType,
            interaction_data: interactionData,
            created_at: new Date().toISOString()
          }
          
          set(state => ({
            userInteractions: [newInteraction, ...state.userInteractions.slice(0, 99)] // Keep last 100
          }))
          
          // Add to recently viewed if it's a view interaction
          if (interactionType === 'view') {
            get().addToRecentlyViewed(productId)
          }
          
        } catch (error) {
          console.error('Error tracking interaction:', error)
          set({ error: error instanceof Error ? error.message : 'Failed to track interaction' })
        }
      },

      // Get personalized recommendations
      getPersonalizedRecommendations: async (userId, config = {}) => {
        try {
          set({ loading: true, error: null })
          
          const response = await recommendationEngine.getHybridRecommendations(userId, config)
          
          // Create personalized recommendations structure
          const personalizedRecommendations: PersonalizedRecommendations = {
            user_id: userId,
            for_you: response.recommendations.slice(0, 10),
            because_you_viewed: [], // Will be populated based on recently viewed
            similar_to_cart: [], // Will be populated based on cart items
            trending_in_categories: [], // Will be populated from trending
            recently_viewed_alternatives: [],
            price_drop_alerts: [],
            back_in_stock: [],
            generated_at: response.generated_at,
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
          }
          
          // Get trending products for user's preferred categories
          const trendingProducts = await recommendationEngine.getTrendingRecommendations(10)
          personalizedRecommendations.trending_in_categories = trendingProducts
          
          // Get recommendations based on recently viewed
          const recentlyViewed = get().recentlyViewed.slice(0, 3)
          if (recentlyViewed.length > 0) {
            const viewedRecommendations = await Promise.all(
              recentlyViewed.map(productId => 
                recommendationEngine.getSimilarProducts(productId, 3)
              )
            )
            personalizedRecommendations.because_you_viewed = viewedRecommendations
              .flat()
              .slice(0, 10)
          }
          
          set({ 
            personalizedRecommendations,
            loading: false 
          })
          
        } catch (error) {
          console.error('Error getting personalized recommendations:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get recommendations',
            loading: false 
          })
        }
      },

      // Get trending products
      getTrendingProducts: async (category, timePeriod = '24h') => {
        try {
          set({ loading: true, error: null })
          
          const trendingProducts = await recommendationEngine.getTrendingRecommendations(
            20, 
            category, 
            timePeriod
          )
          
          set({ 
            trendingProducts,
            loading: false 
          })
          
        } catch (error) {
          console.error('Error getting trending products:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get trending products',
            loading: false 
          })
        }
      },

      // Get similar products
      getSimilarProducts: async (productId, limit = 10) => {
        try {
          const similarProducts = await recommendationEngine.getSimilarProducts(productId, limit)
          
          set(state => ({
            similarProducts: {
              ...state.similarProducts,
              [productId]: similarProducts
            }
          }))
          
        } catch (error) {
          console.error('Error getting similar products:', error)
          set({ error: error instanceof Error ? error.message : 'Failed to get similar products' })
        }
      },

      // Get recommendations for a specific product (for product pages)
      getRecommendationsForProduct: async (productId, limit = 10) => {
        try {
          // First check if we have cached similar products
          const { similarProducts } = get()
          if (similarProducts[productId]) {
            return similarProducts[productId].slice(0, limit)
          }
          
          // If not cached, fetch them
          await get().getSimilarProducts(productId, limit)
          const updatedState = get()
          return updatedState.similarProducts[productId] || []
          
        } catch (error) {
          console.error('Error getting recommendations for product:', error)
          return []
        }
      },

      // Add to recently viewed
      addToRecentlyViewed: (productId) => {
        set(state => {
          const recentlyViewed = [
            productId,
            ...state.recentlyViewed.filter(id => id !== productId)
          ].slice(0, 20) // Keep last 20 viewed products
          
          return { recentlyViewed }
        })
      },

      // Clear recently viewed
      clearRecentlyViewed: () => {
        set({ recentlyViewed: [] })
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      },

      // Preload recommendations for better performance
      preloadRecommendations: async (userId) => {
        try {
          // Preload all recommendation types in parallel
          await Promise.all([
            get().getPersonalizedRecommendations(userId),
            get().getTrendingProducts(),
            get().getTrendingProducts('electronics'),
            get().getTrendingProducts('fashion')
          ])
        } catch (error) {
          console.error('Error preloading recommendations:', error)
        }
      }
    }),
    {
      name: 'recommendation-store',
      partialize: (state) => ({
        recentlyViewed: state.recentlyViewed,
        userInteractions: state.userInteractions.slice(0, 50), // Persist last 50 interactions
        personalizedRecommendations: state.personalizedRecommendations,
        similarProducts: state.similarProducts
      })
    }
  )
)