import React from 'react'
import { cn } from '../lib/utils'
import { Button } from './Button'

interface ProductCardProps {
  id: string
  name: string
  price: number
  compareAtPrice?: number
  image?: string
  images?: string[]
  brand?: string
  inStock: boolean
  featured?: boolean
  className?: string
  onAddToCart?: (productId: string) => void
  onViewProduct?: (productId: string) => void
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  compareAtPrice,
  image,
  images = [],
  brand,
  inStock,
  featured,
  className,
  onAddToCart,
  onViewProduct,
}) => {
  const displayImage = image || images[0]
  const hasDiscount = compareAtPrice && compareAtPrice > price
  const discountPercent = hasDiscount 
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className={cn('group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow', className)}>
      {featured && (
        <div className="absolute top-2 left-2 z-10 bg-primary-600 text-white text-xs px-2 py-1 rounded">
          Featured
        </div>
      )}
      
      {hasDiscount && (
        <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-xs px-2 py-1 rounded">
          -{discountPercent}%
        </div>
      )}

      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        {!inStock && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-4">
        {brand && (
          <p className="text-sm text-gray-500 mb-1">{brand}</p>
        )}
        
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
          {name}
        </h3>

        <div className="flex items-center space-x-2 mb-3">
          <span className="text-lg font-semibold text-gray-900">
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(compareAtPrice)}
            </span>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewProduct?.(id)}
          >
            View Details
          </Button>
          
          {inStock && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onAddToCart?.(id)}
            >
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}