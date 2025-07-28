'use client'

import { useState, useRef, useEffect, memo } from 'react'
import { ProductCard } from './ProductCard'
import { ProductRating } from './ProductRating'
import { useCartStore } from '../lib/cart-store'
import { useRecommendationStore } from '../lib/recommendation-store'
import type { ProductRecommendation, Product } from '@ecommerce/shared'

interface RecommendationCarouselProps {
  title: string
  subtitle?: string
  recommendations: ProductRecommendation[]
  products: Product[]
  showReason?: boolean
  itemsPerView?: number
  className?: string
  onProductClick?: (productId: string) => void
}

export const RecommendationCarousel = memo(function RecommendationCarousel({
  title,
  subtitle,
  recommendations,
  products,
  showReason = true,
  itemsPerView = 5,
  className = '',
  onProductClick
}: RecommendationCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const { addItem } = useCartStore()
  const { trackInteraction } = useRecommendationStore()

  // Create a map for quick product lookup
  const productMap = products.reduce((acc, product) => {
    acc[product.id] = product
    return acc
  }, {} as Record<string, Product>)

  // Get products with recommendations
  const recommendedProducts = recommendations
    .map(rec => ({
      ...rec,
      product: productMap[rec.product_id]
    }))
    .filter(item => item.product) // Only include products that exist

  const totalItems = recommendedProducts.length
  const maxIndex = Math.max(0, totalItems - itemsPerView)

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1))
  }

  const handleAddToCart = async (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || '',
      quantity: 1
    })
    
    // Track interaction
    await trackInteraction(product.id, 'cart', {
      source: 'recommendation_carousel',
      recommendation_reason: recommendations.find(r => r.product_id === product.id)?.reason
    })
  }

  const handleProductClick = async (productId: string) => {
    // Track interaction
    await trackInteraction(productId, 'view', {
      source: 'recommendation_carousel',
      recommendation_reason: recommendations.find(r => r.product_id === productId)?.reason
    })
    
    onProductClick?.(productId)
  }

  if (recommendedProducts.length === 0) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        
        {/* Navigation Controls */}
        {totalItems > itemsPerView && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className="relative overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            width: `${(totalItems / itemsPerView) * 100}%`
          }}
        >
          {recommendedProducts.map((item, index) => (
            <div 
              key={item.product_id}
              className="flex-shrink-0 px-2"
              style={{ width: `${100 / totalItems}%` }}
            >
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full">
                {/* Product Image */}
                <div 
                  className="relative h-48 bg-gray-100 cursor-pointer group"
                  onClick={() => handleProductClick(item.product_id)}
                >
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Recommendation Badge */}
                  <div className="absolute top-2 left-2">
                    <div 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: '#8A2BE2' }}
                    >
                      {Math.round(item.score * 100)}% match
                    </div>
                  </div>

                  {/* Sale Badge */}
                  {item.product.compare_at_price && item.product.compare_at_price > item.product.price && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                      {Math.round(((item.product.compare_at_price - item.product.price) / item.product.compare_at_price) * 100)}% OFF
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white text-gray-900 px-3 py-1 rounded-md text-sm font-medium">
                      Voir le produit
                    </span>
                  </div>
                </div>
                
                {/* Product Info */}
                <div className="p-3">
                  {/* Recommendation Reason */}
                  {showReason && (
                    <div className="mb-2">
                      <span className="text-xs text-purple-600 font-medium">
                        {item.reason}
                      </span>
                    </div>
                  )}
                  
                  {/* Product Name */}
                  <h3 
                    className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-purple-700 transition-colors cursor-pointer"
                    onClick={() => handleProductClick(item.product_id)}
                  >
                    {item.product.name}
                  </h3>
                  
                  {/* Brand */}
                  {item.product.brand && (
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                      {item.product.brand}
                    </p>
                  )}
                  
                  {/* Rating */}
                  <div className="mb-3">
                    <ProductRating 
                      productId={item.product_id} 
                      size="sm" 
                      showCount={false}
                    />
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-lg font-bold text-gray-900">
                        ${item.product.price}
                      </span>
                      {item.product.compare_at_price && item.product.compare_at_price > item.product.price && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ${item.product.compare_at_price}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(item.product)}
                    disabled={item.product.inventory_quantity === 0}
                    className="w-full text-xs font-medium py-2 px-3 rounded-md transition-colors"
                    style={{ 
                      backgroundColor: item.product.inventory_quantity > 0 ? '#A0522D' : '#9CA3AF',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      if (item.product.inventory_quantity > 0) {
                        e.currentTarget.style.backgroundColor = '#8B4513'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (item.product.inventory_quantity > 0) {
                        e.currentTarget.style.backgroundColor = '#A0522D'
                      }
                    }}
                  >
                    {item.product.inventory_quantity === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      {totalItems > itemsPerView && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: maxIndex + 1 }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
})