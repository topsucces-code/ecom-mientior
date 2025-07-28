import type { Database } from './database'

export type Review = Database['public']['Tables']['reviews']['Row']
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update']

export interface ReviewWithUser extends Review {
  user: {
    id: string
    name: string
    avatar_url?: string
  }
}

export interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface ReviewFilters {
  rating?: number
  verified?: boolean
  withImages?: boolean
  sortBy?: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful'
}

export interface ReviewFormData {
  rating: number
  title: string
  comment: string
  images?: File[]
  pros?: string[]
  cons?: string[]
  verified_purchase?: boolean
}

export interface ReviewResponse {
  reviews: ReviewWithUser[]
  stats: ReviewStats
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface HelpfulVote {
  id: string
  review_id: string
  user_id: string
  is_helpful: boolean
  created_at: string
}