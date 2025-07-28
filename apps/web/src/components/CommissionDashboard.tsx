'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { VendorCommission, VendorPayout } from '@ecommerce/shared'
import { useVendorStore } from '../lib/vendor-store'
import { commissionService } from '../lib/commission-service'

interface CommissionDashboardProps {
  vendorId?: string
  className?: string
}

interface CommissionAnalytics {
  total_commissions: number
  average_commission_rate: number
  top_performing_vendors: Array<{
    vendor_id: string
    total_commission: number
    commission_rate: number
    sales_volume: number
  }>
  commission_trends: Array<{
    date: string
    total_commission: number
    order_count: number
  }>
  category_breakdown: Array<{
    category: string
    commission_amount: number
    order_count: number
    average_rate: number
  }>
}

interface CommissionRule {
  id: string
  vendor_id?: string
  product_category?: string
  commission_type: 'percentage' | 'flat_fee' | 'tiered'
  commission_rate: number
  min_amount?: number
  max_amount?: number
  is_active: boolean
  effective_date: string
  expiry_date?: string
}

const CommissionDashboard: React.FC<CommissionDashboardProps> = ({
  vendorId,
  className = ''
}) => {
  const {
    currentVendor,
    vendorCommissions,
    vendorPayouts,
    commissionLoading,
    commissionError,
    getVendorCommissions,
    getVendorPayouts,
  } = useVendorStore()

  const [analytics, setAnalytics] = useState<CommissionAnalytics | null>(null)
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [newRule, setNewRule] = useState<Partial<CommissionRule>>({
    commission_type: 'percentage',
    commission_rate: 0.15,
    is_active: true,
  })
  const [isCalculatingPayout, setIsCalculatingPayout] = useState(false)

  useEffect(() => {
    loadData()
  }, [vendorId, selectedPeriod])

  const loadData = async () => {
    try {
      if (vendorId) {
        await Promise.all([
          getVendorCommissions(vendorId),
          getVendorPayouts(vendorId),
        ])
      }
      
      const analyticsData = await commissionService.getCommissionAnalytics(
        vendorId,
        getPeriodDateRange(selectedPeriod)
      )
      setAnalytics(analyticsData)
      
      const rules = await commissionService.getCommissionRules(vendorId)
      setCommissionRules(rules)
    } catch (error) {
      console.error('Error loading commission data:', error)
    }
  }

  const getPeriodDateRange = (period: string) => {
    const end = new Date()
    const start = new Date()
    
    switch (period) {
      case '7d':
        start.setDate(end.getDate() - 7)
        break
      case '30d':
        start.setDate(end.getDate() - 30)
        break
      case '90d':
        start.setDate(end.getDate() - 90)
        break
      case '1y':
        start.setFullYear(end.getFullYear() - 1)
        break
    }
    
    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    }
  }

  const commissionStats = useMemo(() => {
    if (!vendorCommissions.length) {
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        paid: 0,
        disputed: 0,
        totalAmount: 0,
      }
    }

    const stats = {
      total: vendorCommissions.length,
      pending: 0,
      confirmed: 0,
      paid: 0,
      disputed: 0,
      totalAmount: 0,
    }

    vendorCommissions.forEach(commission => {
      stats[commission.status]++
      stats.totalAmount += commission.commission_amount
    })

    return stats
  }, [vendorCommissions])

  const payoutStats = useMemo(() => {
    if (!vendorPayouts.length) {
      return {
        total: 0,
        pending: 0,
        completed: 0,
        totalAmount: 0,
      }
    }

    const stats = {
      total: vendorPayouts.length,
      pending: 0,
      completed: 0,
      totalAmount: 0,
    }

    vendorPayouts.forEach(payout => {
      if (payout.status === 'pending' || payout.status === 'processing') {
        stats.pending++
      } else if (payout.status === 'completed') {
        stats.completed++
      }
      stats.totalAmount += payout.net_payout
    })

    return stats
  }, [vendorPayouts])

  const getCommissionStatusColor = (status: VendorCommission['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'disputed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPayoutStatusColor = (status: VendorPayout['status']) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleCreateRule = async () => {
    if (!newRule.commission_rate || !newRule.commission_type) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await commissionService.createCommissionRule({
        ...newRule,
        vendor_id: vendorId,
        effective_date: new Date().toISOString(),
      } as any)
      
      setShowRulesModal(false)
      setNewRule({
        commission_type: 'percentage',
        commission_rate: 0.15,
        is_active: true,
      })
      
      await loadData()
    } catch (error) {
      console.error('Error creating commission rule:', error)
      alert('Error creating commission rule')
    }
  }

  const handleCalculatePayout = async () => {
    if (!vendorId) return

    try {
      setIsCalculatingPayout(true)
      const dateRange = getPeriodDateRange(selectedPeriod)
      const result = await commissionService.calculateVendorPayout(
        vendorId,
        dateRange.start_date,
        dateRange.end_date
      )
      
      console.log('Payout calculation result:', result)
      alert(`Payout calculated: $${result.summary.net_payout.toLocaleString()}`)
      
      await loadData()
    } catch (error) {
      console.error('Error calculating payout:', error)
      alert('Error calculating payout')
    } finally {
      setIsCalculatingPayout(false)
    }
  }

  if (commissionLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (commissionError) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Commission Data</h3>
              <p className="text-red-600 text-sm mt-1">{commissionError}</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Commission Dashboard</h2>
          <p className="text-gray-600">
            {vendorId ? 'Vendor commission tracking and payouts' : 'Platform commission overview'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="rounded-md border-gray-300 text-sm focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button
            onClick={() => setShowRulesModal(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <span className="mr-2">⚙️</span>
            Rules
          </button>
          
          {vendorId && (
            <button
              onClick={handleCalculatePayout}
              disabled={isCalculatingPayout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
            >
              <span className={`mr-2 ${isCalculatingPayout ? 'animate-spin' : ''}`}>💰</span>
              {isCalculatingPayout ? 'Calculating...' : 'Calculate Payout'}
            </button>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{commissionStats.total}</p>
            <p className="text-sm text-gray-600">Total Commissions</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{commissionStats.pending}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{commissionStats.paid}</p>
            <p className="text-sm text-gray-600">Paid</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="text-center">
            <p className="text-xl font-bold text-purple-600">${commissionStats.totalAmount.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Amount</p>
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Performance Overview</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Commissions:</span>
                  <span className="font-medium">${analytics.total_commissions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Rate:</span>
                  <span className="font-medium">{(analytics.average_commission_rate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Category Breakdown</h4>
              <div className="space-y-2">
                {analytics.category_breakdown.slice(0, 3).map((category, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm text-gray-600">{category.category}:</span>
                    <span className="font-medium">${category.commission_amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Top Performers</h4>
              <div className="space-y-2">
                {analytics.top_performing_vendors.slice(0, 3).map((vendor, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm text-gray-600">Vendor {vendor.vendor_id.slice(-6)}:</span>
                    <span className="font-medium">${vendor.total_commission.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commission Rules */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Active Commission Rules</h3>
          <button
            onClick={() => setShowRulesModal(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-amber-600 hover:bg-amber-700"
          >
            Add Rule
          </button>
        </div>
        
        <div className="space-y-3">
          {commissionRules.filter(rule => rule.is_active).map((rule) => (
            <div key={rule.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">
                      {rule.product_category || 'Default Rule'}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      {rule.commission_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Rate: {(rule.commission_rate * 100).toFixed(1)}%
                    {rule.min_amount && ` | Min: $${rule.min_amount}`}
                    {rule.max_amount && ` | Max: $${rule.max_amount}`}
                  </p>
                </div>
                
                <div className="text-sm text-gray-500">
                  Effective: {new Date(rule.effective_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
          
          {commissionRules.filter(rule => rule.is_active).length === 0 && (
            <div className="text-center py-8">
              <span className="text-4xl mb-3 block">📋</span>
              <p className="text-gray-500">No active commission rules</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Commissions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Commissions ({vendorCommissions.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {vendorCommissions.length > 0 ? (
            vendorCommissions.slice(0, 10).map((commission) => (
              <div key={commission.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        Order #{commission.order_id.slice(-6)}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCommissionStatusColor(commission.status)}`}>
                        {commission.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Base Amount:</span>
                        <span className="ml-2 font-medium">${commission.base_amount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Commission:</span>
                        <span className="ml-2 font-medium">${commission.commission_amount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rate:</span>
                        <span className="ml-2 font-medium">{(commission.commission_rate * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-2 font-medium">{new Date(commission.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">💰</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Commissions Yet</h3>
              <p className="text-gray-500">
                Commission data will appear here once orders are processed.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Payouts */}
      {vendorId && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Payout History ({vendorPayouts.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {vendorPayouts.length > 0 ? (
              vendorPayouts.slice(0, 5).map((payout) => (
                <div key={payout.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          Payout #{payout.id.slice(-6)}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPayoutStatusColor(payout.status)}`}>
                          {payout.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Net Payout:</span>
                          <span className="ml-2 font-medium">${payout.net_payout.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Orders:</span>
                          <span className="ml-2 font-medium">{payout.orders_count}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Method:</span>
                          <span className="ml-2 font-medium">{payout.payment_method}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Period:</span>
                          <span className="ml-2 font-medium">
                            {new Date(payout.payout_period_start).toLocaleDateString()} - 
                            {new Date(payout.payout_period_end).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">🏦</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payouts Yet</h3>
                <p className="text-gray-500">
                  Payout history will appear here once payouts are processed.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Commission Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create Commission Rule
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commission Type
                  </label>
                  <select
                    value={newRule.commission_type}
                    onChange={(e) => setNewRule(prev => ({
                      ...prev,
                      commission_type: e.target.value as any
                    }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat_fee">Flat Fee</option>
                    <option value="tiered">Tiered</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commission Rate
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={newRule.commission_rate}
                    onChange={(e) => setNewRule(prev => ({
                      ...prev,
                      commission_rate: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="0.15 for 15%"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Category (Optional)
                  </label>
                  <input
                    type="text"
                    value={newRule.product_category || ''}
                    onChange={(e) => setNewRule(prev => ({
                      ...prev,
                      product_category: e.target.value || undefined
                    }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="e.g., Electronics"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Amount (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newRule.min_amount || ''}
                      onChange={(e) => setNewRule(prev => ({
                        ...prev,
                        min_amount: parseFloat(e.target.value) || undefined
                      }))}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Amount (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newRule.max_amount || ''}
                      onChange={(e) => setNewRule(prev => ({
                        ...prev,
                        max_amount: parseFloat(e.target.value) || undefined
                      }))}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      placeholder="10000"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRule}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                >
                  Create Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(CommissionDashboard)