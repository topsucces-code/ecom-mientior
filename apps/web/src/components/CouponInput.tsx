'use client'

import React, { useState } from 'react'
import { useCouponStore } from '../lib/coupon-store'
import { useCartStore } from '../lib/cart-store'

interface CouponInputProps {
  className?: string
}

const CouponInput: React.FC<CouponInputProps> = ({ className = '' }) => {
  const { 
    appliedCoupon, 
    discountAmount, 
    loading, 
    error, 
    applyCoupon, 
    removeCoupon,
    validateCoupon 
  } = useCouponStore()
  
  const { items } = useCartStore()
  
  const [couponCode, setCouponCode] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    setIsApplying(true)
    try {
      await applyCoupon(couponCode.trim(), items)
      setCouponCode('')
    } catch (error) {
      console.error('Failed to apply coupon:', error)
    } finally {
      setIsApplying(false)
    }
  }

  const handleRemoveCoupon = () => {
    removeCoupon()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleApplyCoupon()
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Applied Coupon Display */}
      {appliedCoupon && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Coupon Applied: <span className="font-mono">{appliedCoupon.code}</span>
                </p>
                <p className="text-xs text-green-600">
                  {appliedCoupon.description} • Saved ${discountAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-green-600 hover:text-green-800 p-1"
              title="Remove coupon"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Coupon Input Form */}
      {!appliedCoupon && (
        <div className="space-y-2">
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="Enter coupon code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                disabled={isApplying || loading}
              />
            </div>
            <button
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim() || isApplying || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isApplying ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Applying...</span>
                </div>
              ) : (
                'Apply'
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Popular Coupons Hint */}
      {!appliedCoupon && items.length > 0 && (
        <div className="text-xs text-gray-500">
          <p>💡 Try: <span className="font-mono">WELCOME10</span> for 10% off or <span className="font-mono">FREESHIP</span> for free shipping</p>
        </div>
      )}
    </div>
  )
}

export default CouponInput