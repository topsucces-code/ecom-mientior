'use client'

import { useState } from 'react'
import { useSupabaseWishlist } from '../hooks/useSupabaseWishlist'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'

interface WishlistButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function WishlistButton({ 
  productId, 
  className = '', 
  size = 'md',
  showText = false 
}: WishlistButtonProps) {
  const [loading, setLoading] = useState(false)
  const { isInWishlist, toggleWishlist } = useSupabaseWishlist()
  const { user } = useSupabaseAuth()
  const inWishlist = isInWishlist(productId)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      // Could trigger auth modal here
      alert('Please sign in to add items to your wishlist')
      return
    }

    setLoading(true)
    try {
      await toggleWishlist(productId)
    } catch (error) {
      console.error('Error toggling wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const sizes = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        ${sizes[size]}
        ${inWishlist 
          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
          : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-red-500'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        rounded-full flex items-center justify-center transition-all duration-200
        shadow-sm hover:shadow-md border border-transparent hover:border-red-200
        ${showText ? 'px-4 w-auto gap-2' : ''}
        ${className}
      `}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {loading ? (
        <svg className={`${iconSizes[size]} animate-spin`} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg 
          className={iconSizes[size]} 
          fill={inWishlist ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={inWishlist ? 1 : 2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
      )}
      {showText && (
        <span className="text-sm font-medium">
          {inWishlist ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  )
}