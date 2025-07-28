'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { InventoryItem } from '@ecommerce/shared'
import { useInventoryStore } from '../lib/inventory-store'
import { autoReorderService } from '../lib/auto-reorder-service'

interface AutoReorderDashboardProps {
  className?: string
}

interface ReorderRecommendation {
  inventory_item: InventoryItem
  supplier: any
  recommended_quantity: number
  estimated_cost: number
  urgency: 'low' | 'medium' | 'high' | 'critical'
  reason: string
  lead_time_days: number
  expected_delivery_date: string
}

const AutoReorderDashboard: React.FC<AutoReorderDashboardProps> = ({
  className = ''
}) => {
  const {
    inventoryItems,
    inventoryLoading,
    getInventoryItems,
  } = useInventoryStore()

  const [recommendations, setRecommendations] = useState<ReorderRecommendation[]>([])
  const [reorderReport, setReorderReport] = useState<any>(null)
  const [autoReorderConfig, setAutoReorderConfig] = useState(autoReorderService.getConfig())
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([])
  const [showConfigModal, setShowConfigModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await getInventoryItems()
      await analyzeReorderNeeds()
    } catch (error) {
      console.error('Error loading auto-reorder data:', error)
    }
  }

  const analyzeReorderNeeds = async () => {
    if (inventoryItems.length === 0) return

    try {
      setIsAnalyzing(true)
      const newRecommendations = await autoReorderService.analyzeInventoryForReorder(inventoryItems)
      setRecommendations(newRecommendations)
      
      const report = await autoReorderService.generateReorderReport(newRecommendations)
      setReorderReport(report)
    } catch (error) {
      console.error('Error analyzing reorder needs:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const processAutomaticReorders = async () => {
    try {
      setIsProcessing(true)
      const result = await autoReorderService.processAutomaticReorders(inventoryItems)
      
      if (result.errors.length > 0) {
        alert(`Some orders failed:\n${result.errors.join('\n')}`)
      }
      
      if (result.created_orders.length > 0) {
        alert(`Successfully created ${result.created_orders.length} purchase orders`)
      }
      
      await loadData()
    } catch (error) {
      console.error('Error processing automatic reorders:', error)
      alert('Error processing automatic reorders')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfigUpdate = (updates: Partial<any>) => {
    const newConfig = { ...autoReorderConfig, ...updates }
    setAutoReorderConfig(newConfig)
    autoReorderService.updateConfig(newConfig)
  }

  const getUrgencyColor = (urgency: ReorderRecommendation['urgency']) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getUrgencyIcon = (urgency: ReorderRecommendation['urgency']) => {
    switch (urgency) {
      case 'critical':
        return '🚨'
      case 'high':
        return '⚠️'
      case 'medium':
        return '🟡'
      case 'low':
        return '🔵'
      default:
        return '⚪'
    }
  }

  const handleSelectRecommendation = (itemId: string) => {
    setSelectedRecommendations(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = () => {
    if (selectedRecommendations.length === recommendations.length) {
      setSelectedRecommendations([])
    } else {
      setSelectedRecommendations(recommendations.map(rec => rec.inventory_item.id))
    }
  }

  const selectedRecommendationsCost = useMemo(() => {
    return recommendations
      .filter(rec => selectedRecommendations.includes(rec.inventory_item.id))
      .reduce((sum, rec) => sum + rec.estimated_cost, 0)
  }, [recommendations, selectedRecommendations])

  if (inventoryLoading || isAnalyzing) {
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Auto-Reorder Dashboard</h2>
          <p className="text-gray-600">Intelligent inventory replenishment system</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <span className="mr-2">⚙️</span>
            Settings
          </button>
          
          <button
            onClick={analyzeReorderNeeds}
            disabled={isAnalyzing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
          >
            <span className={`mr-2 ${isAnalyzing ? 'animate-spin' : ''}`}>🔄</span>
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
          
          <button
            onClick={processAutomaticReorders}
            disabled={isProcessing || recommendations.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
          >
            <span className={`mr-2 ${isProcessing ? 'animate-spin' : ''}`}>🤖</span>
            {isProcessing ? 'Processing...' : 'Auto Process'}
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">System Status</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${autoReorderConfig.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {autoReorderConfig.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Approval Required</p>
            <p className="text-lg font-semibold">{autoReorderConfig.approval_required ? 'Yes' : 'No'}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Daily Budget</p>
            <p className="text-lg font-semibold">${autoReorderConfig.budget_limits.daily_limit.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Low Stock Threshold</p>
            <p className="text-lg font-semibold">{(autoReorderConfig.default_reorder_rules.low_stock_threshold * 100).toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Last Analysis</p>
            <p className="text-lg font-semibold">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {reorderReport && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{reorderReport.summary.critical_items}</p>
              <p className="text-sm text-gray-600">Critical Items</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{reorderReport.summary.high_priority_items}</p>
              <p className="text-sm text-gray-600">High Priority</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{reorderReport.summary.total_items}</p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">${reorderReport.summary.total_cost.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Estimated Cost</p>
            </div>
          </div>
        </div>
      )}

      {/* Budget Status */}
      {reorderReport && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Daily Budget Usage</span>
                <span>${reorderReport.budget_analysis.daily_spending.toLocaleString()} / ${autoReorderConfig.budget_limits.daily_limit.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${reorderReport.budget_analysis.within_budget ? 'bg-green-600' : 'bg-red-600'}`}
                  style={{ width: `${Math.min((reorderReport.budget_analysis.daily_spending / autoReorderConfig.budget_limits.daily_limit) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Weekly Budget</span>
                <span>${autoReorderConfig.budget_limits.weekly_limit.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Monthly Budget</span>
                <span>${autoReorderConfig.budget_limits.monthly_limit.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reorder Recommendations */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Reorder Recommendations ({recommendations.length})
            </h3>
            
            {recommendations.length > 0 && (
              <div className="flex items-center space-x-4">
                {selectedRecommendations.length > 0 && (
                  <span className="text-sm text-gray-600">
                    Selected: {selectedRecommendations.length} items (${selectedRecommendationsCost.toLocaleString()})
                  </span>
                )}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedRecommendations.length === recommendations.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Select All</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {recommendations.length > 0 ? (
            recommendations.map((recommendation) => (
              <div key={recommendation.inventory_item.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedRecommendations.includes(recommendation.inventory_item.id)}
                    onChange={() => handleSelectRecommendation(recommendation.inventory_item.id)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 mt-1"
                  />
                  
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{getUrgencyIcon(recommendation.urgency)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {recommendation.inventory_item.sku}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(recommendation.urgency)}`}>
                        {recommendation.urgency}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{recommendation.reason}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Current Stock:</span>
                        <span className="ml-2 font-medium">{recommendation.inventory_item.quantity_available}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Recommended:</span>
                        <span className="ml-2 font-medium">{recommendation.recommended_quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Estimated Cost:</span>
                        <span className="ml-2 font-medium">${recommendation.estimated_cost.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Delivery:</span>
                        <span className="ml-2 font-medium">{recommendation.lead_time_days} days</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-500">
                      Supplier: {recommendation.supplier.name} | 
                      Expected Delivery: {new Date(recommendation.expected_delivery_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">✅</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Inventory Levels Good</h3>
              <p className="text-gray-500">
                No items currently need reordering based on your configured rules.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white mx-4">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Auto-Reorder Configuration
                </h3>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={autoReorderConfig.enabled}
                      onChange={(e) => handleConfigUpdate({ enabled: e.target.checked })}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enable Auto-Reorder System</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={autoReorderConfig.approval_required}
                      onChange={(e) => handleConfigUpdate({ approval_required: e.target.checked })}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Require Manual Approval</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Budget Limit
                    </label>
                    <input
                      type="number"
                      value={autoReorderConfig.budget_limits.daily_limit}
                      onChange={(e) => handleConfigUpdate({
                        budget_limits: {
                          ...autoReorderConfig.budget_limits,
                          daily_limit: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weekly Budget Limit
                    </label>
                    <input
                      type="number"
                      value={autoReorderConfig.budget_limits.weekly_limit}
                      onChange={(e) => handleConfigUpdate({
                        budget_limits: {
                          ...autoReorderConfig.budget_limits,
                          weekly_limit: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Budget Limit
                    </label>
                    <input
                      type="number"
                      value={autoReorderConfig.budget_limits.monthly_limit}
                      onChange={(e) => handleConfigUpdate({
                        budget_limits: {
                          ...autoReorderConfig.budget_limits,
                          monthly_limit: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Low Stock Threshold (% of max stock)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.05"
                    value={autoReorderConfig.default_reorder_rules.low_stock_threshold}
                    onChange={(e) => handleConfigUpdate({
                      default_reorder_rules: {
                        ...autoReorderConfig.default_reorder_rules,
                        low_stock_threshold: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>10%</span>
                    <span>{(autoReorderConfig.default_reorder_rules.low_stock_threshold * 100).toFixed(0)}%</span>
                    <span>50%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowConfigModal(false)
                    analyzeReorderNeeds()
                  }}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                >
                  Save & Analyze
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(AutoReorderDashboard)