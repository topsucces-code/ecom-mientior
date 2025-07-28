'use client'

import { useState, useRef, memo } from 'react'
import Image from 'next/image'
import { useReviewStore } from '../lib/review-store'
import type { ReviewFormData } from '@ecommerce/shared'

interface ReviewFormProps {
  productId: string
  onSubmitSuccess?: () => void
  onCancel?: () => void
}

export const ReviewForm = memo(function ReviewForm({ 
  productId, 
  onSubmitSuccess, 
  onCancel 
}: ReviewFormProps) {
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 5,
    title: '',
    comment: '',
    pros: [],
    cons: [],
    verified_purchase: false
  })
  
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [currentPro, setCurrentPro] = useState('')
  const [currentCon, setCurrentCon] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { submitReview, loading, error } = useReviewStore()
  
  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }))
  }
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const maxFiles = 5
    const maxSize = 5 * 1024 * 1024 // 5MB
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`Le fichier ${file.name} est trop volumineux (max 5MB)`)
        return false
      }
      return file.type.startsWith('image/')
    })
    
    if (images.length + validFiles.length > maxFiles) {
      alert(`Vous ne pouvez ajouter que ${maxFiles} images maximum`)
      return
    }
    
    setImages(prev => [...prev, ...validFiles])
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }
  
  const addPro = () => {
    if (currentPro.trim() && formData.pros!.length < 5) {
      setFormData(prev => ({
        ...prev,
        pros: [...(prev.pros || []), currentPro.trim()]
      }))
      setCurrentPro('')
    }
  }
  
  const removePro = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pros: prev.pros?.filter((_, i) => i !== index) || []
    }))
  }
  
  const addCon = () => {
    if (currentCon.trim() && formData.cons!.length < 5) {
      setFormData(prev => ({
        ...prev,
        cons: [...(prev.cons || []), currentCon.trim()]
      }))
      setCurrentCon('')
    }
  }
  
  const removeCon = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cons: prev.cons?.filter((_, i) => i !== index) || []
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.comment.trim()) {
      alert('Veuillez remplir le titre et le commentaire')
      return
    }
    
    const reviewData: ReviewFormData = {
      ...formData,
      images: images.length > 0 ? images : undefined,
      pros: formData.pros!.length > 0 ? formData.pros : undefined,
      cons: formData.cons!.length > 0 ? formData.cons : undefined
    }
    
    const result = await submitReview(productId, reviewData)
    
    if (result) {
      onSubmitSuccess?.()
    }
  }
  
  const getRatingText = (rating: number) => {
    const texts = {
      1: 'Très mauvais',
      2: 'Mauvais', 
      3: 'Moyen',
      4: 'Bon',
      5: 'Excellent'
    }
    return texts[rating as keyof typeof texts]
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Écrire une review</h3>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note globale *
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className={`w-8 h-8 transition-colors ${
                    star <= formData.rating 
                      ? 'text-yellow-400 hover:text-yellow-500' 
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                >
                  <svg className="w-full h-full fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {getRatingText(formData.rating)}
            </span>
          </div>
        </div>
        
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Titre de votre review *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Résumez votre expérience en quelques mots"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 caractères</p>
        </div>
        
        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Votre avis détaillé *
          </label>
          <textarea
            id="comment"
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Partagez votre expérience avec ce produit. Qu'est-ce qui vous a plu ou déplu ?"
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            maxLength={2000}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.comment.length}/2000 caractères</p>
        </div>
        
        {/* Pros and Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pros */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points positifs
            </label>
            <div className="space-y-2">
              {formData.pros?.map((pro, index) => (
                <div key={index} className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-md">
                  <span className="text-green-600 font-medium">+</span>
                  <span className="flex-1 text-sm">{pro}</span>
                  <button
                    type="button"
                    onClick={() => removePro(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {(formData.pros?.length || 0) < 5 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentPro}
                    onChange={(e) => setCurrentPro(e.target.value)}
                    placeholder="Ajouter un point positif"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    maxLength={100}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPro())}
                  />
                  <button
                    type="button"
                    onClick={addPro}
                    disabled={!currentPro.trim()}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Cons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points négatifs
            </label>
            <div className="space-y-2">
              {formData.cons?.map((con, index) => (
                <div key={index} className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-md">
                  <span className="text-red-600 font-medium">-</span>
                  <span className="flex-1 text-sm">{con}</span>
                  <button
                    type="button"
                    onClick={() => removeCon(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {(formData.cons?.length || 0) < 5 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentCon}
                    onChange={(e) => setCurrentCon(e.target.value)}
                    placeholder="Ajouter un point négatif"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    maxLength={100}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCon())}
                  />
                  <button
                    type="button"
                    onClick={addCon}
                    disabled={!currentCon.trim()}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos (optionnel)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Ajoutez jusqu'à 5 photos (max 5MB chacune)
          </p>
          
          {imagePreviews.length > 0 && (
            <div className="flex gap-3 mb-3 flex-wrap">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {images.length < 5 && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm">Ajouter des photos</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Verified Purchase */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="verified"
            checked={formData.verified_purchase}
            onChange={(e) => setFormData(prev => ({ ...prev, verified_purchase: e.target.checked }))}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <label htmlFor="verified" className="ml-2 text-sm text-gray-700">
            J'ai acheté ce produit
          </label>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !formData.title.trim() || !formData.comment.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Publication...' : 'Publier ma review'}
          </button>
        </div>
      </form>
    </div>
  )
})