'use client'

import { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { WishlistButton } from './WishlistButton'
import { ComparisonButton } from './ComparisonButton'
import { useSupabaseProducts, trackProductView, trackCartAddition } from '../hooks/useSupabaseProducts'
import type { Product } from '../lib/supabase'

interface SupabaseProductGridProps {
  category?: string
  featured?: boolean
  limit?: number
  search?: string
  onAddToCart?: (productId: string, product?: Product) => void
  className?: string
}

export const SupabaseProductGrid = memo(function SupabaseProductGrid({
  category,
  featured,
  limit = 8,
  search,
  onAddToCart,
  className = ''
}: SupabaseProductGridProps) {
  const { products, loading, error } = useSupabaseProducts({
    category,
    featured,
    limit,
    search,
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  const handleAddToCart = async (product: Product) => {
    await trackCartAddition(product.id)
    onAddToCart?.(product.id, product)
  }

  const handleProductClick = async (product: Product) => {
    await trackProductView(product.id)
  }

  if (loading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
        {[...Array(limit)].map((_, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-lg font-medium">Oops! Something went wrong</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
      {products.map((product) => (
        <div 
          key={product.id} 
          className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-gray-300 relative"
        >
          {/* Product Badge */}
          {product.featured && (
            <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-2 py-1 rounded text-xs font-bold">
              FEATURED
            </div>
          )}

          {/* Wishlist & Compare Buttons */}
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <WishlistButton productId={product.id} />
            <ComparisonButton product={product} />
          </div>

          {/* Product Image */}
          <Link href={`/products/${product.id}`} onClick={() => handleProductClick(product)}>
            <div className="relative h-48 bg-gray-100 overflow-hidden group-hover:scale-105 transition-transform duration-200">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Stock status overlay */}
              {product.inventory_quantity <= 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Product Info */}
          <div className="p-4">
            {/* Brand */}
            {product.brand && (
              <p className="text-xs text-purple-600 font-medium mb-1 uppercase tracking-wide">
                {product.brand}
              </p>
            )}

            {/* Product Name */}
            <Link href={`/products/${product.id}`} onClick={() => handleProductClick(product)}>
              <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors cursor-pointer leading-tight">
                {product.name}
              </h3>
            </Link>

            {/* Category */}
            {product.categories?.name && (
              <p className="text-xs text-gray-500 mb-2">
                {product.categories.name}
              </p>
            )}

            {/* Price */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <>
                  <span className="text-sm text-gray-500 line-through">
                    ${product.compare_at_price.toFixed(2)}
                  </span>
                  <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-medium">
                    {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${
                product.inventory_quantity > 10 ? 'bg-green-500' :
                product.inventory_quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-gray-600">
                {product.inventory_quantity > 10 ? 'In Stock' :
                 product.inventory_quantity > 0 ? `Only ${product.inventory_quantity} left` : 'Out of Stock'}
              </span>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={() => handleAddToCart(product)}
              disabled={product.inventory_quantity <= 0}
              className={`w-full text-sm font-medium py-2.5 px-4 rounded-md transition-all duration-200 ${
                product.inventory_quantity > 0
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {product.inventory_quantity > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5m0 0L17 21H7l2.5-2.5z" />
                  </svg>
                  Add to Cart
                </span>
              ) : (
                'Out of Stock'
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
})