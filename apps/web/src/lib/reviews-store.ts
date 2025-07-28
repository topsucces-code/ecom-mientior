import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProductReview {
  id: string
  productId: string
  userId: string
  userName: string
  userEmail: string
  rating: number
  title: string
  comment: string
  createdAt: Date
  helpful: number
  verified: boolean
}

interface ReviewsStore {
  reviews: ProductReview[]
  addReview: (review: Omit<ProductReview, 'id' | 'createdAt' | 'helpful'>) => void
  getProductReviews: (productId: string) => ProductReview[]
  getProductRating: (productId: string) => { average: number; total: number }
  markHelpful: (reviewId: string) => void
  userHasReviewed: (productId: string, userId: string) => boolean
}

export const useReviewsStore = create<ReviewsStore>()(
  persist(
    (set, get) => ({
      reviews: [],
      
      addReview: (reviewData) => {
        const newReview: ProductReview = {
          ...reviewData,
          id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          helpful: 0
        }
        
        set(state => ({
          reviews: [...state.reviews, newReview]
        }))
      },
      
      getProductReviews: (productId: string) => {
        return get().reviews
          .filter(review => review.productId === productId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      },
      
      getProductRating: (productId: string) => {
        const productReviews = get().reviews.filter(review => review.productId === productId)
        
        if (productReviews.length === 0) {
          return { average: 0, total: 0 }
        }
        
        const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0)
        const average = totalRating / productReviews.length
        
        return {
          average: Math.round(average * 10) / 10,
          total: productReviews.length
        }
      },
      
      markHelpful: (reviewId: string) => {
        set(state => ({
          reviews: state.reviews.map(review =>
            review.id === reviewId
              ? { ...review, helpful: review.helpful + 1 }
              : review
          )
        }))
      },
      
      userHasReviewed: (productId: string, userId: string) => {
        return get().reviews.some(
          review => review.productId === productId && review.userId === userId
        )
      }
    }),
    {
      name: 'reviews-storage',
    }
  )
)