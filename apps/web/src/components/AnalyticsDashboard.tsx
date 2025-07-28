'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { PlatformMetrics, RealtimeMetrics, AnalyticsFilters, platformAnalyticsService } from '../lib/platform-analytics'

interface AnalyticsDashboardProps {
  className?: string
}

interface MetricCard {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: string
  color: string
  subtitle?: string
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className = ''
}) => {
  const [platformData, setPlatformData] = useState<PlatformMetrics | null>(null)
  const [realtimeData, setRealtimeData] = useState<RealtimeMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview' | 'sales' | 'users' | 'products' | 'marketing' | 'financial'>('overview')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [isRealtime, setIsRealtime] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
    loadRealtimeData()
  }, [dateRange])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    if (isRealtime) {
      unsubscribe = platformAnalyticsService.subscribeToRealtimeUpdates((metrics) => {
        setRealtimeData(metrics)
      })
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [isRealtime])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - getPeriodDays(dateRange) * 24 * 60 * 60 * 1000).toISOString()

      const filters: AnalyticsFilters = {
        date_range: {
          start_date: startDate,
          end_date: endDate,
        },
        comparison_period: 'previous_period',
      }

      const data = await platformAnalyticsService.getPlatformMetrics(filters)
      setPlatformData(data)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRealtimeData = async () => {
    try {
      const data = await platformAnalyticsService.getRealtimeMetrics()
      setRealtimeData(data)
    } catch (error) {
      console.error('Error loading realtime data:', error)
    }
  }

  const getPeriodDays = (period: string): number => {
    switch (period) {
      case '7d': return 7
      case '30d': return 30
      case '90d': return 90
      case '1y': return 365
      default: return 30
    }
  }

  const overviewMetrics: MetricCard[] = useMemo(() => {
    if (!platformData) return []

    return [
      {
        title: 'Total Revenue',
        value: `$${platformData.overview.total_revenue.toLocaleString()}`,
        change: platformData.overview.revenue_growth,
        trend: platformData.overview.revenue_growth > 0 ? 'up' : 'down',
        icon: '💰',
        color: 'bg-green-50 border-green-200',
        subtitle: `${(platformData.overview.revenue_growth * 100).toFixed(1)}% vs last period`,
      },
      {
        title: 'Total Orders',
        value: platformData.overview.total_orders.toLocaleString(),
        change: platformData.overview.order_growth,
        trend: platformData.overview.order_growth > 0 ? 'up' : 'down',
        icon: '📦',
        color: 'bg-blue-50 border-blue-200',
        subtitle: `${(platformData.overview.order_growth * 100).toFixed(1)}% vs last period`,
      },
      {
        title: 'Total Users',
        value: platformData.overview.total_users.toLocaleString(),
        change: platformData.overview.user_growth,
        trend: platformData.overview.user_growth > 0 ? 'up' : 'down',
        icon: '👥',
        color: 'bg-purple-50 border-purple-200',
        subtitle: `${(platformData.overview.user_growth * 100).toFixed(1)}% vs last period`,
      },
      {
        title: 'Active Vendors',
        value: platformData.vendors.active_vendors.toLocaleString(),
        trend: 'neutral',
        icon: '🏪',
        color: 'bg-amber-50 border-amber-200',
        subtitle: `${platformData.vendors.total_vendors} total vendors`,
      },
      {
        title: 'Products',
        value: platformData.overview.total_products.toLocaleString(),
        trend: 'neutral',
        icon: '🛍️',
        color: 'bg-indigo-50 border-indigo-200',
        subtitle: `${platformData.products.inventory_status.in_stock} in stock`,
      },
      {
        title: 'Avg Order Value',
        value: `$${(platformData.overview.total_revenue / platformData.overview.total_orders).toFixed(2)}`,
        trend: 'up',
        icon: '📊',
        color: 'bg-emerald-50 border-emerald-200',
        subtitle: 'Average order value',
      },
    ]
  }, [platformData])

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      default: return '📊'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  if (loading && !platformData) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    )
  }

  if (!platformData) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">📊</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Analytics Data</h2>
          <p className="text-gray-600">Analytics data will appear here once the system is configured.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Platform-wide analytics and insights</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Real-time updates:</span>
            <button
              onClick={() => setIsRealtime(!isRealtime)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isRealtime ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isRealtime ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="rounded-md border-gray-300 text-sm focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button
            onClick={loadAnalyticsData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <span className="mr-2">🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Real-time Status Bar */}
      {isRealtime && realtimeData && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">Live</span>
              </div>
              <div className="text-sm text-gray-700">
                <strong>{realtimeData.current_visitors}</strong> visitors online
              </div>
              <div className="text-sm text-gray-700">
                <strong>{realtimeData.active_sessions}</strong> active sessions
              </div>
              <div className="text-sm text-gray-700">
                <strong>${realtimeData.real_time_revenue.toLocaleString()}</strong> today's revenue
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {overviewMetrics.map((metric, index) => (
          <div key={index} className={`bg-white rounded-lg shadow p-6 border ${metric.color}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                {metric.subtitle && (
                  <p className="text-sm text-gray-500 mt-1">{metric.subtitle}</p>
                )}
                {metric.change !== undefined && (
                  <div className="flex items-center mt-2">
                    <span className="text-lg mr-1">{getTrendIcon(metric.trend!)}</span>
                    <span className={`text-sm font-medium ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{(metric.change * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="text-3xl ml-4">{metric.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'sales', label: 'Sales Analytics', icon: '💰' },
              { key: 'users', label: 'User Analytics', icon: '👥' },
              { key: 'products', label: 'Product Performance', icon: '🛍️' },
              { key: 'marketing', label: 'Marketing', icon: '📢' },
              { key: 'financial', label: 'Financial', icon: '💼' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key as any)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeSection === tab.key
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
              <div className="space-y-3">
                {platformData.sales.daily_revenue.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{new Date(day.date).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-600">{day.orders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(day.revenue)}</p>
                      <p className="text-xs text-gray-600">AOV: {formatCurrency(day.average_order_value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Category</h3>
              <div className="space-y-3">
                {platformData.sales.revenue_by_category.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-900">{category.category}</span>
                        <span className="text-sm text-gray-600">{formatCurrency(category.revenue)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-amber-600 h-2 rounded-full" 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</span>
                        <span className={`text-xs ${category.growth_rate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {category.growth_rate > 0 ? '+' : ''}{(category.growth_rate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Activity */}
            {realtimeData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Live Activity</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded">
                      <p className="text-2xl font-bold text-green-600">{realtimeData.current_visitors}</p>
                      <p className="text-xs text-green-700">Current Visitors</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-2xl font-bold text-blue-600">{realtimeData.live_orders}</p>
                      <p className="text-xs text-blue-700">Live Orders</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Orders</h4>
                    <div className="space-y-2">
                      {realtimeData.recent_orders.map((order, index) => (
                        <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                          <span className="font-mono text-gray-600">#{order.order_id.slice(-6)}</span>
                          <span className="font-semibold text-green-600">{formatCurrency(order.amount)}</span>
                          <span className="text-gray-500 text-xs">{order.location}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Key Performance Indicators</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded">
                  <p className="text-lg font-bold text-purple-600">{formatPercentage(realtimeData?.conversion_rate_today || 0.042)}</p>
                  <p className="text-xs text-purple-700">Conversion Rate</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <p className="text-lg font-bold text-red-600">{formatPercentage(realtimeData?.cart_abandonment_rate || 0.68)}</p>
                  <p className="text-xs text-red-700">Cart Abandonment</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded">
                  <p className="text-lg font-bold text-amber-600">{formatPercentage(platformData.users.user_retention.day_30)}</p>
                  <p className="text-xs text-amber-700">30-Day Retention</p>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded">
                  <p className="text-lg font-bold text-indigo-600">{formatPercentage(platformData.financial.profit_margins.net_margin)}</p>
                  <p className="text-xs text-indigo-700">Net Margin</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Analytics Tab */}
        {activeSection === 'sales' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Products */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Selling Products</h3>
                <div className="space-y-3">
                  {platformData.sales.top_selling_products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{product.product_name}</p>
                        <p className="text-sm text-gray-600">{product.category} • {product.sales_count} sold</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
                <div className="space-y-3">
                  {platformData.sales.payment_methods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-900">{method.method}</span>
                          <span className="text-sm text-gray-600">{method.usage_count} transactions</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${method.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">{method.percentage.toFixed(1)}%</span>
                          <span className="text-xs text-green-600">
                            {formatPercentage(method.success_rate)} success rate
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Analytics Tab */}
        {activeSection === 'users' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Acquisition */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Acquisition Sources</h3>
                <div className="space-y-3">
                  {platformData.users.user_acquisition.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{source.source}</p>
                        <p className="text-sm text-gray-600">{source.users} users • {source.percentage.toFixed(1)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {source.cost_per_acquisition > 0 ? formatCurrency(source.cost_per_acquisition) : 'Free'}
                        </p>
                        <p className="text-xs text-gray-600">Cost per user</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Demographics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Demographics</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Age Groups</h4>
                    <div className="space-y-2">
                      {platformData.users.demographics.age_groups.map((group, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{group.range}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ width: `${group.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12">{group.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Top Locations</h4>
                    <div className="space-y-2">
                      {platformData.users.demographics.locations.slice(0, 5).map((location, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{location.country}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full" 
                                style={{ width: `${location.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12">{location.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Retention */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Retention</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded">
                  <p className="text-2xl font-bold text-green-600">{formatPercentage(platformData.users.user_retention.day_1)}</p>
                  <p className="text-sm text-green-700">Day 1 Retention</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <p className="text-2xl font-bold text-blue-600">{formatPercentage(platformData.users.user_retention.day_7)}</p>
                  <p className="text-sm text-blue-700">Day 7 Retention</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <p className="text-2xl font-bold text-purple-600">{formatPercentage(platformData.users.user_retention.day_30)}</p>
                  <p className="text-sm text-purple-700">Day 30 Retention</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeSection === 'products' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inventory Status */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Status</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-green-700">In Stock</span>
                    <span className="text-xl font-bold text-green-600">{platformData.products.inventory_status.in_stock.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                    <span className="text-yellow-700">Low Stock</span>
                    <span className="text-xl font-bold text-yellow-600">{platformData.products.inventory_status.low_stock.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span className="text-red-700">Out of Stock</span>
                    <span className="text-xl font-bold text-red-600">{platformData.products.inventory_status.out_of_stock.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Category Performance */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
                <div className="space-y-3">
                  {platformData.products.category_performance.map((category, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{category.category}</span>
                        <span className="text-sm text-gray-600">{category.total_products} products</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <p className="font-semibold text-blue-600">{category.total_sales.toLocaleString()}</p>
                          <p className="text-gray-600">Sales</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-amber-600">{category.average_rating.toFixed(1)}/5</p>
                          <p className="text-gray-600">Rating</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-red-600">{formatPercentage(category.return_rate)}</p>
                          <p className="text-gray-600">Returns</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Analytics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Search Queries</h3>
              <div className="space-y-3">
                {platformData.products.search_analytics.map((query, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-gray-900">"{query.query}"</p>
                      <p className="text-sm text-gray-600">{query.search_count} searches • {query.result_clicks} clicks</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{formatPercentage(query.conversion_rate)}</p>
                      <p className="text-xs text-gray-600">Conversion</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Marketing Tab */}
        {activeSection === 'marketing' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Traffic Sources */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic Sources</h3>
                <div className="space-y-3">
                  {platformData.marketing.traffic_sources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{source.source}</p>
                        <p className="text-sm text-gray-600">{source.visitors.toLocaleString()} visitors</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-600">{source.percentage.toFixed(1)}%</p>
                        <p className="text-xs text-green-600">{formatPercentage(source.conversion_rate)} CVR</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Marketing */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Email Marketing Performance</h3>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <p className="text-2xl font-bold text-blue-600">{platformData.marketing.email_marketing.total_sent.toLocaleString()}</p>
                    <p className="text-sm text-blue-700">Total Emails Sent</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-green-50 rounded">
                      <p className="text-lg font-bold text-green-600">{formatPercentage(platformData.marketing.email_marketing.open_rate)}</p>
                      <p className="text-xs text-green-700">Open Rate</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded">
                      <p className="text-lg font-bold text-amber-600">{formatPercentage(platformData.marketing.email_marketing.click_rate)}</p>
                      <p className="text-xs text-amber-700">Click Rate</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <p className="text-lg font-bold text-purple-600">{formatPercentage(platformData.marketing.email_marketing.conversion_rate)}</p>
                      <p className="text-xs text-purple-700">Conversion</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Performance</h3>
              <div className="space-y-3">
                {platformData.marketing.campaign_performance.map((campaign, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">{campaign.campaign_name}</h4>
                      <span className="text-lg font-bold text-green-600">{campaign.roi.toFixed(1)}x ROI</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-blue-600">{campaign.impressions.toLocaleString()}</p>
                        <p className="text-gray-600">Impressions</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-green-600">{campaign.clicks.toLocaleString()}</p>
                        <p className="text-gray-600">Clicks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-purple-600">{campaign.conversions.toLocaleString()}</p>
                        <p className="text-gray-600">Conversions</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-red-600">{formatCurrency(campaign.cost)}</p>
                        <p className="text-gray-600">Cost</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeSection === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-green-700">Product Sales</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(platformData.financial.revenue_breakdown.product_sales)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="text-blue-700">Shipping Fees</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(platformData.financial.revenue_breakdown.shipping_fees)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span className="text-purple-700">Service Fees</span>
                    <span className="text-lg font-bold text-purple-600">{formatCurrency(platformData.financial.revenue_breakdown.service_fees)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded">
                    <span className="text-amber-700">Commission Revenue</span>
                    <span className="text-lg font-bold text-amber-600">{formatCurrency(platformData.financial.revenue_breakdown.commission_revenue)}</span>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span className="text-red-700">Payment Processing</span>
                    <span className="text-lg font-bold text-red-600">{formatCurrency(platformData.financial.costs.payment_processing)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                    <span className="text-orange-700">Infrastructure</span>
                    <span className="text-lg font-bold text-orange-600">{formatCurrency(platformData.financial.costs.hosting_infrastructure)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-pink-50 rounded">
                    <span className="text-pink-700">Marketing Spend</span>
                    <span className="text-lg font-bold text-pink-600">{formatCurrency(platformData.financial.costs.marketing_spend)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-indigo-50 rounded">
                    <span className="text-indigo-700">Support Costs</span>
                    <span className="text-lg font-bold text-indigo-600">{formatCurrency(platformData.financial.costs.support_costs)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Margins */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profit Margins</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded">
                  <p className="text-2xl font-bold text-green-600">{formatPercentage(platformData.financial.profit_margins.gross_margin)}</p>
                  <p className="text-sm text-green-700">Gross Margin</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <p className="text-2xl font-bold text-blue-600">{formatPercentage(platformData.financial.profit_margins.contribution_margin)}</p>
                  <p className="text-sm text-blue-700">Contribution Margin</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <p className="text-2xl font-bold text-purple-600">{formatPercentage(platformData.financial.profit_margins.net_margin)}</p>
                  <p className="text-sm text-purple-700">Net Margin</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(AnalyticsDashboard)