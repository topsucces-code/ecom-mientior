'use client'

import { useCallback } from 'react'
import { VendorOrder, VendorCommission } from '@ecommerce/shared'
import { commissionService } from '../lib/commission-service'
import { useVendorStore } from '../lib/vendor-store'

export const useCommissionProcessing = () => {
  const { addVendorCommission } = useVendorStore()

  const processOrderCommissions = useCallback(async (order: VendorOrder): Promise<VendorCommission[]> => {
    try {
      console.log('Processing commissions for order:', order.id)
      
      // Calculate commissions for each item in the order
      const commissions = await commissionService.processOrderCommission(order)
      
      // Add commissions to the vendor store
      for (const commission of commissions) {
        addVendorCommission(commission)
      }
      
      console.log(`Created ${commissions.length} commission records for order ${order.id}`)
      return commissions
    } catch (error) {
      console.error('Error processing order commissions:', error)
      throw error
    }
  }, [addVendorCommission])

  const confirmOrderCommissions = useCallback(async (orderId: string): Promise<void> => {
    try {
      console.log('Confirming commissions for order:', orderId)
      await commissionService.confirmCommissions([orderId])
    } catch (error) {
      console.error('Error confirming commissions:', error)
      throw error
    }
  }, [])

  const disputeCommission = useCallback(async (commissionId: string, reason: string): Promise<void> => {
    try {
      console.log('Disputing commission:', commissionId, 'Reason:', reason)
      await commissionService.disputeCommission(commissionId, reason)
    } catch (error) {
      console.error('Error disputing commission:', error)
      throw error
    }
  }, [])

  const calculateCommissionForOrder = useCallback(async (order: VendorOrder): Promise<{
    totalCommission: number
    itemCommissions: Array<{
      product_id: string
      commission_amount: number
      commission_rate: number
    }>
  }> => {
    try {
      let totalCommission = 0
      const itemCommissions = []

      for (const item of order.order_items) {
        const calculation = await commissionService.calculateCommission({
          vendor_id: order.vendor_id,
          order_id: order.order_id,
          product_id: item.product_id,
          base_amount: item.total_price,
          quantity: item.quantity,
        })

        totalCommission += calculation.commission_amount
        itemCommissions.push({
          product_id: item.product_id,
          commission_amount: calculation.commission_amount,
          commission_rate: calculation.commission_rate,
        })
      }

      return {
        totalCommission,
        itemCommissions,
      }
    } catch (error) {
      console.error('Error calculating commission for order:', error)
      throw error
    }
  }, [])

  return {
    processOrderCommissions,
    confirmOrderCommissions,
    disputeCommission,
    calculateCommissionForOrder,
  }
}