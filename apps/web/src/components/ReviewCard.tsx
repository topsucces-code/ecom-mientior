'use client'

import { useState, memo } from 'react'
import Image from 'next/image'
import { useReviewStore } from '../lib/review-store'
import type { ReviewWithUser } from '@ecommerce/shared'

interface ReviewCardProps {
  review: ReviewWithUser
  onReport?: (reviewId: string, reason: string) => void
  showActions?: boolean
}

export const ReviewCard = memo(function ReviewCard({ 
  review, 
  onReport, 
  showActions = true 
}: ReviewCardProps) {
  const [showFullComment, setShowFullComment] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  const { markHelpful, helpfulVotes } = useReviewStore()
  
  const isHelpful = helpfulVotes[review.id] || false
  
  const handleHelpfulClick = async (helpful: boolean) => {
    await markHelpful(review.id, helpful)
  }
  
  const handleReport = () => {
    if (onReport && reportReason.trim()) {
      onReport(review.id, reportReason)
      setShowReportModal(false)
      setReportReason('')
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const shouldTruncate = review.comment.length > 300
  const displayComment = shouldTruncate && !showFullComment 
    ? review.comment.substring(0, 300) + '...' 
    : review.comment
    
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {review.user.avatar_url ? (
              <Image
                src={review.user.avatar_url}
                alt={review.user.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-gray-600">
                {review.user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div>
            <p className="font-semibold text-gray-900">{review.user.name}</p>
            <div className="flex items-center gap-2">
              {/* Star Rating */}
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              
              {/* Verified Purchase Badge */}
              {review.verified_purchase && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Achat vérifié
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Date */}
        <div className="text-sm text-gray-500">
          {formatDate(review.created_at)}
        </div>
      </div>
      
      {/* Review Title */}
      {review.title && (
        <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
      )}
      
      {/* Review Comment */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">{displayComment}</p>
        {shouldTruncate && (
          <button
            onClick={() => setShowFullComment(!showFullComment)}
            className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            {showFullComment ? 'Voir moins' : 'Voir plus'}
          </button>
        )}
      </div>
      
      {/* Pros and Cons */}
      {(review.pros || review.cons) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {review.pros && review.pros.length > 0 && (
            <div>
              <h5 className="font-medium text-green-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Points positifs
              </h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {review.pros.map((pro, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">+</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {review.cons && review.cons.length > 0 && (
            <div>
              <h5 className="font-medium text-red-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Points négatifs
              </h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {review.cons.map((con, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">-</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium text-gray-900 mb-2">Images</h5>
          <div className="flex gap-2 flex-wrap">
            {review.images.map((image, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedImage(image)
                  setImageModalOpen(true)
                }}
                className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-300 transition-colors"
              >
                <Image
                  src={image}
                  alt={`Review image ${index + 1}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            {/* Helpful buttons */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Cette review vous a-t-elle été utile ?</span>
              <button
                onClick={() => handleHelpfulClick(true)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  isHelpful
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                Oui
              </button>
              <button
                onClick={() => handleHelpfulClick(false)}
                className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.641a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                </svg>
                Non
              </button>
            </div>
          </div>
          
          {/* Report button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Signaler
          </button>
        </div>
      )}
      
      {/* Image Modal */}
      {imageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={selectedImage}
              alt="Review image"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Signaler cette review</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Veuillez expliquer pourquoi vous signalez cette review..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none h-24 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Signaler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})