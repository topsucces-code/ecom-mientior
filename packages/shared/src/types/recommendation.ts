export interface UserInteraction {
  id: string
  user_id: string
  product_id: string
  interaction_type: 'view' | 'cart' | 'purchase' | 'wishlist' | 'compare' | 'review'
  interaction_data?: Record<string, any>
  created_at: string
}

export interface ProductSimilarity {
  product_a_id: string
  product_b_id: string
  similarity_score: number
  similarity_type: 'category' | 'brand' | 'tags' | 'price_range' | 'behavior'
  updated_at: string
}

export interface UserPreference {
  user_id: string
  category_preferences: Record<string, number>
  brand_preferences: Record<string, number>
  price_range_preference: {
    min: number
    max: number
  }
  tag_preferences: Record<string, number>
  last_updated: string
}

export interface RecommendationConfig {
  algorithm: 'collaborative' | 'content' | 'hybrid' | 'trending' | 'similar'
  weights?: {
    collaborative?: number
    content?: number
    trending?: number
    similarity?: number
  }
  filters?: {
    category?: string
    brand?: string
    price_range?: { min: number; max: number }
    in_stock?: boolean
    min_rating?: number
  }
  limit?: number
  exclude_purchased?: boolean
  exclude_viewed_recently?: boolean
}

export interface ProductRecommendation {
  product_id: string
  score: number
  reason: string
  algorithm_used: string
  explanation?: string
}

export interface RecommendationResponse {
  recommendations: ProductRecommendation[]
  total_score: number
  algorithms_used: string[]
  generated_at: string
  cache_key?: string
}

export interface TrendingProduct {
  product_id: string
  trending_score: number
  view_count: number
  cart_count: number
  purchase_count: number
  review_count: number
  time_period: '1h' | '24h' | '7d' | '30d'
  category?: string
}

export interface PersonalizedRecommendations {
  user_id: string
  for_you: ProductRecommendation[]
  because_you_viewed: ProductRecommendation[]
  similar_to_cart: ProductRecommendation[]
  trending_in_categories: ProductRecommendation[]
  recently_viewed_alternatives: ProductRecommendation[]
  price_drop_alerts: ProductRecommendation[]
  back_in_stock: ProductRecommendation[]
  generated_at: string
  expires_at: string
}