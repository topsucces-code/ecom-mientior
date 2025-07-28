import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@ecommerce/shared'
import type { 
  Review, 
  ReviewWithUser, 
  ReviewStats, 
  ReviewFilters, 
  ReviewFormData, 
  ReviewResponse, 
  HelpfulVote 
} from '@ecommerce/shared'

interface ReviewStore {
  // State
  reviews: ReviewWithUser[]
  reviewStats: Record<string, ReviewStats>
  userReviews: Record<string, Review>
  helpfulVotes: Record<string, boolean>
  loading: boolean
  error: string | null
  
  // Pagination
  currentPage: number
  totalPages: number
  
  // Actions
  fetchReviews: (productId: string, filters?: ReviewFilters, page?: number) => Promise<void>
  fetchReviewStats: (productId: string) => Promise<ReviewStats | null>
  submitReview: (productId: string, reviewData: ReviewFormData) => Promise<Review | null>
  updateReview: (reviewId: string, updates: Partial<ReviewFormData>) => Promise<void>
  deleteReview: (reviewId: string) => Promise<void>
  markHelpful: (reviewId: string, isHelpful: boolean) => Promise<void>
  reportReview: (reviewId: string, reason: string) => Promise<void>
  clearReviews: () => void
  clearError: () => void
}

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      // Initial state
      reviews: [],
      reviewStats: {},
      userReviews: {},
      helpfulVotes: {},
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,

      // Fetch reviews for a product
      fetchReviews: async (productId: string, filters: ReviewFilters = {}, page: number = 1) => {
        try {
          set({ loading: true, error: null })
          
          const limit = 10
          const offset = (page - 1) * limit
          
          let query = supabase
            .from('reviews')
            .select(`
              *,
              user:users!reviews_user_id_fkey(id, name, avatar_url),
              helpful_votes_count:helpful_votes(count)
            `)
            .eq('product_id', productId)
            .range(offset, offset + limit - 1)
          
          // Apply filters
          if (filters.rating) {
            query = query.eq('rating', filters.rating)
          }
          
          if (filters.verified !== undefined) {
            query = query.eq('verified_purchase', filters.verified)
          }
          
          if (filters.withImages) {
            query = query.not('images', 'is', null)
          }
          
          // Apply sorting
          switch (filters.sortBy) {
            case 'oldest':
              query = query.order('created_at', { ascending: true })
              break
            case 'rating_high':
              query = query.order('rating', { ascending: false })
              break
            case 'rating_low':
              query = query.order('rating', { ascending: true })
              break
            case 'helpful':
              query = query.order('helpful_count', { ascending: false })
              break
            default: // newest
              query = query.order('created_at', { ascending: false })
          }
          
          const { data: reviews, error: reviewsError, count } = await query
          
          if (reviewsError) throw reviewsError
          
          // Get total count for pagination
          const { count: totalCount, error: countError } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', productId)
            
          if (countError) throw countError
          
          const totalPages = Math.ceil((totalCount || 0) / limit)
          
          set({ 
            reviews: reviews || [],
            currentPage: page,
            totalPages,
            loading: false 
          })
          
        } catch (error) {
          console.error('Error fetching reviews:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch reviews',
            loading: false 
          })
        }
      },

      // Fetch review statistics
      fetchReviewStats: async (productId: string): Promise<ReviewStats | null> => {
        try {
          const { data: reviews, error } = await supabase
            .from('reviews')
            .select('rating')
            .eq('product_id', productId)
            
          if (error) throw error
          
          if (!reviews || reviews.length === 0) {
            return {
              averageRating: 0,
              totalReviews: 0,
              ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            }
          }
          
          const totalReviews = reviews.length
          const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
          
          const ratingDistribution = reviews.reduce((acc, review) => {
            acc[review.rating as keyof typeof acc] = (acc[review.rating as keyof typeof acc] || 0) + 1
            return acc
          }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
          
          const stats: ReviewStats = {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews,
            ratingDistribution
          }
          
          set(state => ({
            reviewStats: {
              ...state.reviewStats,
              [productId]: stats
            }
          }))
          
          return stats
        } catch (error) {
          console.error('Error fetching review stats:', error)
          return null
        }
      },

      // Submit a new review
      submitReview: async (productId: string, reviewData: ReviewFormData): Promise<Review | null> => {
        try {
          set({ loading: true, error: null })
          
          // Get current user
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('User must be logged in to submit a review')
          
          // Check if user already reviewed this product
          const { data: existingReview, error: checkError } = await supabase
            .from('reviews')
            .select('id')
            .eq('product_id', productId)
            .eq('user_id', user.id)
            .single()
            
          if (checkError && checkError.code !== 'PGRST116') {
            throw checkError
          }
          
          if (existingReview) {
            throw new Error('You have already reviewed this product')
          }
          
          // Upload images if any
          let imageUrls: string[] = []
          if (reviewData.images && reviewData.images.length > 0) {
            for (const image of reviewData.images) {
              const fileExt = image.name.split('.').pop()
              const fileName = `${user.id}/${productId}/${Date.now()}.${fileExt}`
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('review-images')
                .upload(fileName, image)
                
              if (uploadError) throw uploadError
              
              const { data: { publicUrl } } = supabase.storage
                .from('review-images')
                .getPublicUrl(fileName)
                
              imageUrls.push(publicUrl)
            }
          }
          
          // Create review
          const { data: review, error: insertError } = await supabase
            .from('reviews')
            .insert({
              product_id: productId,
              user_id: user.id,
              rating: reviewData.rating,
              title: reviewData.title,
              comment: reviewData.comment,
              images: imageUrls.length > 0 ? imageUrls : null,
              pros: reviewData.pros || null,
              cons: reviewData.cons || null,
              verified_purchase: reviewData.verified_purchase || false
            })
            .select()
            .single()
            
          if (insertError) throw insertError
          
          // Update local state
          set(state => ({
            userReviews: {
              ...state.userReviews,
              [productId]: review
            },
            loading: false
          }))
          
          // Refresh reviews for this product
          await get().fetchReviews(productId)
          await get().fetchReviewStats(productId)
          
          return review
          
        } catch (error) {
          console.error('Error submitting review:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to submit review',
            loading: false 
          })
          return null
        }
      },

      // Update an existing review
      updateReview: async (reviewId: string, updates: Partial<ReviewFormData>) => {
        try {
          set({ loading: true, error: null })
          
          const { error } = await supabase
            .from('reviews')
            .update(updates)
            .eq('id', reviewId)
            
          if (error) throw error
          
          set({ loading: false })
          
        } catch (error) {
          console.error('Error updating review:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update review',
            loading: false 
          })
        }
      },

      // Delete a review
      deleteReview: async (reviewId: string) => {
        try {
          set({ loading: true, error: null })
          
          const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId)
            
          if (error) throw error
          
          // Remove from local state
          set(state => ({
            reviews: state.reviews.filter(review => review.id !== reviewId),
            loading: false
          }))
          
        } catch (error) {
          console.error('Error deleting review:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete review',
            loading: false 
          })
        }
      },

      // Mark review as helpful/not helpful
      markHelpful: async (reviewId: string, isHelpful: boolean) => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          
          // Upsert helpful vote
          const { error } = await supabase
            .from('helpful_votes')
            .upsert({
              review_id: reviewId,
              user_id: user.id,
              is_helpful: isHelpful
            })
            
          if (error) throw error
          
          // Update local state
          set(state => ({
            helpfulVotes: {
              ...state.helpfulVotes,
              [reviewId]: isHelpful
            }
          }))
          
        } catch (error) {
          console.error('Error marking review helpful:', error)
        }
      },

      // Report a review
      reportReview: async (reviewId: string, reason: string) => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          
          const { error } = await supabase
            .from('review_reports')
            .insert({
              review_id: reviewId,
              user_id: user.id,
              reason
            })
            
          if (error) throw error
          
        } catch (error) {
          console.error('Error reporting review:', error)
        }
      },

      // Clear reviews
      clearReviews: () => {
        set({ 
          reviews: [], 
          currentPage: 1, 
          totalPages: 1 
        })
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'review-store',
      partialize: (state) => ({
        reviewStats: state.reviewStats,
        userReviews: state.userReviews,
        helpfulVotes: state.helpfulVotes
      })
    }
  )
)