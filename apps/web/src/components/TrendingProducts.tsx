'use client'

import { useEffect, useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import { ProductCard } from './ProductCard'
import { ProductRating } from './ProductRating'
import { useRecommendationStore } from '../lib/recommendation-store'
import { useCartStore } from '../lib/cart-store'
import { ProductService } from '../lib/products'
import type { Product, ProductRecommendation } from '@ecommerce/shared'

interface TrendingProductsProps {
  category?: string
  timePeriod?: '1h' | '24h' | '7d' | '30d'
  limit?: number
  layout?: 'grid' | 'list' | 'compact'
  showTimeFilter?: boolean
  className?: string
}

export const TrendingProducts = memo(function TrendingProducts({
  category,
  timePeriod = '24h',
  limit = 20,
  layout = 'grid',
  showTimeFilter = true,
  className = ''
}: TrendingProductsProps) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState(timePeriod)
  
  const { getTrendingProducts, trackInteraction } = useRecommendationStore()
  const { addItem } = useCartStore()

  useEffect(() => {
    const loadTrendingProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        await getTrendingProducts(category, selectedPeriod)
        
        // Get the trending recommendations from store
        const trendingRecs = useRecommendationStore.getState().trendingProducts.slice(0, limit)
        setRecommendations(trendingRecs)

        if (trendingRecs.length > 0) {
          const productIds = trendingRecs.map(r => r.product_id)
          const productsData = await ProductService.getProductsByIds(productIds)
          
          // Sort products by recommendation order
          const sortedProducts = productIds
            .map(id => productsData.find(p => p.id === id))
            .filter(Boolean) as Product[]
          
          setProducts(sortedProducts)
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tendances')
      } finally {
        setLoading(false)
      }
    }

    loadTrendingProducts()
  }, [category, selectedPeriod, limit, getTrendingProducts])

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
      source: 'trending_products',
      category: category || 'all',
      time_period: selectedPeriod
    })
  }

  const handleProductClick = async (product: Product) => {
    await trackInteraction(product.id, 'view', {
      source: 'trending_products',
      category: category || 'all',
      time_period: selectedPeriod
    })
    
    router.push(`/products/${product.id}`)
  }

  const timePeriodLabels = {
    '1h': 'Dernière heure',
    '24h': 'Dernières 24h',
    '7d': 'Cette semaine',
    '30d': 'Ce mois'
  }

  const getTrendingIcon = (period: string) => {
    switch (period) {
      case '1h': return '⚡'
      case '24h': return '🔥'
      case '7d': return '📈'
      case '30d': return '⭐'
      default: return '🔥'
    }
  }

  const getTrendingBadge = (index: number) => {
    if (index === 0) return { text: '#1', color: 'bg-yellow-500' }
    if (index === 1) return { text: '#2', color: 'bg-gray-400' }
    if (index === 2) return { text: '#3', color: 'bg-amber-600' }
    return { text: `#${index + 1}`, color: 'bg-purple-500' }
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className={`grid ${layout === 'grid' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-1'} gap-4`}>
            {[...Array(8)].map((_, index) => (
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune tendance disponible
          </h3>
          <p className="text-gray-600">
            Aucun produit tendance pour cette période dans {category ? 'cette catégorie' : 'toutes les catégories'}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {getTrendingIcon(selectedPeriod)} Produits tendance
            {category && <span className="text-lg font-normal text-gray-600">- {category}</span>}
          </h2>
          <p className="text-gray-600 mt-1">
            Les plus populaires ({timePeriodLabels[selectedPeriod]})
          </p>
        </div>
        
        {/* Time Period Filter */}
        {showTimeFilter && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Période :</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {Object.entries(timePeriodLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className={`grid gap-4 ${
        layout === 'grid' 
          ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' 
          : layout === 'list'
          ? 'grid-cols-1'
          : 'grid-cols-3 md:grid-cols-6 lg:grid-cols-8'
      }`}>
        {products.map((product, index) => {
          const recommendation = recommendations[index]
          const badge = getTrendingBadge(index)
          
          if (layout === 'compact') {
            return (
              <div key={product.id} className="relative group">
                <div 
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  {/* Trending Badge */}
                  <div className={`absolute top-2 left-2 ${badge.color} text-white text-xs font-bold px-2 py-1 rounded-full z-10`}>
                    {badge.text}
                  </div>
                  
                  {/* Product Image */}
                  <div className="h-24 bg-gray-100 flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-2">
                    <h3 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    <div className="text-sm font-bold text-gray-900">
                      ${product.price}
                    </div>
                  </div>
                </div>
              </div>
            )
          }
          
          return (
            <div key={product.id} className="relative">
              {/* Trending Badge */}
              <div className={`absolute top-4 left-4 ${badge.color} text-white text-sm font-bold px-3 py-1 rounded-full z-10`}>
                {badge.text}
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
                {/* Product Image */}
                <div 
                  className="relative h-48 bg-gray-100 cursor-pointer group"
                  onClick={() => handleProductClick(product)}
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
                  {/* Trending Info */}
                  <div className="mb-2">
                    <span className="text-xs text-purple-600 font-medium">
                      {recommendation?.reason || 'Produit tendance'}
                    </span>
                  </div>
                  
                  {/* Product Name */}
                  <h3 
                    className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-purple-700 transition-colors cursor-pointer"
                    onClick={() => handleProductClick(product)}
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
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})