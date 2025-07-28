'use client'

import { useState, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { 
  ShoppingBag, 
  Heart, 
  Star, 
  Truck, 
  CreditCard,
  User,
  MapPin,
  Bell,
  Settings,
  MessageCircle,
  Gift,
  TrendingUp,
  Package,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import ChatWidget from '../ChatWidget'

interface CustomerDashboardProps {
  customerId: string
  customerInfo: {
    name: string
    email: string
    avatar?: string
  }
}

const CustomerDashboard = memo(({ customerId, customerInfo }: CustomerDashboardProps) => {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [recentOrders, setRecentOrders] = useState([])
  const [wishlistItems, setWishlistItems] = useState([])
  const [notifications, setNotifications] = useState([])
  const [recommendations, setRecommendations] = useState([])

  // Mock data for demo
  useEffect(() => {
    setRecentOrders([
      {
        id: '1',
        orderNumber: 'ORD-2024-001',
        status: 'delivered',
        total: 149.99,
        items: [
          { name: 'Wireless Headphones', quantity: 1, price: 149.99 }
        ],
        createdAt: '2024-01-15',
        deliveredAt: '2024-01-18'
      },
      {
        id: '2',
        orderNumber: 'ORD-2024-002',
        status: 'shipped',
        total: 89.99,
        items: [
          { name: 'Smart Watch', quantity: 1, price: 89.99 }
        ],
        createdAt: '2024-01-20',
        trackingNumber: 'TRK123456789'
      }
    ])

    setWishlistItems([
      { id: '1', name: 'Gaming Laptop', price: 1299.99, image: '/products/laptop.jpg' },
      { id: '2', name: 'Coffee Machine', price: 299.99, image: '/products/coffee.jpg' }
    ])

    setNotifications([
      { id: '1', type: 'order', message: 'Your order ORD-2024-002 has been shipped', time: '2 hours ago' },
      { id: '2', type: 'promotion', message: 'New deals available in Electronics', time: '1 day ago' }
    ])

    setRecommendations([
      { id: '1', name: 'Wireless Mouse', price: 29.99, rating: 4.5, image: '/products/mouse.jpg' },
      { id: '2', name: 'USB Charger', price: 19.99, rating: 4.3, image: '/products/charger.jpg' }
    ])
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle size={16} className="text-green-600" />
      case 'shipped':
        return <Truck size={16} className="text-blue-600" />
      case 'processing':
        return <Clock size={16} className="text-yellow-600" />
      case 'cancelled':
        return <AlertCircle size={16} className="text-red-600" />
      default:
        return <Package size={16} className="text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Welcome back, {customerInfo.name.split(' ')[0]}!
                </h1>
                <p className="text-sm text-gray-600">Manage your orders and preferences</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              <button 
                onClick={signOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <nav className="space-y-2">
                {[
                  { id: 'overview', label: 'Overview', icon: TrendingUp },
                  { id: 'orders', label: 'My Orders', icon: ShoppingBag },
                  { id: 'wishlist', label: 'Wishlist', icon: Heart },
                  { id: 'reviews', label: 'My Reviews', icon: Star },
                  { id: 'addresses', label: 'Addresses', icon: MapPin },
                  { id: 'payment', label: 'Payment Methods', icon: CreditCard },
                  { id: 'support', label: 'Support', icon: MessageCircle },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-3xl font-bold text-gray-900">12</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ShoppingBag size={24} className="text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm text-green-600">+2 this month</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Wishlist Items</p>
                        <p className="text-3xl font-bold text-gray-900">{wishlistItems.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <Heart size={24} className="text-red-600" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm text-gray-600">Saved for later</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Rewards Points</p>
                        <p className="text-3xl font-bold text-gray-900">1,250</p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Gift size={24} className="text-yellow-600" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm text-gray-600">≈ $12.50 value</span>
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {recentOrders.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.status)}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{order.orderNumber}</p>
                              <p className="text-sm text-gray-600">
                                {order.items.length} item{order.items.length > 1 ? 's' : ''} • ${order.total}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{order.createdAt}</p>
                            {order.trackingNumber && (
                              <p className="text-xs text-blue-600">Track: {order.trackingNumber}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Recommended for You</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <Star size={14} className="text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-600">{item.rating}</span>
                              </div>
                              <span className="font-semibold text-gray-900">${item.price}</span>
                            </div>
                            <button className="mt-2 px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Order History</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {recentOrders.map((order: any) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium text-gray-900">{order.orderNumber}</h3>
                            <p className="text-sm text-gray-600">Placed on {order.createdAt}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          {order.items.map((item: any, index: number) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                <div>
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                </div>
                              </div>
                              <span className="font-medium text-gray-900">${item.price}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                          <span className="font-medium text-gray-900">Total: ${order.total}</span>
                          <div className="flex gap-2">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                              View Details
                            </button>
                            {order.status === 'delivered' && (
                              <button className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200">
                                Write Review
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">My Wishlist</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {wishlistItems.map((item: any) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                        <h3 className="font-medium text-gray-900 mb-2">{item.name}</h3>
                        <p className="text-lg font-semibold text-gray-900 mb-4">${item.price}</p>
                        <div className="flex gap-2">
                          <button className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                            Add to Cart
                          </button>
                          <button className="px-4 py-2 text-gray-600 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs would be implemented similarly */}
            {activeTab !== 'overview' && activeTab !== 'orders' && activeTab !== 'wishlist' && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p className="text-gray-600">This section is coming soon!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget
        customerId={customerId}
        customerInfo={customerInfo}
        position="bottom-right"
        theme="light"
        primaryColor="#8B5CF6"
      />
    </div>
  )
})

CustomerDashboard.displayName = 'CustomerDashboard'

export default CustomerDashboard