'use client'

import { useState } from 'react'
import { Order, OrderStatus } from '../lib/order-store'

interface OrderTrackingProps {
  order: Order
}

const trackingSteps = [
  {
    id: 'confirmed',
    label: 'Order Confirmed',
    description: 'We have received your order',
    icon: 'M5 13l4 4L19 7'
  },
  {
    id: 'processing',
    label: 'Processing',
    description: 'Your order is being prepared',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  {
    id: 'shipped',
    label: 'Shipped',
    description: 'Your order is on its way',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
  },
  {
    id: 'delivered',
    label: 'Delivered',
    description: 'Your order has been delivered',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  }
]

const getStepIndex = (status: OrderStatus): number => {
  const stepMap: Record<OrderStatus, number> = {
    pending: -1,
    confirmed: 0,
    processing: 1,
    shipped: 2,
    delivered: 3,
    cancelled: -1
  }
  return stepMap[status] ?? -1
}

export function OrderTracking({ order }: OrderTrackingProps) {
  const currentStepIndex = getStepIndex(order.status)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  if (order.status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-900">Order Cancelled</h3>
            <p className="text-red-700">This order has been cancelled.</p>
          </div>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {trackingSteps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                  index <= currentStepIndex
                    ? 'bg-green-500 border-green-500 text-white'
                    : index === currentStepIndex + 1
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                </svg>
              </div>
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${
                  index <= currentStepIndex ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-500 max-w-20">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -z-0">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{
              width: `${Math.max(0, (currentStepIndex / (trackingSteps.length - 1)) * 100)}%`
            }}
          />
        </div>
      </div>

      {/* Detailed Timeline */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Order Timeline</h4>
        
        {trackingSteps.map((step, index) => (
          <div
            key={step.id}
            className={`border rounded-lg p-4 transition-colors ${
              index <= currentStepIndex
                ? 'border-green-200 bg-green-50'
                : index === currentStepIndex + 1
                ? 'border-blue-200 bg-blue-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentStepIndex
                      ? 'bg-green-500 text-white'
                      : index === currentStepIndex + 1
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {index <= currentStepIndex ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div>
                  <h5 className={`font-medium ${
                    index <= currentStepIndex ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {step.label}
                  </h5>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
              
              {index <= currentStepIndex && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {index === 0 ? formatDate(order.createdAt) : 
                     index === 1 ? 'Processing' :
                     index === 2 ? (order.trackingNumber ? 'Shipped' : 'Processing') :
                     formatDate(order.estimatedDelivery)}
                  </p>
                  {index === currentStepIndex && index < trackingSteps.length - 1 && (
                    <p className="text-xs text-blue-600">Current Status</p>
                  )}
                </div>
              )}
            </div>

            {/* Expandable Details */}
            {(step.id === 'shipped' && order.trackingNumber) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="bg-white rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tracking Number</p>
                      <p className="text-sm font-mono text-gray-600">{order.trackingNumber}</p>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Track Package
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Estimated Delivery */}
      {order.status !== 'delivered' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Estimated Delivery: {formatDate(order.estimatedDelivery)}
              </p>
              <p className="text-xs text-blue-700">
                Your order should arrive by this date
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}