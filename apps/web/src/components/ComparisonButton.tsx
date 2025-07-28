'use client'

import { useState } from 'react'
import { useComparisonStore } from '../lib/comparison-store'
import type { Product } from '../lib/supabase'

interface ComparisonButtonProps {
  product: Product
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function ComparisonButton({ 
  product, 
  className = '', 
  size = 'md',
  showText = false 
}: ComparisonButtonProps) {
  const { addItem, removeItem, isInComparison, canAddMore, getItemCount, maxItems } = useComparisonStore()
  const [showTooltip, setShowTooltip] = useState(false)
  
  // Defensive check for product
  if (!product || !product.id) {
    return null
  }
  
  const inComparison = isInComparison(product.id)

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (inComparison) {
      removeItem(product.id)
    } else {
      const success = addItem(product)
      if (!success && !canAddMore()) {
        // Show tooltip for maximum reached
        setShowTooltip(true)
        setTimeout(() => setShowTooltip(false), 2000)
      }
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

  const cannotAdd = !canAddMore() && !inComparison

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        disabled={cannotAdd}
        className={`
          ${sizes[size]}
          ${inComparison 
            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
            : cannotAdd
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-blue-500'
          }
          rounded-full flex items-center justify-center transition-all duration-200
          shadow-sm hover:shadow-md border border-transparent hover:border-blue-200
          ${showText ? 'px-4 w-auto gap-2' : ''}
          ${className}
        `}
        title={
          cannotAdd 
            ? `Maximum ${maxItems} products for comparison`
            : inComparison 
              ? 'Remove from comparison' 
              : 'Add to comparison'
        }
      >
        <svg 
          className={iconSizes[size]} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
          />
        </svg>
        {showText && (
          <span className="text-sm font-medium">
            {inComparison ? 'Added' : 'Compare'}
          </span>
        )}
      </button>

      {/* Tooltip for maximum reached */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50">
          Maximum {maxItems} products for comparison
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}