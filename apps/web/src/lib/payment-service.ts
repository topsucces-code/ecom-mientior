'use client'

import { supabase } from './supabase/client'
import { 
  Payment, 
  PaymentMethod, 
  Order,
  VendorPayout 
} from './supabase/types'

export interface ProcessPaymentData {
  order_id: string
  payment_method_id: string
  amount: number
  currency?: string
  payment_intent_id?: string
  metadata?: any
}

export interface CreatePaymentMethodData {
  user_id: string
  type: 'card' | 'bank_account' | 'digital_wallet'
  provider: 'stripe' | 'paypal' | 'bank'
  card_last_four?: string
  card_brand?: string
  card_exp_month?: number
  card_exp_year?: number
  bank_name?: string
  account_last_four?: string
  digital_wallet_email?: string
  is_default?: boolean
}

export class PaymentService {

  // ========== PAYMENT PROCESSING ==========

  async processPayment(paymentData: ProcessPaymentData): Promise<Payment> {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          user:users(id, email),
          items:order_items(
            *,
            product:products(name, vendor_id)
          )
        `)
        .eq('id', paymentData.order_id)
        .single()

      if (orderError) {
        console.error('Error fetching order:', orderError)
        throw new Error('Order not found')
      }

      // Get payment method
      const { data: paymentMethod, error: pmError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', paymentData.payment_method_id)
        .single()

      if (pmError) {
        console.error('Error fetching payment method:', pmError)
        throw new Error('Payment method not found')
      }

      // Process payment based on provider
      let paymentResult
      switch (paymentMethod.provider) {
        case 'stripe':
          paymentResult = await this.processStripePayment(paymentData, order, paymentMethod)
          break
        case 'paypal':
          paymentResult = await this.processPayPalPayment(paymentData, order, paymentMethod)
          break
        default:
          throw new Error(`Unsupported payment provider: ${paymentMethod.provider}`)
      }

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: paymentData.order_id,
          user_id: order.user_id,
          payment_method_id: paymentData.payment_method_id,
          amount: paymentData.amount,
          currency: paymentData.currency || 'USD',
          status: paymentResult.status,
          transaction_id: paymentResult.transaction_id,
          payment_intent_id: paymentData.payment_intent_id,
          provider_response: paymentResult.provider_response,
          metadata: paymentData.metadata,
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          order:orders(*),
          payment_method:payment_methods(*)
        `)
        .single()

      if (paymentError) {
        console.error('Error creating payment record:', paymentError)
        throw new Error('Failed to create payment record')
      }

      // Update order status if payment successful
      if (paymentResult.status === 'completed') {
        await supabase
          .from('orders')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentData.order_id)

