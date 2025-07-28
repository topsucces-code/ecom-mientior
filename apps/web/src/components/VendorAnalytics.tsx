'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { VendorAnalyticsData, VendorReportConfig, vendorAnalyticsService } from '../lib/vendor-analytics'
import { useVendorStore } from '../lib/vendor-store'

interface VendorAnalyticsProps {
  vendorId?: string
  className?: string
}

interface MetricCard {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: string
  color: string
}

const VendorAnalytics: React.FC<VendorAnalyticsProps> = ({
  vendorId,
  className = ''
}) => {
  const { currentVendor } = useVendorStore()
  const [analyticsData, setAnalyticsData] = useState<VendorAnalyticsData | null>(null)
  const [competitorData, setCompetitorData] = useState<any>(null)
  const [performanceInsights, setPerformanceInsights] = useState<any>(null)
  const [marketTrends, setMarketTrends] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '90d' | '1y'>('30d')
  const [activeSection, setActiveSection] = useState<'overview' | 'products' | 'customers' | 'financial' | 'insights'>('overview')

  useEffect(() => {
    if (vendorId || currentVendor?.id) {
      loadAnalyticsData()
    }
  }, [vendorId, currentVendor?.id, selectedPeriod])

  const loadAnalyticsData = async () => {
    const targetVendorId = vendorId || currentVendor?.id
    if (!targetVendorId) return

    try {
      setLoading(true)
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - getPeriodDays(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString()

      const [analytics, competitor, insights, trends] = await Promise.all([
        vendorAnalyticsService.generateVendorAnalytics(targetVendorId, startDate, endDate),
        vendorAnalyticsService.generateCompetitorAnalysis(targetVendorId),
        vendorAnalyticsService.generatePerformanceInsights(targetVendorId),
        vendorAnalyticsService.getMarketTrends(),
      ])

      setAnalyticsData(analytics)
      setCompetitorData(competitor)
      setPerformanceInsights(insights)
      setMarketTrends(trends)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPeriodDays = (period: string): number => {
    switch (period) {
      case '30d': return 30
      case '90d': return 90
      case '1y': return 365
      default: return 30
    }
  }

  const metricCards: MetricCard[] = useMemo(() => {
    if (!analyticsData) return []

    return [
      {
        title: 'Total Revenue',
        value: `$${analyticsData.sales_metrics.total_revenue.toLocaleString()}`,
        change: analyticsData.sales_metrics.revenue_growth_rate,
        trend: analyticsData.sales_metrics.revenue_growth_rate > 0 ? 'up' : 'down',
        icon: '💰',
        color: 'bg-green-50 border-green-200 text-green-800',
      },
      {
        title: 'Total Orders',
        value: analyticsData.sales_metrics.total_orders.toLocaleString(),
        change: analyticsData.sales_metrics.order_growth_rate,
        trend: analyticsData.sales_metrics.order_growth_rate > 0 ? 'up' : 'down',
        icon: '📦',
        color: 'bg-blue-50 border-blue-200 text-blue-800',
      },
      {
        title: 'Average Order Value',
        value: `$${analyticsData.sales_metrics.average_order_value.toFixed(2)}`,
        trend: 'neutral',
        icon: '📊',
        color: 'bg-purple-50 border-purple-200 text-purple-800',
      },
      {
        title: 'Customer Rating',
        value: `${analyticsData.customer_analytics.customer_satisfaction_score.toFixed(1)}/5`,
        trend: 'up',
        icon: '⭐',
        color: 'bg-amber-50 border-amber-200 text-amber-800',
      },
      {
        title: 'Commission Earned',
        value: `$${analyticsData.commission_analytics.total_commissions_earned.toLocaleString()}`,
        change: analyticsData.commission_analytics.commission_growth_rate,
        trend: analyticsData.commission_analytics.commission_growth_rate > 0 ? 'up' : 'down',
        icon: '💵',
        color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      },
      {
        title: 'Return Rate',
        value: `${(analyticsData.performance_metrics.return_rate * 100).toFixed(1)}%`,
        trend: 'down',
        icon: '🔄',
        color: 'bg-red-50 border-red-200 text-red-800',
      },
    ]
  }, [analyticsData])

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      default: return '📊'
    }
  }

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!vendorId && !currentVendor?.id) return

    const config: VendorReportConfig = {
      vendor_id: vendorId || currentVendor!.id,
      report_type: 'custom',
      date_range: {
        start_date: new Date(Date.now() - getPeriodDays(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString(),
      },
      include_sections: {
        sales_overview: true,
        product_performance: true,
        customer_analytics: true,
        commission_details: true,
        performance_metrics: true,
        financial_summary: true,
        trends_forecasting: true,
      },
      export_format: format,
    }

    try {
      const result = await vendorAnalyticsService.exportVendorReport(config)
      // In a real implementation, this would trigger the download
      alert(`Report generated successfully! Report ID: ${result.report_id}`)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error generating report. Please try again.')
    }
  }

  if (loading) {
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

  if (!analyticsData) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">📊</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Analytics Data</h2>
          <p className="text-gray-600">Analytics data will appear here once you have sales activity.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendor Analytics</h2>
          <p className="text-gray-600">Comprehensive performance insights and reports</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="rounded-md border-gray-300 text-sm focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <div className="relative">
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
              <span className="mr-2">📄</span>
              Export Report
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 hidden group-hover:block">
              <button
                onClick={() => handleExportReport('pdf')}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export as PDF
              </button>
              <button
                onClick={() => handleExportReport('excel')}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export as Excel
              </button>
              <button
                onClick={() => handleExportReport('csv')}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export as CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((metric, index) => (
          <div key={index} className={`bg-white rounded-lg shadow p-6 border ${metric.color.split(' ').slice(1).join(' ')}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{metric.value}</p>
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
              <div className="text-3xl">{metric.icon}</div>
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
              { key: 'products', label: 'Product Performance', icon: '🛍️' },
              { key: 'customers', label: 'Customer Analytics', icon: '👥' },
              { key: 'financial', label: 'Financial Summary', icon: '💰' },
              { key: 'insights', label: 'Insights & Trends', icon: '🔍' },
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
                {analyticsData.trends.revenue_trend.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{trend.period}</p>
                      <p className="text-xs text-gray-600">{trend.orders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">${trend.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Fulfillment Rate</span>
                    <span>{(analyticsData.performance_metrics.fulfillment_rate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${analyticsData.performance_metrics.fulfillment_rate * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Shipping Performance</span>
                    <span>{(analyticsData.performance_metrics.shipping_performance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${analyticsData.performance_metrics.shipping_performance * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Customer Rating</span>
                    <span>{analyticsData.performance_metrics.customer_rating.toFixed(1)}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-amber-600 h-2 rounded-full" 
                      style={{ width: `${(analyticsData.performance_metrics.customer_rating / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Performance Tab */}
        {activeSection === 'products' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Products */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Selling Products</h3>
                <div className="space-y-4">
                  {analyticsData.product_performance.top_selling_products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                      <div>
                        <p className="font-medium text-gray-900">{product.product_name}</p>
                        <p className="text-sm text-gray-600">{product.units_sold} units sold</p>
                        <p className="text-xs text-gray-500">Conversion: {(product.conversion_rate * 100).toFixed(1)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">${product.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Underperforming Products */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Needs Attention</h3>
                <div className="space-y-4">
                  {analyticsData.product_performance.underperforming_products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded border border-amber-200">
                      <div>
                        <p className="font-medium text-gray-900">{product.product_name}</p>
                        <p className="text-sm text-gray-600">{product.views} views, {product.sales} sales</p>
                        <p className="text-xs text-amber-600">Low conversion: {(product.conversion_rate * 100).toFixed(1)}%</p>
                      </div>
                      <div className="text-right">
                        <button className="px-3 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700">
                          Optimize
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Analytics Tab */}
        {activeSection === 'customers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="text-gray-700">Total Customers</span>
                  <span className="text-xl font-semibold text-blue-600">{analyticsData.customer_analytics.total_customers}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="text-gray-700">New Customers</span>
                  <span className="text-xl font-semibold text-green-600">{analyticsData.customer_analytics.new_customers}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                  <span className="text-gray-700">Returning Customers</span>
                  <span className="text-xl font-semibold text-purple-600">{analyticsData.customer_analytics.returning_customers}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded">
                  <span className="text-gray-700">Retention Rate</span>
                  <span className="text-xl font-semibold text-amber-600">{(analyticsData.customer_analytics.customer_retention_rate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Value</h3>
              <div className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Average Customer Lifetime Value</p>
                  <p className="text-3xl font-bold text-gray-900">${analyticsData.customer_analytics.average_customer_lifetime_value}</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Customer Satisfaction Score</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.customer_analytics.customer_satisfaction_score.toFixed(1)}/5</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Summary Tab */}
        {activeSection === 'financial' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Financial Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-2">Gross Revenue</p>
                  <p className="text-2xl font-bold text-green-600">${analyticsData.financial_summary.gross_revenue.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Net Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">${analyticsData.financial_summary.net_revenue.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-2">Profit Margin</p>
                  <p className="text-2xl font-bold text-purple-600">{(analyticsData.financial_summary.profit_margin * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Breakdown</h3>
                <div className="space-y-3">
                  {analyticsData.commission_analytics.commission_by_category.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{category.category}</p>
                        <p className="text-sm text-gray-600">{category.order_count} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${category.commission_amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{(category.commission_rate * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-red-50 rounded">
                    <span className="text-gray-700">Commission Fees</span>
                    <span className="font-semibold text-red-600">${analyticsData.financial_summary.commission_fees.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-orange-50 rounded">
                    <span className="text-gray-700">Platform Fees</span>
                    <span className="font-semibold text-orange-600">${analyticsData.financial_summary.platform_fees.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-50 rounded border-t-2 border-green-200">
                    <span className="text-gray-700 font-medium">Your Payout</span>
                    <span className="text-xl font-bold text-green-600">${analyticsData.financial_summary.payout_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insights & Trends Tab */}
        {activeSection === 'insights' && (
          <div className="space-y-6">
            {/* Performance Insights */}
            {performanceInsights && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Your Strengths</h3>
                  <div className="space-y-3">
                    {performanceInsights.strengths.map((strength: any, index: number) => (
                      <div key={index} className="p-3 bg-green-50 rounded border border-green-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-green-800">{strength.metric}</span>
                          <span className="text-lg font-bold text-green-600">{strength.value}</span>
                        </div>
                        <p className="text-sm text-green-700">{strength.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Growth Opportunities</h3>
                  <div className="space-y-3">
                    {performanceInsights.opportunities.map((opportunity: any, index: number) => (
                      <div key={index} className="p-3 bg-blue-50 rounded border border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-blue-800">{opportunity.metric}</span>
                          <span className="text-sm text-blue-600">{opportunity.current_value} → {opportunity.potential_value}</span>
                        </div>
                        <p className="text-sm text-blue-700 mb-1">{opportunity.impact}</p>
                        <p className="text-xs text-blue-600">{opportunity.action_required}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Market Trends */}
            {marketTrends && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Market Trends</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {marketTrends.category_trends.map((trend: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{trend.category}</h4>
                        <span className={`px-2 py-1 text-xs rounded ${
                          trend.competition_level === 'low' ? 'bg-green-100 text-green-800' :
                          trend.competition_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {trend.competition_level} competition
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Growth Rate:</span>
                          <span className="font-medium text-green-600">+{(trend.growth_rate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Opportunity Score:</span>
                          <span className="font-medium">{trend.opportunity_score}/10</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts */}
            {performanceInsights?.alerts && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Alerts</h3>
                <div className="space-y-3">
                  {performanceInsights.alerts.map((alert: any, index: number) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                      alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">
                          {alert.type === 'critical' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{alert.message}</h4>
                          <p className="text-sm text-gray-600 mt-1">{alert.suggested_action}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Current: {alert.current_value}</span>
                            <span>Threshold: {alert.threshold}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(VendorAnalytics)