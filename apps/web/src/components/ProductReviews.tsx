'use client'

import { useState } from 'react'
import { StarRating } from './StarRating'
import { Button, Input } from '@ecommerce/ui'
import { useSupabaseReviews } from '../hooks/useSupabaseReviews'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'

interface ProductReviewsProps {
  productId: string
  productName: string
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { user } = useSupabaseAuth()
  const { 
    reviews,
    loading,
    averageRating,
    totalReviews,
    submitReview,
    getUserReview
  } = useSupabaseReviews(productId)
  
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const userReview = getUserReview()
  const hasUserReviewed = !!userReview

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !reviewForm.title.trim() || !reviewForm.comment.trim()) return

    setIsSubmitting(true)
    
    try {
      const success = await submitReview(
        reviewForm.rating,
        reviewForm.title.trim(),
        reviewForm.comment.trim()
      )

      if (success) {
        setReviewForm({ rating: 5, title: '', comment: '' })
        setShowReviewForm(false)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRatingDistribution = () => {
    const distribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(review => review.rating === rating).length,
      percentage: totalReviews > 0 ? (reviews.filter(review => review.rating === rating).length / totalReviews) * 100 : 0
    }))
    return distribution
  }

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Customer Reviews</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overall Rating */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
              <div className="flex flex-col">
                <StarRating rating={averageRating} size="lg" />
                <span className="text-sm text-gray-600 mt-1">
                  Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {getRatingDistribution().map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-right">{rating}</span>
                <StarRating rating={1} size="sm" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-gray-600">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Write Review */}
      {user && !hasUserReviewed && (
        <div className="border border-gray-200 rounded-lg p-6">
          {!showReviewForm ? (
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Share your experience
              </h4>
              <p className="text-gray-600 mb-4">
                Help other customers by writing a review for {productName}
              </p>
              <Button onClick={() => setShowReviewForm(true)}>
                Write a Review
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Write Your Review</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <StarRating
                  rating={reviewForm.rating}
                  interactive
                  size="lg"
                  onChange={(rating) => setReviewForm(prev => ({ ...prev, rating }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Title
                </label>
                <Input
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Summarize your experience"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Tell us more about your experience with this product"
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !reviewForm.title.trim() || !reviewForm.comment.trim()}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowReviewForm(false)
                    setReviewForm({ rating: 5, title: '', comment: '' })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {user && hasUserReviewed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Thank you for your review!</span>
          </div>
        </div>
      )}

      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-center">
            <p className="text-blue-800 mb-2">Sign in to write a review</p>
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-900">
            Reviews ({totalReviews})
          </h4>
          
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {(review.user_profiles?.full_name || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {review.user_profiles?.full_name || 'Anonymous User'}
                        </span>
                        {review.verified_purchase && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-sm text-gray-500">
                          {formatDate(new Date(review.created_at))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-13">
                  <h5 className="font-semibold text-gray-900 mb-2">{review.title || 'No title'}</h5>
                  <p className="text-gray-700 mb-3 leading-relaxed">{review.content}</p>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      Was this helpful?
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reviews.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h4>
          <p className="text-gray-600">Be the first to review this product!</p>
        </div>
      )}
    </div>
  )
}