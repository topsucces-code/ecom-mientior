'use client'

import { memo, useState, useCallback } from 'react'
import Link from 'next/link'
import { ProductRating } from './ProductRating'
import type { Product } from '@ecommerce/shared'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  className?: string
}

// Helper function to get demo images based on product name/category
const getDemoImage = (productName: string, productId: string): string => {
  const demoImages = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&h=500&fit=crop'
  ]
  
  // Use product ID to consistently select the same image for the same product
  const index = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % demoImages.length
  return demoImages[index]
}

export const ProductCard = memo(function ProductCard({ 
  product, 
  onAddToCart, 
  className = '' 
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  // Get demo image if no product images are available
  const displayImage = (product.images && product.images.length > 0) 
    ? product.images[0] 
    : getDemoImage(product.name, product.id)

  const handleAddToCart = useCallback(async () => {
    setIsAddingToCart(true)
    try {
      onAddToCart(product)
      // Add a small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300))
    } finally {
      setIsAddingToCart(false)
    }
  }, [product, onAddToCart])

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }, [])

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] h-full flex flex-col ${className}`}>
      {/* Enhanced Product Image */}
      <Link href={`/products/${product.id}`} className="block relative group">
        <div className="w-full h-64 bg-gradient-to-br from-gray-50 to-gray-200 relative overflow-hidden">
          {/* Real Product Image */}
          <img
            src={displayImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
          />
          {/* Fallback placeholder when image fails or is loading */}
          <div className={`absolute inset-0 w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center transition-opacity duration-300 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center mb-2 animate-pulse">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-medium">Chargement...</p>
            </div>
          </div>
          
          {/* Enhanced Sale Badge */}
          {product.compare_at_price && product.compare_at_price > product.price && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
            </div>
          )}
          
          {/* Enhanced Low Stock Badge */}
          {product.inventory_quantity > 0 && product.inventory_quantity <= 5 && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              Stock: {product.inventory_quantity}
            </div>
          )}
          
          {/* Enhanced Out of Stock Overlay */}
          {product.inventory_quantity === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm">Rupture de Stock</span>
              </div>
            </div>
          )}
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Enhanced Product Info */}
      <div className="p-5 flex flex-col h-full">
        {/* Brand */}
        {product.brand && (
          <div className="mb-3">
            <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide" style={{ color: '#8A2BE2', backgroundColor: 'rgba(138, 43, 226, 0.1)' }}>
              {product.brand}
            </span>
          </div>
        )}
        
        <Link href={`/products/${product.id}`} className="flex-grow">
          <h3 className="font-semibold text-gray-900 mb-2 transition-colors text-base leading-tight" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.name}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 mb-4 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5rem' }}>
          {product.description || 'Description du produit non disponible'}
        </p>
        
        {/* Rating Section */}
        <div className="mb-4">
          <ProductRating 
            productId={product.id} 
            size="sm" 
            showCount 
          />
        </div>
        
        {/* Price and Action Section */}
        <div className="flex items-end justify-between mt-auto">
          <div className="flex-1 mr-3">
            <div className="flex flex-col">
              <span className="text-lg font-bold" style={{ color: '#8A2BE2' }}>
                {formatPrice(product.price)}
              </span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
            </div>
          </div>
        
          {/* Simplified Add to Cart Icon Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.inventory_quantity === 0 || isAddingToCart}
            className={`w-11 h-11 rounded-full text-white font-semibold transition-all duration-300 transform flex items-center justify-center group shadow-lg flex-shrink-0 ${
              product.inventory_quantity === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : isAddingToCart
                ? 'bg-green-500 scale-95'
                : 'hover:scale-110'
            }`}
            style={{
              backgroundColor: product.inventory_quantity === 0 ? '#9CA3AF' : isAddingToCart ? '#10B981' : '#8A2BE2'
            }}
            onMouseEnter={(e) => {
              if (product.inventory_quantity > 0 && !isAddingToCart) {
                e.currentTarget.style.backgroundColor = '#A0522D'
              }
            }}
            onMouseLeave={(e) => {
              if (product.inventory_quantity > 0 && !isAddingToCart) {
                e.currentTarget.style.backgroundColor = '#8A2BE2'
              }
            }}
            title={product.inventory_quantity === 0 ? 'Rupture de Stock' : isAddingToCart ? 'Ajouté!' : 'Ajouter au Panier'}
          >
            {isAddingToCart ? (
              <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : product.inventory_quantity === 0 ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
})

// Display name for debugging
ProductCard.displayName = 'ProductCard'