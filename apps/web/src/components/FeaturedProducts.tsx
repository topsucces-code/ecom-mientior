'use client'

import { useFeaturedProducts } from '../hooks/useFeaturedProducts'
import { useCartStore } from '../lib/cart-store'
import { useRecommendationTracking } from '../hooks/useRecommendationTracking'
import { useProductDeal } from '../hooks/useDeals'
import Link from 'next/link'
import Image from 'next/image'
import type { ProductWithCategory } from '@ecommerce/shared/src/services/supabaseProductService'

type Product = ProductWithCategory

interface FeaturedProductsProps {
  className?: string
  maxProducts?: number
  showBadges?: boolean
  layout?: 'grid' | 'carousel'
}

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  showBadges?: boolean
}

function ProductCard({ product, onAddToCart, showBadges = true }: ProductCardProps) {
  const { trackAddToCart, navigateToProduct } = useRecommendationTracking()
  const { deal } = useProductDeal(product.id)

  const handleAddToCart = async () => {
    onAddToCart(product)
    await trackAddToCart(product.id, 1, {
      source: 'homepage',
      section: 'featured_products',
      product_name: product.name,
      price: deal?.deal_price || product.price
    })
  }

  const handleProductClick = async () => {
    await navigateToProduct(product.id, {
      source: 'homepage',
      section: 'featured_products'
    })
  }

  // Determine badge based on product properties and deals
  const getBadge = () => {
    if (deal) return { text: `${deal.discount_percentage}% OFF`, color: 'bg-red-600' }
    if (product.featured) return { text: 'FEATURED', color: 'bg-purple-600' }
    
    // Check if product was created recently (within 7 days)
    const createdAt = new Date(product.created_at)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    if (createdAt > weekAgo) return { text: 'NEW', color: 'bg-green-600' }
    
    return null
  }

  const badge = getBadge()
  const displayPrice = deal?.deal_price || product.price
  const originalPrice = deal?.original_price

  return (
    <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 relative">
      {showBadges && badge && (
        <div className={`absolute top-2 left-2 z-10 px-2 py-1 rounded text-xs font-bold text-white ${badge.color}`}>
          {badge.text}
        </div>
      )}
      
      <div 
        className="relative h-48 bg-gray-50 overflow-hidden cursor-pointer"
        onClick={handleProductClick}
      >
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            width={240}
            height={192}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-3">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 hover:text-purple-700 transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>
        
        {product.category && (
          <p className="text-xs text-gray-500 mb-2">{product.category.name}</p>
        )}
        
        {/* Rating placeholder - could be enhanced with actual rating data */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className={`w-3 h-3 ${i < 4 ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-500">(4.0)</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-lg font-bold ${deal ? 'text-red-600' : 'text-gray-900'}`}>
            ${displayPrice.toFixed(2)}
          </span>
          {originalPrice && originalPrice > displayPrice && (
            <span className="text-sm text-gray-500 line-through">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock indicator */}
        {product.inventory_quantity !== undefined && product.inventory_quantity <= 5 && product.inventory_quantity > 0 && (
          <p className="text-xs text-orange-600 mb-2">
            Only {product.inventory_quantity} left in stock!
          </p>
        )}
        {product.inventory_quantity === 0 && (
          <p className="text-xs text-red-600 mb-2">
            Out of Stock
          </p>
        )}

        <button 
          onClick={handleAddToCart}
          disabled={product.inventory_quantity === 0 || product.status !== 'active'}
          className="w-full text-xs font-medium py-2 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: (product.inventory_quantity === 0 || product.status !== 'active') ? '#6B7280' : '#A0522D', 
            color: 'white'
          }}
          onMouseEnter={(e) => {
            if (product.inventory_quantity > 0 && product.status === 'active') {
              e.currentTarget.style.backgroundColor = '#8B4513'
            }
          }}
          onMouseLeave={(e) => {
            if (product.inventory_quantity > 0 && product.status === 'active') {
              e.currentTarget.style.backgroundColor = '#A0522D'
            }
          }}
        >
          {product.inventory_quantity === 0 ? 'Out of Stock' : product.status !== 'active' ? 'Unavailable' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}

export function FeaturedProducts({ 
  className = '', 
  maxProducts = 6, 
  showBadges = true,
  layout = 'grid'
}: FeaturedProductsProps) {
  const { products, loading, error } = useFeaturedProducts(maxProducts)
  const { addItem } = useCartStore()

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      quantity: 1
    })
  }

  if (loading) {
    return (
      <section className={`py-8 bg-white ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(maxProducts)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={`py-8 bg-white ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link 
              href="/products" 
              className="text-sm font-medium hover:underline"
              style={{ color: '#8A2BE2' }}
            >
              See all products
            </Link>
          </div>
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600">Unable to load featured products. Please try again later.</p>
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className={`py-8 bg-white ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link 
              href="/products" 
              className="text-sm font-medium hover:underline"
              style={{ color: '#8A2BE2' }}
            >
              See all products
            </Link>
          </div>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No featured products</h3>
            <p className="text-gray-600">Check back later for our featured products!</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`py-8 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link 
            href="/products" 
            className="text-sm font-medium hover:underline"
            style={{ color: '#8A2BE2' }}
          >
            See all products
          </Link>
        </div>

        <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 ${layout === 'carousel' ? 'overflow-x-auto' : ''}`}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              showBadges={showBadges}
            />
          ))}
        </div>

        {products.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Showing {products.length} featured products
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default FeaturedProducts