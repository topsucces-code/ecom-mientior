'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { InventoryMovement, InventoryItem, Product } from '@ecommerce/shared'
import { useInventoryStore } from '../lib/inventory-store'

interface InventoryMovementsProps {
  inventoryItemId?: string
  warehouseId?: string
  className?: string
}

interface MovementFilters {
  movementType: InventoryMovement['movement_type'] | 'all'
  referenceType: InventoryMovement['reference_type'] | 'all'
  dateRange: {
    startDate: string
    endDate: string
  }
}

const InventoryMovements: React.FC<InventoryMovementsProps> = ({
  inventoryItemId,
  warehouseId,
  className = ''
}) => {
  const {
    inventoryMovements,
    inventoryItems,
    movementsLoading,
    movementsError,
    getInventoryMovements,
    createInventoryMovement,
  } = useInventoryStore()

  const [filters, setFilters] = useState<MovementFilters>({
    movementType: 'all',
    referenceType: 'all',
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
  })

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newMovement, setNewMovement] = useState({
    inventory_item_id: inventoryItemId || '',
    movement_type: 'adjustment' as InventoryMovement['movement_type'],
    quantity: 0,
    reference_type: 'adjustment' as InventoryMovement['reference_type'],
    reason: '',
    notes: '',
  })

  useEffect(() => {
    loadMovements()
  }, [inventoryItemId, warehouseId, filters.dateRange])

  const loadMovements = async () => {
    try {
      const filterParams: any = {}
      
      if (inventoryItemId) {
        filterParams.inventory_item_id = inventoryItemId
      }
      
      if (warehouseId) {
        filterParams.warehouse_id = warehouseId
      }
      
      if (filters.dateRange.startDate && filters.dateRange.endDate) {
        filterParams.date_range = {
          start_date: filters.dateRange.startDate,
          end_date: filters.dateRange.endDate,
        }
      }
      
      await getInventoryMovements(filterParams)
    } catch (error) {
      console.error('Error loading inventory movements:', error)
    }
  }

  const filteredMovements = useMemo(() => {
    return inventoryMovements.filter(movement => {
      if (filters.movementType !== 'all' && movement.movement_type !== filters.movementType) {
        return false
      }
      if (filters.referenceType !== 'all' && movement.reference_type !== filters.referenceType) {
        return false
      }
      return true
    })
  }, [inventoryMovements, filters])

  const movementStats = useMemo(() => {
    const stats = {
      inbound: 0,
      outbound: 0,
      adjustments: 0,
      transfers: 0,
      totalQuantity: 0,
    }

    filteredMovements.forEach(movement => {
      switch (movement.movement_type) {
        case 'inbound':
          stats.inbound += Math.abs(movement.quantity)
          break
        case 'outbound':
          stats.outbound += Math.abs(movement.quantity)
          break
        case 'adjustment':
          stats.adjustments += Math.abs(movement.quantity)
          break
        case 'transfer':
          stats.transfers += Math.abs(movement.quantity)
          break
      }
      stats.totalQuantity += movement.quantity
    })

    return stats
  }, [filteredMovements])

  const getMovementIcon = (movementType: InventoryMovement['movement_type']) => {
    switch (movementType) {
      case 'inbound':
        return '📥'
      case 'outbound':
        return '📤'
      case 'adjustment':
        return '⚖️'
      case 'transfer':
        return '🔄'
      case 'reserved':
        return '🔒'
      case 'unreserved':
        return '🔓'
      default:
        return '📋'
    }
  }

  const getMovementTypeLabel = (movementType: InventoryMovement['movement_type']) => {
    switch (movementType) {
      case 'inbound':
        return 'Inbound'
      case 'outbound':
        return 'Outbound'
      case 'adjustment':
        return 'Adjustment'
      case 'transfer':
        return 'Transfer'
      case 'reserved':
        return 'Reserved'
      case 'unreserved':
        return 'Unreserved'
      default:
        return 'Unknown'
    }
  }

  const getMovementColor = (movementType: InventoryMovement['movement_type'], quantity: number) => {
    if (quantity > 0) {
      return 'text-green-600'
    } else if (quantity < 0) {
      return 'text-red-600'
    }
    return 'text-gray-600'
  }

  const getInventoryItemForMovement = (movement: InventoryMovement): InventoryItem | undefined => {
    return inventoryItems.find(item => item.id === movement.inventory_item_id)
  }

  const handleCreateMovement = async () => {
    if (!newMovement.inventory_item_id || newMovement.quantity === 0) {
      alert('Please select an inventory item and enter a quantity')
      return
    }

    try {
      await createInventoryMovement({
        ...newMovement,
        created_at: new Date().toISOString(),
      })
      
      setShowCreateModal(false)
      setNewMovement({
        inventory_item_id: inventoryItemId || '',
        movement_type: 'adjustment',
        quantity: 0,
        reference_type: 'adjustment',
        reason: '',
        notes: '',
      })
      
      await loadMovements()
    } catch (error) {
      console.error('Error creating movement:', error)
      alert('Error creating movement. Please try again.')
    }
  }

  if (movementsLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-16"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (movementsError) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Movements</h3>
              <p className="text-red-600 text-sm mt-1">{movementsError}</p>
            </div>
          </div>
          <button
            onClick={loadMovements}
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
          <h2 className="text-2xl font-bold text-gray-900">Inventory Movements</h2>
          <p className="text-gray-600">Track all inventory transactions and changes</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadMovements}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <span className="mr-2">🔄</span>
            Refresh
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <span className="mr-2">➕</span>
            Add Movement
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{movementStats.inbound}</p>
            <p className="text-sm text-gray-600">Inbound</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{movementStats.outbound}</p>
            <p className="text-sm text-gray-600">Outbound</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{movementStats.adjustments}</p>
            <p className="text-sm text-gray-600">Adjustments</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{movementStats.transfers}</p>
            <p className="text-sm text-gray-600">Transfers</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Movement Type
            </label>
            <select
              value={filters.movementType}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                movementType: e.target.value as MovementFilters['movementType']
              }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            >
              <option value="all">All Types</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
              <option value="adjustment">Adjustment</option>
              <option value="transfer">Transfer</option>
              <option value="reserved">Reserved</option>
              <option value="unreserved">Unreserved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Type
            </label>
            <select
              value={filters.referenceType}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                referenceType: e.target.value as MovementFilters['referenceType']
              }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            >
              <option value="all">All References</option>
              <option value="order">Order</option>
              <option value="transfer">Transfer</option>
              <option value="adjustment">Adjustment</option>
              <option value="purchase_order">Purchase Order</option>
              <option value="return">Return</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.dateRange.startDate}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, startDate: e.target.value }
              }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.dateRange.endDate}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, endDate: e.target.value }
              }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Movement History ({filteredMovements.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Movement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovements.length > 0 ? (
                filteredMovements.map((movement) => {
                  const inventoryItem = getInventoryItemForMovement(movement)
                  
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-3">{getMovementIcon(movement.movement_type)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getMovementTypeLabel(movement.movement_type)}
                            </div>
                            {movement.reference_type && (
                              <div className="text-sm text-gray-500">
                                {movement.reference_type}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {inventoryItem?.sku || 'Unknown'}
                        </div>
                        {inventoryItem?.location && (
                          <div className="text-sm text-gray-500">
                            Location: {inventoryItem.location}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-medium ${getMovementColor(movement.movement_type, movement.quantity)}`}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.reference_id ? (
                          <div>
                            <div>ID: {movement.reference_id.slice(-6)}</div>
                            {movement.reference_type && (
                              <div className="text-gray-500">
                                Type: {movement.reference_type}
                              </div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {movement.reason || '-'}
                        </div>
                        {movement.notes && (
                          <div className="text-sm text-gray-500 mt-1">
                            {movement.notes}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(movement.created_at).toLocaleDateString()}
                        <div className="text-xs">
                          {new Date(movement.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-center">
                      <span className="text-6xl mb-4 block">📊</span>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Movements Found</h3>
                      <p className="text-gray-500">
                        No inventory movements match your current filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Movement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create Inventory Movement
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inventory Item
                  </label>
                  <select
                    value={newMovement.inventory_item_id}
                    onChange={(e) => setNewMovement(prev => ({
                      ...prev,
                      inventory_item_id: e.target.value
                    }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    disabled={!!inventoryItemId}
                  >
                    <option value="">Select inventory item</option>
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.sku} ({item.quantity_available} available)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Movement Type
                  </label>
                  <select
                    value={newMovement.movement_type}
                    onChange={(e) => setNewMovement(prev => ({
                      ...prev,
                      movement_type: e.target.value as InventoryMovement['movement_type']
                    }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  >
                    <option value="adjustment">Adjustment</option>
                    <option value="inbound">Inbound</option>
                    <option value="outbound">Outbound</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity (use negative numbers for reductions)
                  </label>
                  <input
                    type="number"
                    value={newMovement.quantity || ''}
                    onChange={(e) => setNewMovement(prev => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 0
                    }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="Enter quantity change"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={newMovement.reason}
                    onChange={(e) => setNewMovement(prev => ({
                      ...prev,
                      reason: e.target.value
                    }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="Reason for movement"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newMovement.notes}
                    onChange={(e) => setNewMovement(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMovement}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                >
                  Create Movement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(InventoryMovements)