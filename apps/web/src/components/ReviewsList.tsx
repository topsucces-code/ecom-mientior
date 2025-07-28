'use client'

import { useState, useEffect, memo } from 'react'
import { ReviewCard } from './ReviewCard'
import { useReviewStore } from '../lib/review-store'
import type { ReviewFilters } from '@ecommerce/shared'

interface ReviewsListProps {
  productId: string
  showStats?: boolean
  maxInitialReviews?: number
}

export const ReviewsList = memo(function ReviewsList({ 
  productId, 
  showStats = true,
  maxInitialReviews 
}: ReviewsListProps) {
  const [filters, setFilters] = useState<ReviewFilters>({
    sortBy: 'newest'
  })
  const [showAllReviews, setShowAllReviews] = useState(false)
  
  const { 
    reviews, 
    reviewStats, 
    loading, 
    error, 
    currentPage, 
    totalPages,
    fetchReviews, 
    fetchReviewStats,
    reportReview,
    clearError 
  } = useReviewStore()
  
  const stats = reviewStats[productId]
  
  useEffect(() => {
    fetchReviewStats(productId)
    fetchReviews(productId, filters, 1)
  }, [productId, filters, fetchReviews, fetchReviewStats])
  
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])
  
  const handleFilterChange = (newFilters: Partial<ReviewFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }
  
  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      fetchReviews(productId, filters, currentPage + 1)
    }
  }
  
  const handleReport = async (reviewId: string, reason: string) => {
    await reportReview(reviewId, reason)
  }
  
  const getStarPercentage = (starRating: number) => {
    if (!stats || stats.totalReviews === 0) return 0
    return Math.round((stats.ratingDistribution[starRating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100)
  }
  
  const displayedReviews = maxInitialReviews && !showAllReviews 
    ? reviews.slice(0, maxInitialReviews)
    : reviews
    
  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-48"></div>
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Review Statistics */}
      {showStats && stats && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Overall Rating */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                <div className="text-4xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(stats.averageRating) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Basé sur {stats.totalReviews} avis
                  </p>
                </div>
              </div>
            </div>
            
            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium">{star}</span>
                    <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getStarPercentage(star)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {getStarPercentage(star)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Filters and Sorting */}
      {stats && stats.totalReviews > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Trier par :</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="newest">Plus récent</option>
                <option value="oldest">Plus ancien</option>
                <option value="rating_high">Note décroissante</option>
                <option value="rating_low">Note croissante</option>
                <option value="helpful">Plus utile</option>
              </select>
            </div>
            
            {/* Rating Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Note :</label>
              <select
                value={filters.rating || ''}
                onChange={(e) => handleFilterChange({ 
                  rating: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Toutes</option>
                <option value="5">5 étoiles</option>
                <option value="4">4 étoiles</option>
                <option value="3">3 étoiles</option>
                <option value="2">2 étoiles</option>
                <option value="1">1 étoile</option>
              </select>
            </div>
            
            {/* Verified Filter */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.verified || false}
                onChange={(e) => handleFilterChange({ verified: e.target.checked || undefined })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-gray-700">Achats vérifiés uniquement</span>
            </label>
            
            {/* With Images Filter */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.withImages || false}
                onChange={(e) => handleFilterChange({ withImages: e.target.checked || undefined })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-gray-700">Avec photos</span>
            </label>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
      
      {/* Reviews List */}
      {displayedReviews.length > 0 ? (
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onReport={handleReport}
            />
          ))}
          
          {/* Show More Button for Limited View */}
          {maxInitialReviews && !showAllReviews && reviews.length > maxInitialReviews && (
            <div className="text-center">
              <button
                onClick={() => setShowAllReviews(true)}
                className="px-6 py-3 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Voir les {reviews.length - maxInitialReviews} autres avis
              </button>
            </div>
          )}
          
          {/* Load More Button for Pagination */}
          {(!maxInitialReviews || showAllReviews) && currentPage < totalPages && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Chargement...' : 'Charger plus d\'avis'}
              </button>
            </div>
          )}
        </div>
      ) : !loading && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun avis pour le moment
          </h3>
          <p className="text-gray-600">
            Soyez le premier à donner votre avis sur ce produit !
          </p>
        </div>
      )}
      
      {/* Loading More Indicator */}
      {loading && reviews.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
            <span>Chargement des avis...</span>
          </div>
        </div>
      )}
    </div>
  )
})