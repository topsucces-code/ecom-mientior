'use client'

import { useState, memo } from 'react'
import { ReviewsList } from './ReviewsList'
import { ReviewForm } from './ReviewForm'
import { useReviewStore } from '../lib/review-store'

interface ProductReviewsSectionProps {
  productId: string
  productName: string
}

export const ProductReviewsSection = memo(function ProductReviewsSection({
  productId,
  productName
}: ProductReviewsSectionProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const { reviewStats } = useReviewStore()
  
  const stats = reviewStats[productId]
  
  const handleReviewSubmitted = () => {
    setShowReviewForm(false)
    // The review store will automatically refresh the reviews
  }
  
  return (
    <div className="space-y-8">
      {/* Header with Write Review Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Avis clients
          </h2>
          {stats && (
            <p className="text-gray-600 mt-1">
              {stats.totalReviews} avis avec une note moyenne de {stats.averageRating.toFixed(1)}/5
            </p>
          )}
        </div>
        
        {!showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Écrire un avis
          </button>
        )}
      </div>
      
      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          onSubmitSuccess={handleReviewSubmitted}
          onCancel={() => setShowReviewForm(false)}
        />
      )}
      
      {/* Reviews List */}
      <ReviewsList productId={productId} />
    </div>
  )
})