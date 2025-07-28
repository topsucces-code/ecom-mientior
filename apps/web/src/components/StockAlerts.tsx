'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { StockAlert, InventoryItem } from '@ecommerce/shared'
import { useInventoryStore } from '../lib/inventory-store'

interface StockAlertsProps {
  warehouseId?: string
  className?: string
}

interface AlertFilters {
  alertType: StockAlert['alert_type'] | 'all'
  severity: StockAlert['severity'] | 'all'
  resolved: 'all' | 'resolved' | 'unresolved'
}

const StockAlerts: React.FC<StockAlertsProps> = ({
  warehouseId,
  className = ''
}) => {
  const {
    stockAlerts,
    inventoryItems,
    alertsLoading,
    alertsError,
    getStockAlerts,
    resolveStockAlert,
    updateInventoryItem,
  } = useInventoryStore()

  const [filters, setFilters] = useState<AlertFilters>({
    alertType: 'all',
    severity: 'all',
    resolved: 'all',
  })

  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([])
  const [showResolveModal, setShowResolveModal] = useState(false)

  useEffect(() => {
    loadAlerts()
  }, [warehouseId])

  const loadAlerts = async () => {
    try {
      await getStockAlerts(warehouseId ? { warehouse_id: warehouseId } : undefined)
    } catch (error) {
      console.error('Error loading stock alerts:', error)
    }
  }

  const filteredAlerts = useMemo(() => {
    return stockAlerts.filter(alert => {
      if (filters.alertType !== 'all' && alert.alert_type !== filters.alertType) {
        return false
      }
      if (filters.severity !== 'all' && alert.severity !== filters.severity) {
        return false
      }
      if (filters.resolved !== 'all') {
        const isResolved = alert.is_resolved
        if (filters.resolved === 'resolved' && !isResolved) return false
        if (filters.resolved === 'unresolved' && isResolved) return false
      }
      return true
    })
  }, [stockAlerts, filters])

  const alertStats = useMemo(() => {
    const stats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      unresolved: 0,
      total: stockAlerts.length,
    }

    stockAlerts.forEach(alert => {
      stats[alert.severity]++
      if (!alert.is_resolved) {
        stats.unresolved++
      }
    })

    return stats
  }, [stockAlerts])

  const getAlertIcon = (alertType: StockAlert['alert_type']) => {
    switch (alertType) {
      case 'low_stock':
        return '⚠️'
      case 'out_of_stock':
        return '🚫'
      case 'overstock':
        return '📦'
      case 'expiring_soon':
        return '⏰'
      case 'expired':
        return '❌'
      default:
        return '⚠️'
    }
  }

  const getSeverityColor = (severity: StockAlert['severity']) => {
    switch (severity) {
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

  const getAlertTypeLabel = (alertType: StockAlert['alert_type']) => {
    switch (alertType) {
      case 'low_stock':
        return 'Low Stock'
      case 'out_of_stock':
        return 'Out of Stock'
      case 'overstock':
        return 'Overstock'
      case 'expiring_soon':
        return 'Expiring Soon'
      case 'expired':
        return 'Expired'
      default:
        return 'Unknown'
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveStockAlert(alertId)
      await loadAlerts()
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const handleBulkResolve = async () => {
    try {
      await Promise.all(
        selectedAlerts.map(alertId => resolveStockAlert(alertId))
      )
      setSelectedAlerts([])
      setShowResolveModal(false)
      await loadAlerts()
    } catch (error) {
      console.error('Error resolving alerts:', error)
    }
  }

  const handleSelectAlert = (alertId: string) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId)
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    )
  }

  const handleSelectAll = () => {
    const unresolvedAlerts = filteredAlerts
      .filter(alert => !alert.is_resolved)
      .map(alert => alert.id)
    
    if (selectedAlerts.length === unresolvedAlerts.length) {
      setSelectedAlerts([])
    } else {
      setSelectedAlerts(unresolvedAlerts)
    }
  }

  const getInventoryItemForAlert = (alert: StockAlert): InventoryItem | undefined => {
    return inventoryItems.find(item => item.id === alert.inventory_item_id)
  }

  if (alertsLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (alertsError) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Alerts</h3>
              <p className="text-red-600 text-sm mt-1">{alertsError}</p>
            </div>
          </div>
          <button
            onClick={loadAlerts}
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
          <h2 className="text-2xl font-bold text-gray-900">Stock Alerts</h2>
          <p className="text-gray-600">Monitor inventory levels and take action on alerts</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadAlerts}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <span className="mr-2">🔄</span>
            Refresh
          </button>
          
          {selectedAlerts.length > 0 && (
            <button
              onClick={() => setShowResolveModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Resolve Selected ({selectedAlerts.length})
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{alertStats.critical}</p>
            <p className="text-sm text-gray-600">Critical</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{alertStats.high}</p>
            <p className="text-sm text-gray-600">High</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{alertStats.medium}</p>
            <p className="text-sm text-gray-600">Medium</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{alertStats.low}</p>
            <p className="text-sm text-gray-600">Low</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{alertStats.unresolved}</p>
            <p className="text-sm text-gray-600">Unresolved</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Type
            </label>
            <select
              value={filters.alertType}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                alertType: e.target.value as AlertFilters['alertType']
              }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            >
              <option value="all">All Types</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstock">Overstock</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                severity: e.target.value as AlertFilters['severity']
              }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.resolved}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                resolved: e.target.value as AlertFilters['resolved']
              }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="unresolved">Unresolved</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Alerts ({filteredAlerts.length})
            </h3>
            
            {filteredAlerts.some(alert => !alert.is_resolved) && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedAlerts.length === filteredAlerts.filter(a => !a.is_resolved).length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="ml-2 text-sm text-gray-700">Select All</span>
              </label>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => {
              const inventoryItem = getInventoryItemForAlert(alert)
              
              return (
                <div
                  key={alert.id}
                  className={`p-6 hover:bg-gray-50 ${alert.is_resolved ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start space-x-4">
                    {!alert.is_resolved && (
                      <input
                        type="checkbox"
                        checked={selectedAlerts.includes(alert.id)}
                        onChange={() => handleSelectAlert(alert.id)}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 mt-1"
                      />
                    )}
                    
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getAlertIcon(alert.alert_type)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            {getAlertTypeLabel(alert.alert_type)}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          {alert.is_resolved && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              Resolved
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {inventoryItem && (
                        <p className="text-sm text-gray-600 mt-1">
                          Product: {inventoryItem.sku} | Current: {alert.current_value}
                          {alert.threshold_value && ` | Threshold: ${alert.threshold_value}`}
                        </p>
                      )}
                      
                      <div className="mt-4 flex items-center space-x-3">
                        {!alert.is_resolved && (
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Mark Resolved
                          </button>
                        )}
                        
                        {inventoryItem && (
                          <button
                            onClick={() => {
                              // Navigate to inventory item details
                              console.log('Navigate to inventory item:', inventoryItem.id)
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                          >
                            View Item
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">✅</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts Found</h3>
              <p className="text-gray-500">
                {stockAlerts.length === 0 
                  ? "No stock alerts to display." 
                  : "No alerts match your current filters."
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirm Bulk Resolution
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to resolve {selectedAlerts.length} selected alerts?
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkResolve}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Resolve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(StockAlerts)