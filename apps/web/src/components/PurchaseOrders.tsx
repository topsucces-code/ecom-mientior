'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { PurchaseOrder, Supplier, InventoryItem } from '@ecommerce/shared'
import { useInventoryStore } from '../lib/inventory-store'

interface PurchaseOrdersProps {
  supplierId?: string
  className?: string
}

interface PurchaseOrderFilters {
  status: PurchaseOrder['status'] | 'all'
  supplier: string | 'all'
  dateRange: {
    startDate: string
    endDate: string
  }
}

interface PurchaseOrderForm {
  supplier_id: string
  items: {
    inventory_item_id: string
    sku: string
    quantity: number
    unit_cost: number
    total: number
  }[]
  expected_delivery_date: string
  notes: string
}

const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({
  supplierId,
  className = ''
}) => {
  const {
    purchaseOrders,
    suppliers,
    inventoryItems,
    ordersLoading,
    ordersError,
    getPurchaseOrders,
    createPurchaseOrder,
    updatePurchaseOrder,
    getSuppliers,
    getInventoryItems,
  } = useInventoryStore()

  const [filters, setFilters] = useState<PurchaseOrderFilters>({
    status: 'all',
    supplier: supplierId || 'all',
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
  })

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState<PurchaseOrder | null>(null)
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null)

  const [formData, setFormData] = useState<PurchaseOrderForm>({
    supplier_id: supplierId || '',
    items: [],
    expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [supplierId])

  const loadData = async () => {
    try {
      await Promise.all([
        getPurchaseOrders(supplierId ? { supplier_id: supplierId } : undefined),
        getSuppliers(),
        getInventoryItems(),
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(order => {
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false
      }
      if (filters.supplier !== 'all' && order.supplier_id !== filters.supplier) {
        return false
      }
      return true
    })
  }, [purchaseOrders, filters])

  const orderStats = useMemo(() => {
    const stats = {
      draft: 0,
      sent: 0,
      confirmed: 0,
      partial: 0,
      completed: 0,
      cancelled: 0,
      totalValue: 0,
    }

    purchaseOrders.forEach(order => {
      stats[order.status]++
      stats.totalValue += order.total_amount
    })

    return stats
  }, [purchaseOrders])

  const getStatusColor = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return '📝'
      case 'sent':
        return '📤'
      case 'confirmed':
        return '✅'
      case 'partial':
        return '🟡'
      case 'completed':
        return '✅'
      case 'cancelled':
        return '❌'
      default:
        return '📋'
    }
  }

  const getSupplierName = (supplierId: string): string => {
    const supplier = suppliers.find(s => s.id === supplierId)
    return supplier?.name || 'Unknown Supplier'
  }

  const addItemToOrder = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          inventory_item_id: '',
          sku: '',
          quantity: 1,
          unit_cost: 0,
          total: 0,
        }
      ]
    }))
  }

  const updateOrderItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      
      // Auto-calculate total when quantity or unit_cost changes
      if (field === 'quantity' || field === 'unit_cost') {
        newItems[index].total = newItems[index].quantity * newItems[index].unit_cost
      }
      
      // Auto-fill SKU when inventory item is selected
      if (field === 'inventory_item_id') {
        const inventoryItem = inventoryItems.find(item => item.id === value)
        if (inventoryItem) {
          newItems[index].sku = inventoryItem.sku
          newItems[index].unit_cost = inventoryItem.unit_cost
          newItems[index].total = newItems[index].quantity * inventoryItem.unit_cost
        }
      }
      
      return { ...prev, items: newItems }
    })
  }

  const removeOrderItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const calculateOrderTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * 0.1 // 10% tax
    const shippingCost = subtotal > 1000 ? 0 : 50 // Free shipping over $1000
    return {
      subtotal,
      taxAmount,
      shippingCost,
      total: subtotal + taxAmount + shippingCost,
    }
  }

  const handleCreateOrder = async () => {
    if (!formData.supplier_id || formData.items.length === 0) {
      alert('Please select a supplier and add at least one item')
      return
    }

    try {
      const totals = calculateOrderTotal()
      const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      
      await createPurchaseOrder({
        supplier_id: formData.supplier_id,
        order_number: orderNumber,
        status: 'draft',
        items: formData.items,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        shipping_cost: totals.shippingCost,
        total_amount: totals.total,
        expected_delivery_date: formData.expected_delivery_date,
        notes: formData.notes,
        created_by: 'current-user-id', // Should come from auth context
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      
      setShowCreateModal(false)
      setFormData({
        supplier_id: supplierId || '',
        items: [],
        expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
      })
      
      await loadData()
    } catch (error) {
      console.error('Error creating purchase order:', error)
      alert('Error creating purchase order. Please try again.')
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: PurchaseOrder['status']) => {
    try {
      await updatePurchaseOrder(orderId, { 
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      await loadData()
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  if (ordersLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (ordersError) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Purchase Orders</h3>
              <p className="text-red-600 text-sm mt-1">{ordersError}</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-gray-600">Manage supplier orders and procurement</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
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
            New Order
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-600">{orderStats.draft}</p>
            <p className="text-xs text-gray-600">Draft</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-center">
            <p className="text-xl font-bold text-blue-600">{orderStats.sent}</p>
            <p className="text-xs text-gray-600">Sent</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-center">
            <p className="text-xl font-bold text-green-600">{orderStats.confirmed}</p>
            <p className="text-xs text-gray-600">Confirmed</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="text-center">
            <p className="text-xl font-bold text-yellow-600">{orderStats.partial}</p>
            <p className="text-xs text-gray-600">Partial</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-center">
            <p className="text-xl font-bold text-green-600">{orderStats.completed}</p>
            <p className="text-xs text-gray-600">Completed</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="text-center">
            <p className="text-xl font-bold text-red-600">{orderStats.cancelled}</p>
            <p className="text-xs text-gray-600">Cancelled</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="text-center">
            <p className="text-lg font-bold text-purple-600">${orderStats.totalValue.toLocaleString()}</p>
            <p className="text-xs text-gray-600">Total Value</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                status: e.target.value as PurchaseOrderFilters['status']
              }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="confirmed">Confirmed</option>
              <option value="partial">Partial</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier
            </label>
            <select
              value={filters.supplier}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                supplier: e.target.value
              }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
              disabled={!!supplierId}
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
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

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Purchase Orders ({filteredOrders.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getStatusIcon(order.status)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {order.order_number}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Supplier: {getSupplierName(order.supplier_id)}</span>
                        <span>•</span>
                        <span>Total: ${order.total_amount.toLocaleString()}</span>
                        <span>•</span>
                        <span>Created: {new Date(order.created_at).toLocaleDateString()}</span>
                        {order.expected_delivery_date && (
                          <>
                            <span>•</span>
                            <span>Expected: {new Date(order.expected_delivery_date).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowDetailsModal(order)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                    >
                      View Details
                    </button>
                    
                    {order.status === 'draft' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'sent')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Send Order
                      </button>
                    )}
                    
                    {order.status === 'sent' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Mark Confirmed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📋</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase Orders Found</h3>
              <p className="text-gray-500">
                {purchaseOrders.length === 0 
                  ? "Create your first purchase order to get started." 
                  : "No orders match your current filters."
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mx-4">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create Purchase Order
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier
                    </label>
                    <select
                      value={formData.supplier_id}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        supplier_id: e.target.value
                      }))}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      disabled={!!supplierId}
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        expected_delivery_date: e.target.value
                      }))}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">Order Items</h4>
                    <button
                      onClick={addItemToOrder}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-amber-600 hover:bg-amber-700"
                    >
                      Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-5 gap-3 items-end p-3 bg-gray-50 rounded">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Inventory Item
                          </label>
                          <select
                            value={item.inventory_item_id}
                            onChange={(e) => updateOrderItem(index, 'inventory_item_id', e.target.value)}
                            className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                          >
                            <option value="">Select item</option>
                            {inventoryItems.map(invItem => (
                              <option key={invItem.id} value={invItem.id}>
                                {invItem.sku}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Unit Cost
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_cost}
                            onChange={(e) => updateOrderItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Total
                          </label>
                          <input
                            type="text"
                            value={`$${item.total.toFixed(2)}`}
                            readOnly
                            className="w-full text-sm rounded-md border-gray-300 bg-gray-100"
                          />
                        </div>
                        
                        <div>
                          <button
                            onClick={() => removeOrderItem(index)}
                            className="w-full px-2 py-1.5 text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {formData.items.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${calculateOrderTotal().subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (10%):</span>
                        <span>${calculateOrderTotal().taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping:</span>
                        <span>${calculateOrderTotal().shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span>${calculateOrderTotal().total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="Additional notes for this order"
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
                  onClick={handleCreateOrder}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                >
                  Create Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white mx-4">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Purchase Order Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Order Number</p>
                    <p className="text-lg font-bold">{showDetailsModal.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Supplier</p>
                    <p className="text-lg">{getSupplierName(showDetailsModal.supplier_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(showDetailsModal.status)}`}>
                      {showDetailsModal.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Amount</p>
                    <p className="text-lg font-bold">${showDetailsModal.total_amount.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                  <div className="bg-gray-50 rounded p-4">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(showDetailsModal.items, null, 2)}
                    </pre>
                  </div>
                </div>

                {showDetailsModal.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-700">{showDetailsModal.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(PurchaseOrders)