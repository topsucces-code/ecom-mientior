'use client'

import { memo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  useCartStore, 
  useCartItemCount, 
  useCartSubtotal, 
  useCartTax,
  useCartShipping,
  useCartDiscount,
  useCartTotal,
  useCartIsEmpty
} from '../lib/cart-store'
import { Button } from '@ecommerce/ui'

interface QuantityControlsProps {
  productId: string
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
  onRemove: () => void
}

const QuantityControls = memo(function QuantityControls({ 
  quantity, 
  onIncrease, 
  onDecrease, 
  onRemove 
}: QuantityControlsProps) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onDecrease}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
        disabled={quantity <= 1}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      
      <span className="w-8 text-center font-medium">{quantity}</span>
      
      <button
        onClick={onIncrease}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      
      <button
        onClick={onRemove}
        className="ml-2 text-red-500 hover:text-red-700 transition-colors"
        title="Remove item"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
})

export const Cart = memo(function Cart() {
  const {
    items,
    isOpen,
    loading,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
    toggleCart,
    applyDiscount,
    removeDiscount,
    discountAmount
  } = useCartStore()
  
  const [discountCode, setDiscountCode] = useState('')
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  
  const itemCount = useCartItemCount()
  const subtotal = useCartSubtotal()
  const tax = useCartTax()
  const shipping = useCartShipping()
  const discount = useCartDiscount()
  const total = useCartTotal()
  const isEmpty = useCartIsEmpty()

  const handleApplyDiscount = async () => {
    setIsApplyingDiscount(true)
    
    // Simulate discount code validation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const discountCodes: Record<string, number> = {
      'SAVE10': 10,
      'WELCOME20': 20,
      'FREESHIP': 15,
      'STUDENT': 25
    }
    
    const discountValue = discountCodes[discountCode.toUpperCase()]
    
    if (discountValue) {
      applyDiscount(discountValue)
      setDiscountCode('')
    } else {
      alert('Invalid discount code')
    }
    
    setIsApplyingDiscount(false)
  }

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={toggleCart} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Shopping Cart ({itemCount})
            </h2>
            <button
              onClick={toggleCart}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : isEmpty ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-6">Add some products to get started!</p>
                <Button onClick={toggleCart} className="w-full">
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="px-6 py-4 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 bg-gray-50 rounded-lg p-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.price)} each
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <QuantityControls
                        productId={item.id}
                        quantity={item.quantity}
                        onIncrease={() => increaseQuantity(item.id)}
                        onDecrease={() => decreaseQuantity(item.id)}
                        onRemove={() => removeItem(item.id)}
                      />
                    </div>
                  </div>
                ))}
                
                {/* Clear Cart Button */}
                {!isEmpty && (
                  <button
                    onClick={clearCart}
                    className="w-full mt-4 text-sm text-red-600 hover:text-red-800 transition-colors"
                  >
                    Clear Cart
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {!isEmpty && (
            <div className="border-t bg-gray-50 px-6 py-4">
              {/* Discount Code */}
              <div className="mb-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Discount code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleApplyDiscount}
                    disabled={!discountCode.trim() || isApplyingDiscount}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isApplyingDiscount ? '...' : 'Apply'}
                  </button>
                </div>
                
                {discount > 0 && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-green-600">Discount applied!</span>
                    <button
                      onClick={removeDiscount}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? 'Free' : formatPrice(shipping)}
                  </span>
                </div>
                
                {subtotal >= 50 && shipping === 0 && (
                  <div className="text-xs text-green-600">
                    🎉 You qualified for free shipping!
                  </div>
                )}
                
                <div className="border-t pt-2 flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <Link 
                  href="/checkout"
                  onClick={toggleCart}
                  className="block w-full bg-gray-900 text-white text-center py-3 px-4 rounded-md font-medium hover:bg-gray-800 transition-colors"
                >
                  Checkout
                </Link>
                
                <button
                  onClick={toggleCart}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})