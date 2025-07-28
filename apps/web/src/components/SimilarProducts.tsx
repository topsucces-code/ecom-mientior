'use client'

import { useEffect, useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import { ProductCard } from './ProductCard'
import { ProductRating } from './ProductRating'
import { useRecommendationStore } from '../lib/recommendation-store'
import { useCartStore } from '../lib/cart-store'
import { ProductService } from '../lib/products'
import type { Product, ProductRecommendation } from '@ecommerce/shared'

interface SimilarProductsProps {
  productId: string
  currentProduct?: Product
  className?: string
  limit?: number
  showCompactView?: boolean
  title?: string
}

export const SimilarProducts = memo(function SimilarProducts({
  productId,
  currentProduct,
  className = '',
  limit = 8,
  showCompactView = false,
  title = "Produits similaires"
}: SimilarProductsProps) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { getSimilarProducts, trackInteraction, similarProducts } = useRecommendationStore()
  const { addItem } = useCartStore()

  useEffect(() => {
    const loadSimilarProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get similar product recommendations
        const similarRecs = await getSimilarProducts(productId, limit)
        setRecommendations(similarRecs)

        if (similarRecs.length > 0) {
          const productIds = similarRecs.map(r => r.product_id)
          const productsData = await ProductService.getProductsByIds(productIds)
          
          // Sort products by recommendation order
          const sortedProducts = productIds
            .map(id => productsData.find(p => p.id === id))
            .filter(Boolean) as Product[]
          
          setProducts(sortedProducts)
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des produits similaires')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      loadSimilarProducts()
    }
  }, [productId, limit, getSimilarProducts])

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
      source: 'similar_products',
      origin_product: productId,
      similarity_score: recommendations.find(r => r.product_id === product.id)?.score
    })
  }

  const handleProductClick = async (clickedProductId: string) => {
    await trackInteraction(clickedProductId, 'view', {
      source: 'similar_products',
      origin_product: productId,
      similarity_score: recommendations.find(r => r.product_id === clickedProductId)?.score
    })
    
    router.push(`/products/${clickedProductId}`)
  }

  const getSimilarityBadge = (score: number) => {
    if (score >= 0.8) return { text: 'Très similaire', color: 'bg-green-500' }
    if (score >= 0.6) return { text: 'Similaire', color: 'bg-blue-500' }
    if (score >= 0.4) return { text: 'Comparable', color: 'bg-yellow-500' }
    return { text: 'Connexe', color: 'bg-gray-500' }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className={`grid ${showCompactView ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <div className="max-w-md mx-auto">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun produit similaire trouvé
          </h3>
          <p className="text-gray-600">
            Nous n'avons pas encore de recommandations similaires pour ce produit.
          </p>
        </div>
      </div>
    )
  }

  if (showCompactView) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            🔗 {title}
          </h2>
          <span className="text-sm text-gray-500">
            {products.length} produit{products.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Compact Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {products.map((product, index) => {
            const recommendation = recommendations[index]
            const badge = getSimilarityBadge(recommendation?.score || 0)
            
            return (
              <div key={product.id} className="relative group">
                <div 
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => handleProductClick(product.id)}
                >
                  {/* Similarity Badge */}
                  <div className={`absolute top-2 left-2 ${badge.color} text-white text-xs font-medium px-2 py-1 rounded-full z-10`}>
                    {Math.round((recommendation?.score || 0) * 100)}%
                  </div>
                  
                  {/* Product Image */}
                  <div className="h-32 bg-gray-100 flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                    <div className="text-sm font-bold text-gray-900 mb-2">
                      ${product.price}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCart(product)
                      }}
                      className="w-full text-xs font-medium py-1 px-2 rounded transition-colors"
                      style={{ backgroundColor: '#A0522D', color: 'white' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#8B4513'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#A0522D'
                      }}
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            🔗 {title}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            D'autres clients ont également consulté ces produits
          </p>
        </div>
        <span className="text-sm text-gray-500">
          {products.length} produit{products.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product, index) => {
          const recommendation = recommendations[index]
          const badge = getSimilarityBadge(recommendation?.score || 0)
          
          return (
            <div key={product.id} className="relative">
              {/* Similarity Badge */}
              <div className={`absolute top-4 left-4 ${badge.color} text-white text-sm font-medium px-3 py-1 rounded-full z-10`}>
                {badge.text}
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
                {/* Product Image */}
                <div 
                  className="relative h-48 bg-gray-100 cursor-pointer group"
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Sale Badge */}
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                      {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}% OFF
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
                <div className="p-4">
                  {/* Similarity Reason */}
                  <div className="mb-2">
                    <span className="text-xs text-purple-600 font-medium">
                      {recommendation?.reason || 'Produit similaire'}
                    </span>
                  </div>
                  
                  {/* Product Name */}
                  <h3 
                    className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-purple-700 transition-colors cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  >
                    {product.name}
                  </h3>
                  
                  {/* Brand */}
                  {product.brand && (
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                      {product.brand}
                    </p>
                  )}
                  
                  {/* Rating */}
                  <div className="mb-3">
                    <ProductRating 
                      productId={product.id} 
                      size="sm" 
                      showCount={false}
                    />
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-lg font-bold text-gray-900">
                        ${product.price}
                      </span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ${product.compare_at_price}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.inventory_quantity === 0}
                    className="w-full text-xs font-medium py-2 px-3 rounded-md transition-colors"
                    style={{ 
                      backgroundColor: product.inventory_quantity > 0 ? '#A0522D' : '#9CA3AF',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      if (product.inventory_quantity > 0) {
                        e.currentTarget.style.backgroundColor = '#8B4513'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (product.inventory_quantity > 0) {
                        e.currentTarget.style.backgroundColor = '#A0522D'
                      }
                    }}
                  >
                    {product.inventory_quantity === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                  </button>
                  
                  {/* Comparison */}
                  {currentProduct && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Comparaison:</span>
                        <div className="flex items-center gap-2">
                          {product.price < currentProduct.price && (
                            <span className="text-green-600 font-medium">
                              -{Math.round(((currentProduct.price - product.price) / currentProduct.price) * 100)}%
                            </span>
                          )}
                          {product.price > currentProduct.price && (
                            <span className="text-red-600 font-medium">
                              +{Math.round(((product.price - currentProduct.price) / currentProduct.price) * 100)}%
                            </span>
                          )}
                          {product.price === currentProduct.price && (
                            <span className="text-gray-600">Même prix</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})