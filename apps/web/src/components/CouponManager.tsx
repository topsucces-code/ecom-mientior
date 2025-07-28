'use client'

import React, { useState, useEffect } from 'react'
import { useCouponStore, Coupon } from '../lib/coupon-store'

interface CouponManagerProps {
  className?: string
}

type ViewMode = 'list' | 'create' | 'edit'

const CouponManager: React.FC<CouponManagerProps> = ({ className = '' }) => {
  const {
    coupons,
    loading,
    error,
    fetchCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon
  } = useCouponStore()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    value: 0,
    description: '',
    minimumOrderAmount: '',
    maximumDiscountAmount: '',
    usageLimit: '',
    userUsageLimit: '',
    validFrom: '',
    validTo: '',
    categories: '',
    products: '',
    isActive: true
  })

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  useEffect(() => {
    if (editingCoupon) {
      setFormData({
        code: editingCoupon.code,
        type: editingCoupon.type,
        value: editingCoupon.value,
        description: editingCoupon.description,
        minimumOrderAmount: editingCoupon.minimumOrderAmount?.toString() || '',
        maximumDiscountAmount: editingCoupon.maximumDiscountAmount?.toString() || '',
        usageLimit: editingCoupon.usageLimit?.toString() || '',
        userUsageLimit: editingCoupon.userUsageLimit?.toString() || '',
        validFrom: editingCoupon.validFrom.split('T')[0],
        validTo: editingCoupon.validTo.split('T')[0],
        categories: editingCoupon.categories?.join(', ') || '',
        products: editingCoupon.products?.join(', ') || '',
        isActive: editingCoupon.isActive
      })
    } else {
      // Reset form for new coupon
      setFormData({
        code: '',
        type: 'percentage',
        value: 0,
        description: '',
        minimumOrderAmount: '',
        maximumDiscountAmount: '',
        usageLimit: '',
        userUsageLimit: '',
        validFrom: '',
        validTo: '',
        categories: '',
        products: '',
        isActive: true
      })
    }
  }, [editingCoupon])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const couponData = {
      code: formData.code.toUpperCase(),
      type: formData.type,
      value: formData.value,
      description: formData.description,
      minimumOrderAmount: formData.minimumOrderAmount ? Number(formData.minimumOrderAmount) : undefined,
      maximumDiscountAmount: formData.maximumDiscountAmount ? Number(formData.maximumDiscountAmount) : undefined,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
      userUsageLimit: formData.userUsageLimit ? Number(formData.userUsageLimit) : undefined,
      validFrom: new Date(formData.validFrom).toISOString(),
      validTo: new Date(formData.validTo + 'T23:59:59').toISOString(),
      categories: formData.categories.split(',').map(c => c.trim()).filter(c => c),
      products: formData.products.split(',').map(p => p.trim()).filter(p => p),
      isActive: formData.isActive
    }

    try {
      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, couponData)
      } else {
        await createCoupon(couponData)
      }
      
      setViewMode('list')
      setEditingCoupon(null)
      fetchCoupons()
    } catch (error) {
      console.error('Failed to save coupon:', error)
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setViewMode('edit')
  }

  const handleDelete = async (couponId: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      await deleteCoupon(couponId)
      fetchCoupons()
    }
  }

  const formatCouponValue = (coupon: Coupon) => {
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.value}%`
      case 'fixed':
        return `$${coupon.value}`
      case 'free_shipping':
        return 'Free Shipping'
      default:
        return coupon.value.toString()
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
  }

  const getUsagePercent = (coupon: Coupon) => {
    if (!coupon.usageLimit) return 0
    return (coupon.usageCount / coupon.usageLimit) * 100
  }

  if (loading && coupons.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              🎟️ Coupon Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Create and manage discount coupons for your store
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {viewMode !== 'list' && (
              <button
                onClick={() => {
                  setViewMode('list')
                  setEditingCoupon(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to List
              </button>
            )}
            
            {viewMode === 'list' && (
              <button
                onClick={() => setViewMode('create')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Create Coupon
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Active Coupons ({coupons.length})
            </h2>
          </div>

          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎟️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Coupons Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first coupon to start offering discounts to customers.
              </p>
              <button
                onClick={() => setViewMode('create')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Create First Coupon
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 font-mono">
                          {coupon.code}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(coupon.isActive)}`}>
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {formatCouponValue(coupon)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{coupon.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-1 font-medium capitalize">{coupon.type.replace('_', ' ')}</span>
                        </div>
                        
                        {coupon.minimumOrderAmount && (
                          <div>
                            <span className="text-gray-500">Min Order:</span>
                            <span className="ml-1 font-medium">${coupon.minimumOrderAmount}</span>
                          </div>
                        )}
                        
                        <div>
                          <span className="text-gray-500">Valid Until:</span>
                          <span className="ml-1 font-medium">
                            {new Date(coupon.validTo).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-gray-500">Usage:</span>
                          <span className="ml-1 font-medium">
                            {coupon.usageCount}
                            {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                          </span>
                        </div>
                      </div>

                      {coupon.usageLimit && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-500">Usage Progress</span>
                            <span className="font-medium">{Math.round(getUsagePercent(coupon))}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(getUsagePercent(coupon), 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {(coupon.categories?.length || coupon.products?.length) && (
                        <div className="mt-3 text-sm">
                          {coupon.categories?.length > 0 && (
                            <div>
                              <span className="text-gray-500">Categories:</span>
                              <span className="ml-1">{coupon.categories.join(', ')}</span>
                            </div>
                          )}
                          {coupon.products?.length > 0 && (
                            <div>
                              <span className="text-gray-500">Products:</span>
                              <span className="ml-1">{coupon.products.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit coupon"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete coupon"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Form */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="WELCOME10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>

              {formData.type !== 'free_shipping' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Value *
                  </label>
                  <div className="relative">
                    {formData.type === 'fixed' && (
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    )}
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                      placeholder={formData.type === 'percentage' ? '10' : '50'}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        formData.type === 'fixed' ? 'pl-8' : ''
                      }`}
                      min="0"
                      max={formData.type === 'percentage' ? '100' : undefined}
                      required
                    />
                    {formData.type === 'percentage' && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    )}
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="10% off your first order"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Restrictions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.minimumOrderAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimumOrderAmount: e.target.value }))}
                    placeholder="50"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              {formData.type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Discount Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.maximumDiscountAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, maximumDiscountAmount: e.target.value }))}
                      placeholder="20"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>
              )}

              {/* Usage Limits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Usage Limit
                </label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Usage Limit
                </label>
                <input
                  type="number"
                  value={formData.userUsageLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, userUsageLimit: e.target.value }))}
                  placeholder="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                />
              </div>

              {/* Validity Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid From *
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid To *
                </label>
                <input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Product/Category Restrictions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.categories}
                  onChange={(e) => setFormData(prev => ({ ...prev, categories: e.target.value }))}
                  placeholder="electronics, clothing"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product IDs (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.products}
                  onChange={(e) => setFormData(prev => ({ ...prev, products: e.target.value }))}
                  placeholder="product-1, product-2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setViewMode('list')
                  setEditingCoupon(null)
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default CouponManager