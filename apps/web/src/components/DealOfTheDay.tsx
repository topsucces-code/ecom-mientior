'use client'

import { useActiveDeals, useTodaysDeal } from '../hooks/useDeals'
import { useCartStore } from '../lib/cart-store'
import { useRecommendationTracking } from '../hooks/useRecommendationTracking'
import Link from 'next/link'
import Image from 'next/image'
import type { DealOfTheDay as DealType } from '@ecommerce/shared/src/services/dealService'

interface DealOfTheDayProps {
  className?: string
  maxDeals?: number
  showCountdown?: boolean
}

interface DealCardProps {
  deal: DealType
  onAddToCart: (deal: DealType) => void
  showCountdown?: boolean
}

function DealCard({ deal, onAddToCart, showCountdown = true }: DealCardProps) {
  const { trackAddToCart, navigateToProduct } = useRecommendationTracking()

  const handleAddToCart = async () => {
    onAddToCart(deal)
    await trackAddToCart(deal.product.id, 1, {
      source: 'homepage',
      section: 'deal_of_the_day',
      deal_id: deal.id
    })
  }

  const handleProductClick = async () => {
    await navigateToProduct(deal.product.id, {
      source: 'homepage',
      section: 'deal_of_the_day',
      deal_id: deal.id
    })
  }

  const discountPercentage = Math.round(
    ((deal.original_price - deal.deal_price) / deal.original_price) * 100
  )

  const timeRemaining = () => {
    const now = new Date().getTime()
    const end = new Date(deal.ends_at).getTime()
    const timeLeft = end - now

    if (timeLeft <= 0) {
      return 'Deal Expired'
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return `${days}d ${remainingHours}h ${minutes}m`
    }

    return `${hours}h ${minutes}m`
  }

  return (
    <div className="group border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 bg-white">
      <div className="relative mb-4">
        <div 
          className="h-40 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
          onClick={handleProductClick}
        >
          {deal.product.images && deal.product.images.length > 0 ? (
            <Image
              src={deal.product.images[0]}
              alt={deal.product.name}
              width={200}
              height={160}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}
        </div>
        <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs font-bold rounded">
          -{discountPercentage}%
        </div>
        {deal.quantity_available && deal.quantity_sold && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 text-xs font-bold rounded">
            {deal.quantity_available - deal.quantity_sold} left
          </div>
        )}
      </div>
      
      <Link href={`/products/${deal.product.id}`}>
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 hover:text-purple-700 transition-colors cursor-pointer">
          {deal.product.name}
        </h3>
      </Link>
      
      {deal.product.brand && (
        <p className="text-xs text-gray-500 mb-2">{deal.product.brand}</p>
      )}
      
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg font-bold text-red-600">${deal.deal_price.toFixed(2)}</span>
        <span className="text-sm text-gray-500 line-through">${deal.original_price.toFixed(2)}</span>
      </div>

      {showCountdown && (
        <div className="flex items-center gap-1 mb-3 text-xs text-gray-600">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Ends in {timeRemaining()}</span>
        </div>
      )}
      
      <button 
        onClick={handleAddToCart}
        disabled={deal.product.inventory_quantity === 0}
        className="w-full text-xs font-medium py-2 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ 
          backgroundColor: deal.product.inventory_quantity === 0 ? '#6B7280' : '#A0522D', 
          color: 'white'
        }}
        onMouseEnter={(e) => {
          if (deal.product.inventory_quantity > 0) {
            e.currentTarget.style.backgroundColor = '#8B4513'
          }
        }}
        onMouseLeave={(e) => {
          if (deal.product.inventory_quantity > 0) {
            e.currentTarget.style.backgroundColor = '#A0522D'
          }
        }}
      >
        {deal.product.inventory_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  )
}

export function DealOfTheDay({ className = '', maxDeals = 4, showCountdown = true }: DealOfTheDayProps) {
  const { deals, loading, error } = useActiveDeals(maxDeals)
  const { addItem } = useCartStore()

  const handleAddToCart = (deal: DealType) => {
    addItem({
      id: deal.product.id,
      name: deal.product.name,
      price: deal.deal_price, // Use deal price instead of regular price
      image: deal.product.images?.[0] || '',
      quantity: 1
    })
  }

  if (loading) {
    return (
      <section className={`py-8 ${className}`} style={{ backgroundColor: '#8B4513' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(maxDeals)].map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={`py-8 ${className}`} style={{ backgroundColor: '#8B4513' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Deal of the Day</h2>
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600">Unable to load deals. Please try again later.</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (deals.length === 0) {
    return (
      <section className={`py-8 ${className}`} style={{ backgroundColor: '#8B4513' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Deal of the Day</h2>
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deals available</h3>
              <p className="text-gray-600">Check back later for amazing deals!</p>
              <Link 
                href="/products"
                className="inline-block mt-4 px-6 py-2 rounded-md text-white font-medium transition-colors"
                style={{ backgroundColor: '#A0522D' }}
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`py-8 ${className}`} style={{ backgroundColor: '#8B4513' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Deal of the Day</h2>
              {showCountdown && deals.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Limited Time Offers</span>
                </div>
              )}
            </div>
            <Link 
              href="/deals" 
              className="text-sm font-medium hover:underline"
              style={{ color: '#8A2BE2' }}
            >
              See all deals
            </Link>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(maxDeals, 4)} gap-6`}>
            {deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onAddToCart={handleAddToCart}
                showCountdown={showCountdown}
              />
            ))}
          </div>

          {deals.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                * Prices and availability subject to change. Limited quantities available.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default DealOfTheDay