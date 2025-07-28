'use client'

import { useState, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  DollarSign,
  Package,
  Store,
  MessageSquare,
  Settings,
  BarChart3,
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  Filter
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface AdminDashboardProps {
  adminId: string
  adminInfo: {
    name: string
    email: string
    avatar?: string
  }
}

const AdminDashboard = memo(({ adminId, adminInfo }: AdminDashboardProps) => {
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalVendors: 0,
    activeSupportChats: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])

  // Mock data for demo
  useEffect(() => {
    setStats({
      totalUsers: 15847,
      totalOrders: 3256,
      totalRevenue: 487392.50,
      totalProducts: 1256,
      totalVendors: 89,
      activeSupportChats: 23
    })

    setRecentActivity([
      { id: '1', type: 'order', message: 'New order #ORD-2024-003 from John Doe', time: '5 minutes ago' },
      { id: '2', type: 'vendor', message: 'Vendor "TechStore" registered', time: '15 minutes ago' },
      { id: '3', type: 'product', message: 'Product "Gaming Laptop" added by TechStore', time: '30 minutes ago' },
      { id: '4', type: 'user', message: '15 new user registrations today', time: '1 hour ago' }
    ])

    setPendingApprovals([
      { id: '1', type: 'vendor', name: 'New Electronics Store', status: 'pending', date: '2024-01-20' },
      { id: '2', type: 'product', name: 'Wireless Headphones Pro', status: 'pending', date: '2024-01-20' },
      { id: '3', type: 'vendor', name: 'Fashion Hub', status: 'pending', date: '2024-01-19' }
    ])
  }, [])

  const StatCard = ({ title, value, icon: Icon, color, change }: any) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {typeof value === 'number' && title.includes('Revenue') 
              ? `$${value.toLocaleString()}` 
              : value.toLocaleString()}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
      {change && (
        <div className="mt-4">
          <span className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '+' : ''}{change}% from last month
          </span>
        </div>
      )}
    </div>
  )

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag size={16} className="text-blue-600" />
      case 'vendor':
        return <Store size={16} className="text-green-600" />
      case 'product':
        return <Package size={16} className="text-purple-600" />
      case 'user':
        return <Users size={16} className="text-orange-600" />
      default:
        return <AlertTriangle size={16} className="text-gray-600" />
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
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">Manage your e-commerce platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                <Plus size={16} className="inline mr-2" />
                Quick Actions
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
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'users', label: 'Users', icon: Users },
                  { id: 'vendors', label: 'Vendors', icon: Store },
                  { id: 'products', label: 'Products', icon: Package },
                  { id: 'orders', label: 'Orders', icon: ShoppingBag },
                  { id: 'support', label: 'Support', icon: MessageSquare },
                  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
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
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    color="bg-blue-600"
                    change={12}
                  />
                  <StatCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    icon={ShoppingBag}
                    color="bg-green-600"
                    change={8}
                  />
                  <StatCard
                    title="Total Revenue"
                    value={stats.totalRevenue}
                    icon={DollarSign}
                    color="bg-purple-600"
                    change={15}
                  />
                  <StatCard
                    title="Total Products"
                    value={stats.totalProducts}
                    icon={Package}
                    color="bg-orange-600"
                    change={5}
                  />
                  <StatCard
                    title="Active Vendors"
                    value={stats.totalVendors}
                    icon={Store}
                    color="bg-indigo-600"
                    change={3}
                  />
                  <StatCard
                    title="Support Chats"
                    value={stats.activeSupportChats}
                    icon={MessageSquare}
                    color="bg-pink-600"
                    change={-2}
                  />
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <Users size={24} className="text-blue-600" />
                      <span className="text-sm font-medium">Add User</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <Store size={24} className="text-green-600" />
                      <span className="text-sm font-medium">Approve Vendor</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <Package size={24} className="text-purple-600" />
                      <span className="text-sm font-medium">Review Products</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <Download size={24} className="text-orange-600" />
                      <span className="text-sm font-medium">Export Data</span>
                    </button>
                  </div>
                </div>

                {/* Pending Approvals */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Pending Approvals</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {pendingApprovals.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${
                              item.type === 'vendor' ? 'bg-green-500' : 'bg-purple-500'
                            }`}></div>
                            <div>
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-600 capitalize">{item.type} • {item.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Eye size={16} />
                            </button>
                            <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                              <CheckCircle size={16} />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {recentActivity.map((activity: any) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className="mt-1">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Management */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">User Management</h2>
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                        <Filter size={16} />
                        Filter
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                        <Download size={16} />
                        Export
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700">
                        <Plus size={16} />
                        Add User
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-6 py-3">User</th>
                          <th className="px-6 py-3">Role</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Joined</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <tr key={i} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                                <div>
                                  <p className="font-medium text-gray-900">John Doe {i}</p>
                                  <p className="text-gray-600">john{i}@example.com</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                Customer
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4">Jan {10 + i}, 2024</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                  <Eye size={14} />
                                </button>
                                <button className="p-1 text-gray-600 hover:bg-gray-50 rounded">
                                  <Edit size={14} />
                                </button>
                                <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs would be implemented similarly */}
            {!['overview', 'users'].includes(activeTab) && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
                </h2>
                <p className="text-gray-600">This section is coming soon!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

AdminDashboard.displayName = 'AdminDashboard'

export default AdminDashboard