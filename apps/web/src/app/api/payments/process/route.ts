import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@ecommerce/shared'
import type { PaymentInsert, OrderInsert } from '@ecommerce/shared'

interface PaymentRequest {
  orderId: string
  paymentMethodId: string
  amount: number
  currency: string
  userId: string
  provider: 'stripe' | 'paypal' | 'bank'
  paymentIntentId?: string
  metadata?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json()
    
    // Validate required fields
    if (!body.orderId || !body.paymentMethodId || !body.amount || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create payment record
    const paymentData: PaymentInsert = {
      order_id: body.orderId,
      user_id: body.userId,
      payment_method_id: body.paymentMethodId,
      amount: body.amount,
      currency: body.currency || 'USD',
      status: 'processing',
      payment_intent_id: body.paymentIntentId,
      provider_response: {},
      metadata: body.metadata
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single()

    if (paymentError) {
      throw new Error(`Failed to create payment: ${paymentError.message}`)
    }

    // Process payment based on provider
    let paymentResult
    switch (body.provider) {
      case 'stripe':
        paymentResult = await processStripePayment(body, payment.id)
        break
      case 'paypal':
        paymentResult = await processPayPalPayment(body, payment.id)
        break
      case 'bank':
        paymentResult = await processBankPayment(body, payment.id)
        break
      default:
        throw new Error('Unsupported payment provider')
    }

    // Update payment status
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: paymentResult.status,
        transaction_id: paymentResult.transactionId,
        provider_response: paymentResult.response,
        processed_at: new Date().toISOString()
      })
      .eq('id', payment.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update payment: ${updateError.message}`)
    }

    // Update order status if payment successful
    if (paymentResult.status === 'completed') {
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing'
        })
        .eq('id', body.orderId)
    }

    return NextResponse.json({
      success: paymentResult.status === 'completed',
      payment: updatedPayment,
      transactionId: paymentResult.transactionId,
      message: paymentResult.message
    })

  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment processing failed' },
      { status: 500 }
    )
  }
}

// Stripe payment processing
async function processStripePayment(paymentData: PaymentRequest, paymentId: string) {
  // In a real implementation, you would integrate with Stripe SDK
  // This is a mock implementation
  await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate processing time
  
  const success = Math.random() > 0.1 // 90% success rate for demo
  
  return {
    status: success ? 'completed' : 'failed',
    transactionId: success ? `stripe_${Date.now()}` : null,
    response: {
      provider: 'stripe',
      paymentIntentId: paymentData.paymentIntentId,
      timestamp: new Date().toISOString(),
      success
    },
    message: success ? 'Payment processed successfully' : 'Payment failed - insufficient funds'
  }
}

// PayPal payment processing
async function processPayPalPayment(paymentData: PaymentRequest, paymentId: string) {
  // Mock PayPal implementation
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const success = Math.random() > 0.05 // 95% success rate for demo
  
  return {
    status: success ? 'completed' : 'failed',
    transactionId: success ? `paypal_${Date.now()}` : null,
    response: {
      provider: 'paypal',
      orderId: paymentData.orderId,
      timestamp: new Date().toISOString(),
      success
    },
    message: success ? 'PayPal payment completed' : 'PayPal payment failed'
  }
}

// Bank transfer processing
async function processBankPayment(paymentData: PaymentRequest, paymentId: string) {
  // Mock bank transfer implementation
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  const success = Math.random() > 0.15 // 85% success rate for demo
  
  return {
    status: success ? 'completed' : 'failed',
    transactionId: success ? `bank_${Date.now()}` : null,
    response: {
      provider: 'bank',
      accountNumber: 'xxxx-1234',
      timestamp: new Date().toISOString(),
      success
    },
    message: success ? 'Bank transfer initiated' : 'Bank transfer failed'
  }
}