'use client'

import { useState } from 'react'
import { useOrderStore, OrderStatus } from '../lib/order-store'

interface OrderStatusUpdaterProps {
  orderId: string
  currentStatus: OrderStatus
  onStatusUpdate?: (newStatus: OrderStatus) => void
}

const statusOptions: { value: OrderStatus; label: string; description: string }[] = [
  { value: 'pending', label: 'Pending', description: 'Order placed, awaiting confirmation' },
  { value: 'confirmed', label: 'Confirmed', description: 'Order confirmed and accepted' },
  { value: 'processing', label: 'Processing', description: 'Order is being prepared' },
  { value: 'shipped', label: 'Shipped', description: 'Order has been shipped' },
  { value: 'delivered', label: 'Delivered', description: 'Order has been delivered' },
  { value: 'cancelled', label: 'Cancelled', description: 'Order has been cancelled' }
]

export function OrderStatusUpdater({ orderId, currentStatus, onStatusUpdate }: OrderStatusUpdaterProps) {
  const { updateOrderStatus, addTrackingNumber } = useOrderStore()
  const [isUpdating, setIsUpdating] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [showTrackingInput, setShowTrackingInput] = useState(false)

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (newStatus === currentStatus) return

    setIsUpdating(true)
    try {
      await updateOrderStatus(orderId, newStatus)
      onStatusUpdate?.(newStatus)
      
      // If status is being set to shipped, prompt for tracking number
      if (newStatus === 'shipped') {
        setShowTrackingInput(true)
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      alert('Failed to update order status. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddTracking = async () => {
    if (!trackingNumber.trim()) {
      alert('Please enter a tracking number')
      return
    }

    setIsUpdating(true)
    try {
      await addTrackingNumber(orderId, trackingNumber.trim())
      setTrackingNumber('')
      setShowTrackingInput(false)
      alert('Tracking number added successfully!')
    } catch (error) {
      console.error('Failed to add tracking number:', error)
      alert('Failed to add tracking number. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  // This is a demo component - in real app, this would be admin-only
  const isDemo = true

  if (!isDemo) {
    return null
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 className="text-sm font-medium text-yellow-900">Demo: Order Status Management</h4>
      </div>
      
      <p className="text-xs text-yellow-700 mb-4">
        This is a demo feature. In a real application, only administrators would have access to update order statuses.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-yellow-900 mb-2">
            Update Order Status
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusUpdate(option.value)}
                disabled={isUpdating || option.value === currentStatus}
                className={`p-2 text-xs font-medium rounded-md transition-colors ${
                  option.value === currentStatus
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={option.description}
              >
                {option.label}
                {option.value === currentStatus && (
                  <span className="ml-1 text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {showTrackingInput && (
          <div className="bg-white rounded-md p-3 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Tracking Number
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddTracking}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? '...' : 'Add'}
              </button>
              <button
                onClick={() => {
                  setShowTrackingInput(false)
                  setTrackingNumber('')
                }}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}