        // Process vendor payouts
        await this.processVendorPayouts(order)
      } else if (paymentResult.status === 'failed') {
        await supabase
          .from('orders')
          .update({
            status: 'payment_failed',
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentData.order_id)
      }

      return payment
    } catch (error) {
      console.error('Error in processPayment:', error)
      throw error
    }
  }

  private async processStripePayment(paymentData: ProcessPaymentData, order: any, paymentMethod: any): Promise<any> {
    // In a real implementation, this would integrate with Stripe API
    // For now, we'll simulate the payment process
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simulate payment success/failure (90% success rate)
      const isSuccessful = Math.random() > 0.1

      if (isSuccessful) {
        return {
          status: 'completed',
          transaction_id: `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          provider_response: {
            stripe_payment_intent_id: paymentData.payment_intent_id,
            status: 'succeeded',
            amount_received: paymentData.amount * 100, // Stripe uses cents
            currency: paymentData.currency || 'usd'
          }
        }
      } else {
        return {
          status: 'failed',
          transaction_id: null,
          provider_response: {
            error: {
              type: 'card_error',
              code: 'card_declined',
              message: 'Your card was declined.'
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing Stripe payment:', error)
      throw new Error('Payment processing failed')
    }
  }

  private async processPayPalPayment(paymentData: ProcessPaymentData, order: any, paymentMethod: any): Promise<any> {
    // In a real implementation, this would integrate with PayPal API
    // For now, we'll simulate the payment process
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Simulate payment success/failure (95% success rate)
      const isSuccessful = Math.random() > 0.05

      if (isSuccessful) {
        return {
          status: 'completed',
          transaction_id: `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          provider_response: {
            paypal_payment_id: `PAY-${Math.random().toString(36).substr(2, 17).toUpperCase()}`,
            status: 'approved',
            amount: paymentData.amount,
            currency: paymentData.currency || 'USD'
          }
        }
      } else {
        return {
          status: 'failed',
          transaction_id: null,
          provider_response: {
            error: {
              name: 'INSTRUMENT_DECLINED',
              message: 'The instrument presented was either declined by the processor or bank, or it cannot be used for this payment.'
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing PayPal payment:', error)
      throw new Error('Payment processing failed')
    }
  }

  // ========== PAYMENT METHODS ==========

  async createPaymentMethod(methodData: CreatePaymentMethodData): Promise<PaymentMethod> {
    try {
      // If this is set as default, update existing default
      if (methodData.is_default) {
        await supabase
          .from('payment_methods')
          .update({ is_default: false })
          .eq('user_id', methodData.user_id)
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          ...methodData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating payment method:', error)
        throw new Error('Failed to create payment method')
      }

      return data
    } catch (error) {
      console.error('Error in createPaymentMethod:', error)
      throw error
    }
  }

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching payment methods:', error)
        throw new Error('Failed to fetch payment methods')
      }

      return data || []
    } catch (error) {
      console.error('Error in getPaymentMethods:', error)
      throw error
    }
  }

  async deletePaymentMethod(methodId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', methodId)

      if (error) {
        console.error('Error deleting payment method:', error)
        throw new Error('Failed to delete payment method')
      }
    } catch (error) {
      console.error('Error in deletePaymentMethod:', error)
      throw error
    }
  }

  async setDefaultPaymentMethod(methodId: string, userId: string): Promise<void> {
    try {
      // Remove default from all methods
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId)

      // Set new default
      const { error } = await supabase
        .from('payment_methods')
        .update({
          is_default: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', methodId)

      if (error) {
        console.error('Error setting default payment method:', error)
        throw new Error('Failed to set default payment method')
      }
    } catch (error) {
      console.error('Error in setDefaultPaymentMethod:', error)
      throw error
    }
  }

  // ========== PAYMENT HISTORY ==========

  async getPayments(filters?: {
    user_id?: string
    order_id?: string
    status?: string
    date_from?: string
    date_to?: string
  }): Promise<Payment[]> {
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          order:orders(id, order_number, total_amount),
          payment_method:payment_methods(type, provider, card_last_four),
          user:users(id, email, profile:user_profiles(first_name, last_name))
        `)

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      if (filters?.order_id) {
        query = query.eq('order_id', filters.order_id)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching payments:', error)
        throw new Error('Failed to fetch payments')
      }

      return data || []
    } catch (error) {
      console.error('Error in getPayments:', error)
      throw error
    }
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          order:orders(
            id, order_number, total_amount,
            items:order_items(
              *,
              product:products(name, sku)
            )
          ),
          payment_method:payment_methods(*),
          user:users(id, email, profile:user_profiles(first_name, last_name))
        `)
        .eq('id', paymentId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        console.error('Error fetching payment:', error)
        throw new Error('Failed to fetch payment')
      }

      return data
    } catch (error) {
      console.error('Error in getPaymentById:', error)
      throw error
    }
  }

  // ========== REFUNDS ==========

  async processRefund(paymentId: string, amount?: number, reason?: string): Promise<Payment> {
    try {
      const payment = await this.getPaymentById(paymentId)
      if (!payment) {
        throw new Error('Payment not found')
      }

      const refundAmount = amount || payment.amount
      
      // Process refund with payment provider
      let refundResult
      if (payment.payment_method.provider === 'stripe') {
        refundResult = await this.processStripeRefund(payment, refundAmount, reason)
      } else if (payment.payment_method.provider === 'paypal') {
        refundResult = await this.processPayPalRefund(payment, refundAmount, reason)
      } else {
        throw new Error(`Refunds not supported for provider: ${payment.payment_method.provider}`)
      }

      // Create refund payment record
      const { data: refundPayment, error } = await supabase
        .from('payments')
        .insert({
          order_id: payment.order_id,
          user_id: payment.user_id,
          payment_method_id: payment.payment_method_id,
          amount: -refundAmount, // Negative amount for refund
          currency: payment.currency,
          status: refundResult.status,
          transaction_id: refundResult.transaction_id,
          parent_payment_id: paymentId,
          provider_response: refundResult.provider_response,
          metadata: { 
            refund_reason: reason,
            original_payment_id: paymentId 
          },
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          order:orders(*),
          payment_method:payment_methods(*)
        `)
        .single()

      if (error) {
        console.error('Error creating refund record:', error)
        throw new Error('Failed to create refund record')
      }

      // Update original payment status
      await supabase
        .from('payments')
        .update({
          status: refundAmount >= payment.amount ? 'refunded' : 'partially_refunded',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)

      return refundPayment
    } catch (error) {
      console.error('Error in processRefund:', error)
      throw error
    }
  }

  private async processStripeRefund(payment: any, amount: number, reason?: string): Promise<any> {
    // Simulate Stripe refund API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      return {
        status: 'completed',
        transaction_id: `stripe_refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        provider_response: {
          refund_id: `re_${Math.random().toString(36).substr(2, 16)}`,
          status: 'succeeded',
          amount: amount * 100,
          currency: payment.currency,
          reason: reason || 'requested_by_customer'
        }
      }
    } catch (error) {
      console.error('Error processing Stripe refund:', error)
      throw new Error('Refund processing failed')
    }
  }

  private async processPayPalRefund(payment: any, amount: number, reason?: string): Promise<any> {
    // Simulate PayPal refund API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      return {
        status: 'completed',
        transaction_id: `paypal_refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        provider_response: {
          refund_id: `${Math.random().toString(36).substr(2, 17).toUpperCase()}`,
          status: 'completed',
          amount: amount,
          currency: payment.currency,
          reason: reason || 'REFUND'
        }
      }
    } catch (error) {
      console.error('Error processing PayPal refund:', error)
      throw new Error('Refund processing failed')
    }
  }

  // ========== VENDOR PAYOUTS ==========

  private async processVendorPayouts(order: any): Promise<void> {
    try {
      // Group order items by vendor
      const vendorItems = new Map()
      
      for (const item of order.items) {
        const vendorId = item.product.vendor_id
        if (!vendorItems.has(vendorId)) {
          vendorItems.set(vendorId, [])
        }
        vendorItems.get(vendorId).push(item)
      }

      // Create payouts for each vendor
      for (const [vendorId, items] of vendorItems) {
        const vendorTotal = items.reduce((sum: number, item: any) => sum + item.total, 0)
        
        // Calculate commission (assume 15% platform fee)
        const platformFee = vendorTotal * 0.15
        const vendorPayout = vendorTotal - platformFee

        await supabase
          .from('vendor_payouts')
          .insert({
            vendor_id: vendorId,
            order_id: order.id,
            amount: vendorPayout,
            platform_fee: platformFee,
            currency: order.currency,
            status: 'pending',
            created_at: new Date().toISOString()
          })
      }
    } catch (error) {
      console.error('Error processing vendor payouts:', error)
    }
  }

  // ========== ANALYTICS ==========

  async getPaymentAnalytics(dateFrom: string, dateTo: string): Promise<any> {
    try {
      const { data: analytics, error } = await supabase.rpc('get_payment_analytics', {
        date_from: dateFrom,
        date_to: dateTo
      })

      if (error) {
        console.error('Error fetching payment analytics:', error)
        throw new Error('Failed to fetch payment analytics')
      }

      return analytics
    } catch (error) {
      console.error('Error in getPaymentAnalytics:', error)
      throw error
    }
  }
}

export const paymentService = new PaymentService()