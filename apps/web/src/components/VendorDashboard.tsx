'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Vendor, VendorOrder, VendorProduct, VendorPayout, VendorMessage } from '@ecommerce/shared'
import { useVendorStore } from '../lib/vendor-store'
import CommissionDashboard from './CommissionDashboard'
import VendorAnalytics from './VendorAnalytics'

interface VendorDashboardProps {
  vendorId?: string
  className?: string
}

interface DashboardMetrics {
  totalSales: number
  totalRevenue: number
  totalOrders: number
  pendingOrders: number
  activeProducts: number
  averageRating: number
  responseRate: number
  unreadMessages: number
  totalCommissions: number
  pendingCommissions: number
}

interface RecentActivity {
  type: 'order' | 'product' | 'message' | 'payout'
  title: string
  description: string
  timestamp: string
  status?: string
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({
  vendorId,
  className = ''
}) => {
  const {
    currentVendor,
    vendorOrders,
    vendorProducts,
    vendorPayouts,
    vendorMessages,
    vendorCommissions,
    vendorLoading,
    vendorError,
    getVendorById,
    getVendorOrders,
    getVendorProducts,
    getVendorPayouts,
    getVendorMessages,
    getVendorCommissions,
    updateVendorMetrics,
  } = useVendorStore()

  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'commissions' | 'analytics'>('overview')

  useEffect(() => {
    if (vendorId) {
      loadVendorData(vendorId)
    }
  }, [vendorId])

  const loadVendorData = async (id: string) => {
    try {
      setIsRefreshing(true)
      await Promise.all([
        getVendorById(id),
        getVendorOrders(id),
        getVendorProducts(id),
        getVendorPayouts(id),
        getVendorMessages(id),
        getVendorCommissions(id),
      ])
    } catch (error) {
      console.error('Error loading vendor data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRefreshMetrics = async () => {
    if (!currentVendor) return
    
    try {
      setIsRefreshing(true)
      await updateVendorMetrics(currentVendor.id)
      await loadVendorData(currentVendor.id)
    } catch (error) {
      console.error('Error refreshing metrics:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const metrics: DashboardMetrics = useMemo(() => {
    if (!currentVendor) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        activeProducts: 0,
        averageRating: 0,
        responseRate: 0,
        unreadMessages: 0,
        totalCommissions: 0,
        pendingCommissions: 0,
      }
    }

    const pendingOrders = vendorOrders.filter(order => 
      ['pending', 'confirmed'].includes(order.status)
    ).length

    const activeProducts = vendorProducts.filter(product => 
      product.status === 'active'
    ).length

    const unreadMessages = vendorMessages.filter(message => 
      message.status === 'open'
    ).length

    const totalCommissions = vendorCommissions.reduce((sum, comm) => sum + comm.commission_amount, 0)
    const pendingCommissions = vendorCommissions.filter(comm => comm.status === 'pending').length

    return {
      totalSales: currentVendor.metrics.total_sales,
      totalRevenue: currentVendor.metrics.total_revenue,
      totalOrders: vendorOrders.length,
      pendingOrders,
      activeProducts,
      averageRating: currentVendor.metrics.average_rating,
      responseRate: currentVendor.metrics.response_rate,
      unreadMessages,
      totalCommissions,
      pendingCommissions,
    }
  }, [currentVendor, vendorOrders, vendorProducts, vendorMessages, vendorCommissions])

  const recentActivity: RecentActivity[] = useMemo(() => {
    const activities: RecentActivity[] = []

    // Recent orders
    vendorOrders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .forEach(order => {
        activities.push({
          type: 'order',
          title: `Order #${order.id.slice(-6)}`,
          description: `${order.order_items.length} items - $${order.subtotal.toFixed(2)}`,
          timestamp: order.created_at,
          status: order.status,
        })
      })

    // Recent products
    vendorProducts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .forEach(product => {
        activities.push({
          type: 'product',
          title: 'Product Updated',
          description: `Product status: ${product.status}`,
          timestamp: product.updated_at,
          status: product.status,
        })
      })

    // Recent messages
    vendorMessages
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .forEach(message => {
        activities.push({
          type: 'message',
          title: message.subject,
          description: `${message.message_type} - ${message.priority} priority`,
          timestamp: message.created_at,
          status: message.status,
        })
      })

    // Recent payouts
    vendorPayouts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 1)
      .forEach(payout => {
        activities.push({
          type: 'payout',
          title: 'Payout Processed',
          description: `$${payout.net_payout.toFixed(2)} - ${payout.payment_method}`,
          timestamp: payout.processed_at || payout.created_at,
          status: payout.status,
        })
      })

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8)
  }, [vendorOrders, vendorProducts, vendorMessages, vendorPayouts])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'completed':
      case 'delivered':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'pending':
      case 'processing':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'cancelled':
      case 'rejected':
      case 'suspended':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'shipped':
      case 'confirmed':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'order':
        return '📦'
      case 'product':
        return '🛍️'
      case 'message':
        return '💬'
      case 'payout':
        return '💰'
      default:
        return '📋'
    }
  }

  if (vendorLoading && !currentVendor) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 rounded-lg h-64"></div>
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    )
  }

  if (vendorError) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
              <p className="text-red-600 text-sm mt-1">{vendorError}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentVendor) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🏪</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Vendor Selected</h2>
          <p className="text-gray-600">Please select a vendor to view their dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {currentVendor.business_name}
          </h1>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(currentVendor.status)}`}>
              {currentVendor.status}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(currentVendor.verification_status)}`}>
              {currentVendor.verification_status}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="rounded-md border-gray-300 text-sm focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button
            onClick={handleRefreshMetrics}
            disabled={isRefreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
          >
            <span className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`}>🔄</span>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${metrics.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics.totalSales.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Products</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics.activeProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Rating</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics.averageRating.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Summary Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow p-6 border border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-amber-900 mb-2">Commission Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-amber-700">Total Earned</p>
                <p className="text-2xl font-bold text-amber-900">${metrics.totalCommissions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-amber-700">Pending</p>
                <p className="text-2xl font-bold text-amber-900">{metrics.pendingCommissions}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('commissions')}
            className="inline-flex items-center px-4 py-2 border border-amber-600 text-sm font-medium rounded-md text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard Overview
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'commissions'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Commission Details
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics & Reports
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{metrics.pendingOrders}</p>
            <p className="text-sm text-amber-700">Pending Orders</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{metrics.unreadMessages}</p>
            <p className="text-sm text-blue-700">Unread Messages</p>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{Math.round(metrics.responseRate)}%</p>
            <p className="text-sm text-green-700">Response Rate</p>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{currentVendor.metrics.response_time_hours}h</p>
            <p className="text-sm text-purple-700">Avg Response Time</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-lg">{getActivityIcon(activity.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        <p className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                        {activity.status && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-3 block">📋</span>
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Performance Overview</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">On-time Shipping Rate</span>
                  <span className="font-medium">{Math.round(currentVendor.metrics.on_time_shipping_rate * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${currentVendor.metrics.on_time_shipping_rate * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Customer Satisfaction</span>
                  <span className="font-medium">{Math.round(metrics.averageRating * 20)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${metrics.averageRating * 20}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-medium">{Math.round(metrics.responseRate)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${metrics.responseRate}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Cancellation Rate</span>
                  <span className="font-medium">{Math.round(currentVendor.metrics.cancellation_rate * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${currentVendor.metrics.cancellation_rate * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Performance Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Respond to messages within 24 hours</li>
                <li>• Maintain inventory levels to avoid stockouts</li>
                <li>• Ship orders within processing time</li>
                <li>• Keep product information accurate and updated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 text-center border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors">
            <span className="text-2xl mb-2">📦</span>
            <span className="text-sm font-medium text-gray-900">Manage Orders</span>
          </button>
          
          <button className="flex flex-col items-center p-4 text-center border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors">
            <span className="text-2xl mb-2">🛍️</span>
            <span className="text-sm font-medium text-gray-900">Add Product</span>
          </button>
          
          <button className="flex flex-col items-center p-4 text-center border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors">
            <span className="text-2xl mb-2">💬</span>
            <span className="text-sm font-medium text-gray-900">Messages</span>
          </button>
          
          <button className="flex flex-col items-center p-4 text-center border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors">
            <span className="text-2xl mb-2">📊</span>
            <span className="text-sm font-medium text-gray-900">Analytics</span>
          </button>
        </div>
      </div>
        </>
      )}

      {/* Commission Tab Content */}
      {activeTab === 'commissions' && (
        <CommissionDashboard vendorId={currentVendor?.id} className="" />
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <VendorAnalytics vendorId={currentVendor?.id} className="" />
      )}
    </div>
  )
}

export default React.memo(VendorDashboard)