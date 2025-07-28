import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@ecommerce/shared'
import type { PaymentInsert } from '@ecommerce/shared'

interface RefundRequest {
  paymentId: string
  amount?: number // Partial refund amount, if not provided, full refund
  reason: string
  userId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RefundRequest = await request.json()
    
    // Validate required fields
    if (!body.paymentId || !body.reason || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get original payment
    const { data: originalPayment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', body.paymentId)
      .eq('user_id', body.userId)
      .single()

    if (paymentError || !originalPayment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (originalPayment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only refund completed payments' },
        { status: 400 }
      )
    }

    // Calculate refund amount
    const refundAmount = body.amount || originalPayment.amount
    
    if (refundAmount > originalPayment.amount) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed original payment amount' },
        { status: 400 }
      )
    }

    // Create refund payment record
    const refundData: PaymentInsert = {
      order_id: originalPayment.order_id,
      user_id: originalPayment.user_id,
      payment_method_id: originalPayment.payment_method_id,
      amount: -refundAmount, // Negative amount for refund
      currency: originalPayment.currency,
      status: 'processing',
      parent_payment_id: originalPayment.id,
      provider_response: {
        type: 'refund',
        reason: body.reason,
        originalAmount: originalPayment.amount
      },
      metadata: {
        refund_reason: body.reason,
        original_payment_id: originalPayment.id
      }
    }

    const { data: refundPayment, error: refundError } = await supabase
      .from('payments')
      .insert(refundData)
      .select()
      .single()

    if (refundError) {
      throw new Error(`Failed to create refund: ${refundError.message}`)
    }

    // Process refund with payment provider (mock implementation)
    const refundResult = await processRefund(originalPayment, refundAmount, body.reason)

    // Update refund payment status
    const { data: updatedRefund, error: updateError } = await supabase
      .from('payments')
      .update({
        status: refundResult.status,
        transaction_id: refundResult.transactionId,
        provider_response: {
          ...refundData.provider_response,
          ...refundResult.response
        },
        processed_at: new Date().toISOString()
      })
      .eq('id', refundPayment.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update refund: ${updateError.message}`)
    }

    // Update original payment status if full refund
    if (refundAmount === originalPayment.amount && refundResult.status === 'completed') {
      await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', originalPayment.id)
        
      // Update order status
      await supabase
        .from('orders')
        .update({ 
          payment_status: 'refunded',
          status: 'cancelled'
        })
        .eq('id', originalPayment.order_id)
    } else if (refundResult.status === 'completed') {
      // Partial refund
      await supabase
        .from('payments')
        .update({ status: 'partially_refunded' })
        .eq('id', originalPayment.id)
    }

    return NextResponse.json({
      success: refundResult.status === 'completed',
      refund: updatedRefund,
      transactionId: refundResult.transactionId,
      message: refundResult.message,
      refundedAmount: refundAmount
    })

  } catch (error) {
    console.error('Refund processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Refund processing failed' },
      { status: 500 }
    )
  }
}

// Mock refund processing function
async function processRefund(originalPayment: any, refundAmount: number, reason: string) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Mock success rate based on provider
  const successRates = {
    stripe: 0.98,
    paypal: 0.95,
    bank: 0.90
  }
  
  const provider = originalPayment.provider_response?.provider || 'stripe'
  const success = Math.random() < (successRates[provider as keyof typeof successRates] || 0.95)
  
  return {
    status: success ? 'completed' : 'failed',
    transactionId: success ? `refund_${provider}_${Date.now()}` : null,
    response: {
      provider,
      refundAmount,
      reason,
      originalTransactionId: originalPayment.transaction_id,
      timestamp: new Date().toISOString(),
      success
    },
    message: success 
      ? `Refund of ${refundAmount} processed successfully` 
      : 'Refund processing failed - please contact support'
  }
}