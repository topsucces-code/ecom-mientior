'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '../../components/Header'
import { Button, Input } from '@ecommerce/ui'
import { 
  useCartStore,
  useCartItemCount,
  useCartSubtotal,
  useCartTax,
  useCartShipping,
  useCartDiscount,
  useCartTotal,
  useCartIsEmpty
} from '../../lib/cart-store'
import { useAuthStore } from '../../lib/auth-store'
import { useOrderStore } from '../../lib/order-store'

interface ShippingAddress {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface PaymentMethod {
  type: 'card' | 'paypal' | 'apple_pay'
  cardNumber: string
  expiryDate: string
  cvv: string
  cardName: string
}

type CheckoutStep = 'shipping' | 'payment' | 'review'

export default function CheckoutPage() {
  const { user } = useAuthStore()
  const { items, clearCart } = useCartStore()
  const { createOrder } = useOrderStore()
  
  const itemCount = useCartItemCount()
  const subtotal = useCartSubtotal()
  const tax = useCartTax()
  const shipping = useCartShipping()
  const discount = useCartDiscount()
  const total = useCartTotal()
  const isEmpty = useCartIsEmpty()

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  })

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    type: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  })

  const [agreementAccepted, setAgreementAccepted] = useState(false)

  useEffect(() => {
    if (isEmpty) {
      // Redirect to home if cart is empty
      window.location.href = '/'
    }
  }, [isEmpty])

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`
  }

  const steps = [
    { id: 'shipping', name: 'Shipping', completed: false },
    { id: 'payment', name: 'Payment', completed: false },
    { id: 'review', name: 'Review', completed: false }
  ]

  const isStepCompleted = (step: CheckoutStep) => {
    switch (step) {
      case 'shipping':
        return !!(shippingAddress.firstName && shippingAddress.lastName && 
                 shippingAddress.email && shippingAddress.address && 
                 shippingAddress.city && shippingAddress.zipCode)
      case 'payment':
        return paymentMethod.type === 'paypal' || paymentMethod.type === 'apple_pay' ||
               (paymentMethod.cardNumber && paymentMethod.expiryDate && 
                paymentMethod.cvv && paymentMethod.cardName)
      case 'review':
        return agreementAccepted
      default:
        return false
    }
  }

  const canProceedToNext = () => {
    return isStepCompleted(currentStep)
  }

  const handleNextStep = () => {
    if (currentStep === 'shipping' && canProceedToNext()) {
      setCurrentStep('payment')
    } else if (currentStep === 'payment' && canProceedToNext()) {
      setCurrentStep('review')
    }
  }

  const handlePreviousStep = () => {
    if (currentStep === 'payment') {
      setCurrentStep('shipping')
    } else if (currentStep === 'review') {
      setCurrentStep('payment')
    }
  }

  const handlePlaceOrder = async () => {
    if (!agreementAccepted || !canProceedToNext()) return

    setIsProcessing(true)
    
    try {
      // Create order
      const orderData = {
        userId: user?.id,
        status: 'pending' as const,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        shippingAddress,
        paymentMethod: paymentMethod.type === 'card' 
          ? `Credit Card ending in ${paymentMethod.cardNumber.slice(-4)}`
          : paymentMethod.type === 'paypal' 
            ? 'PayPal'
            : 'Apple Pay',
        subtotal,
        tax,
        shipping,
        discount,
        total,
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      }

      const order = await createOrder(orderData)
      
      // Clear cart and redirect to success page with order number
      clearCart()
      window.location.href = `/order-success?orderNumber=${order.orderNumber}`
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('Failed to process order. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isEmpty) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">Checkout</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your purchase securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                      ${currentStep === step.id 
                        ? 'bg-gray-900 text-white' 
                        : isStepCompleted(step.id as CheckoutStep)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {isStepCompleted(step.id as CheckoutStep) ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        currentStep === step.id ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.name}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 mx-4 h-0.5 bg-gray-200"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Information */}
            {currentStep === 'shipping' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Shipping Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <Input
                      value={shippingAddress.firstName}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <Input
                      value={shippingAddress.lastName}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={shippingAddress.email}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <Input
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter street address"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <Input
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <Input
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="Enter state"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <Input
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="Enter ZIP code"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <select
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="France">France</option>
                      <option value="Germany">Germany</option>
                    </select>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={handleNextStep}
                    disabled={!canProceedToNext()}
                    className="px-8"
                  >
                    Continue to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Method */}
            {currentStep === 'payment' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Method</h3>
                
                {/* Payment Type Selection */}
                <div className="mb-6">
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setPaymentMethod(prev => ({ ...prev, type: 'card' }))}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                        paymentMethod.type === 'card' 
                          ? 'border-gray-900 bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="text-sm font-medium">Credit Card</span>
                    </button>
                    
                    <button
                      onClick={() => setPaymentMethod(prev => ({ ...prev, type: 'paypal' }))}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                        paymentMethod.type === 'paypal' 
                          ? 'border-gray-900 bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
                        PP
                      </div>
                      <span className="text-sm font-medium">PayPal</span>
                    </button>
                    
                    <button
                      onClick={() => setPaymentMethod(prev => ({ ...prev, type: 'apple_pay' }))}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                        paymentMethod.type === 'apple_pay' 
                          ? 'border-gray-900 bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-xs">
                        🍎
                      </div>
                      <span className="text-sm font-medium">Apple Pay</span>
                    </button>
                  </div>
                </div>

                {/* Credit Card Form */}
                {paymentMethod.type === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number *
                      </label>
                      <Input
                        value={paymentMethod.cardNumber}
                        onChange={(e) => setPaymentMethod(prev => ({ ...prev, cardNumber: e.target.value }))}
                        placeholder="1234 5678 9012 3456"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date *
                        </label>
                        <Input
                          value={paymentMethod.expiryDate}
                          onChange={(e) => setPaymentMethod(prev => ({ ...prev, expiryDate: e.target.value }))}
                          placeholder="MM/YY"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV *
                        </label>
                        <Input
                          value={paymentMethod.cvv}
                          onChange={(e) => setPaymentMethod(prev => ({ ...prev, cvv: e.target.value }))}
                          placeholder="123"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cardholder Name *
                      </label>
                      <Input
                        value={paymentMethod.cardName}
                        onChange={(e) => setPaymentMethod(prev => ({ ...prev, cardName: e.target.value }))}
                        placeholder="Name on card"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Alternative Payment Methods */}
                {paymentMethod.type === 'paypal' && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">You will be redirected to PayPal to complete your payment.</p>
                    <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-white font-bold text-2xl">
                      PP
                    </div>
                  </div>
                )}

                {paymentMethod.type === 'apple_pay' && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Use Touch ID or Face ID to pay with Apple Pay.</p>
                    <div className="w-16 h-16 bg-black rounded-full mx-auto flex items-center justify-center text-white font-bold text-2xl">
                      🍎
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                  >
                    Back to Shipping
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    disabled={!canProceedToNext()}
                    className="px-8"
                  >
                    Review Order
                  </Button>
                </div>
              </div>
            )}

            {/* Order Review */}
            {currentStep === 'review' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Review Your Order</h3>
                
                {/* Order Items */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-4">Order Items ({itemCount})</h4>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-100">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{item.name}</h5>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                          <p className="text-sm text-gray-500">{formatPrice(item.price)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
                  <div className="text-sm text-gray-600">
                    <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                    <p>{shippingAddress.address}</p>
                    <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                    <p>{shippingAddress.country}</p>
                    <p>{shippingAddress.email}</p>
                    {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Payment Method</h4>
                  <div className="text-sm text-gray-600">
                    {paymentMethod.type === 'card' && (
                      <p>Credit Card ending in {paymentMethod.cardNumber.slice(-4)}</p>
                    )}
                    {paymentMethod.type === 'paypal' && <p>PayPal</p>}
                    {paymentMethod.type === 'apple_pay' && <p>Apple Pay</p>}
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="mb-6">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={agreementAccepted}
                      onChange={(e) => setAgreementAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                      I agree to the{' '}
                      <Link href="/terms" className="text-blue-600 hover:text-blue-700 underline">
                        Terms and Conditions
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                  >
                    Back to Payment
                  </Button>
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={!agreementAccepted || isProcessing}
                    className="px-8"
                  >
                    {isProcessing ? 'Processing...' : `Place Order - ${formatPrice(total)}`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({itemCount} items)</span>
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
                    🎉 Free shipping applied!
                  </div>
                )}
                
                <div className="border-t pt-3 flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure SSL encrypted checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}