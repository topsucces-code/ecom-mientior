import { NextRequest, NextResponse } from 'next/server'
import { supabase, functions } from '@ecommerce/shared'

interface TestResult {
  test: string
  status: 'success' | 'error'
  message: string
  data?: any
  error?: string
}

export async function GET(request: NextRequest) {
  const results: TestResult[] = []

  // Test 1: Database Connection
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('count(*)')
      .limit(1)

    results.push({
      test: 'Database Connection',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to connect to database' : 'Successfully connected to database',
      data: data,
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Database Connection',
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 2: Extended Types - Coupons Table
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .limit(1)

    results.push({
      test: 'Extended Types - Coupons',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to query coupons table' : 'Successfully queried coupons table',
      data: data?.length || 0,
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Extended Types - Coupons',
      status: 'error',
      message: 'Coupons table query failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 3: Extended Types - Payments Table
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .limit(1)

    results.push({
      test: 'Extended Types - Payments',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to query payments table' : 'Successfully queried payments table',
      data: data?.length || 0,
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Extended Types - Payments',
      status: 'error',
      message: 'Payments table query failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 4: Extended Types - Notifications Table
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .limit(1)

    results.push({
      test: 'Extended Types - Notifications',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to query notifications table' : 'Successfully queried notifications table',
      data: data?.length || 0,
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Extended Types - Notifications',
      status: 'error',
      message: 'Notifications table query failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 5: Search History Table
  try {
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .limit(1)

    results.push({
      test: 'Extended Types - Search History',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to query search_history table' : 'Successfully queried search_history table',
      data: data?.length || 0,
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Extended Types - Search History',
      status: 'error',
      message: 'Search history table query failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 6: Core Tables - Products
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    results.push({
      test: 'Core Tables - Products',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to query products table' : 'Successfully queried products table',
      data: data?.length || 0,
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Core Tables - Products',
      status: 'error',
      message: 'Products table query failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 7: Core Tables - Orders
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1)

    results.push({
      test: 'Core Tables - Orders',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to query orders table' : 'Successfully queried orders table',
      data: data?.length || 0,
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Core Tables - Orders',
      status: 'error',
      message: 'Orders table query failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 8: Inventory Tables
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .limit(1)

    results.push({
      test: 'Inventory Tables - Items',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to query inventory_items table' : 'Successfully queried inventory_items table',
      data: data?.length || 0,
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Inventory Tables - Items',
      status: 'error',
      message: 'Inventory items table query failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 9: Database Functions - Payment Analytics
  try {
    const { data, error } = await functions.getPaymentAnalytics(
      '2024-01-01',
      '2024-12-31'
    )

    results.push({
      test: 'Database Functions - Payment Analytics',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to call payment analytics function' : 'Successfully called payment analytics function',
      data: data,
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Database Functions - Payment Analytics',
      status: 'error',
      message: 'Payment analytics function failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 10: Database Functions - Inventory Metrics
  try {
    const { data, error } = await functions.getInventoryMetrics()

    results.push({
      test: 'Database Functions - Inventory Metrics',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to call inventory metrics function' : 'Successfully called inventory metrics function',
      data: data,
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Database Functions - Inventory Metrics',
      status: 'error',
      message: 'Inventory metrics function failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 11: Database Functions - Search Analytics
  try {
    const { data, error } = await functions.getSearchAnalytics(
      '2024-01-01',
      '2024-12-31'
    )

    results.push({
      test: 'Database Functions - Search Analytics',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to call search analytics function' : 'Successfully called search analytics function',
      data: data,
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Database Functions - Search Analytics',
      status: 'error',
      message: 'Search analytics function failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 12: Database Functions - Stock Alerts
  try {
    const { data, error } = await functions.checkStockAlerts()

    results.push({
      test: 'Database Functions - Stock Alerts',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to call stock alerts function' : 'Successfully called stock alerts function',
      data: data,
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Database Functions - Stock Alerts',
      status: 'error',
      message: 'Stock alerts function failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 13: Database Functions - Apply Coupon
  try {
    const { data, error } = await functions.applyCoupon(
      'TEST_COUPON',
      'test-user-id',
      100,
      [{ id: 'test-product', price: 50, quantity: 2, category: 'electronics' }]
    )

    results.push({
      test: 'Database Functions - Apply Coupon',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to call apply coupon function' : 'Successfully called apply coupon function',
      data: data,
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Database Functions - Apply Coupon',
      status: 'error',
      message: 'Apply coupon function failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 14: Database Functions - Personalized Recommendations
  try {
    const { data, error } = await functions.getPersonalizedRecommendations(
      'test-user-id',
      5
    )

    results.push({
      test: 'Database Functions - Personalized Recommendations',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to call personalized recommendations function' : 'Successfully called personalized recommendations function',
      data: data,
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Database Functions - Personalized Recommendations',
      status: 'error',
      message: 'Personalized recommendations function failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 15: Auth Functions
  try {
    const { data: session, error } = await supabase.auth.getSession()

    results.push({
      test: 'Authentication - Session Check',
      status: error ? 'error' : 'success',
      message: error ? 'Failed to check session' : 'Successfully checked session',
      data: session ? 'Session exists' : 'No active session',
      error: error?.message
    })
  } catch (error) {
    results.push({
      test: 'Authentication - Session Check',
      status: 'error',
      message: 'Session check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Calculate summary
  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length
  const totalTests = results.length

  const summary = {
    totalTests,
    successCount,
    errorCount,
    successRate: Math.round((successCount / totalTests) * 100),
    timestamp: new Date().toISOString()
  }

  // Return comprehensive test results
  return NextResponse.json({
    summary,
    results,
    recommendations: [
      ...(errorCount > 0 ? ['Some tests failed - check error messages for details'] : []),
      ...(successRate >= 80 ? ['Integration is working well'] : ['Multiple issues detected - review configuration']),
      'Run database migrations if any tables are missing',
      'Ensure RLS policies are properly configured',
      'Verify environment variables are set correctly'
    ]
  })
}

// POST endpoint for running specific tests
export async function POST(request: NextRequest) {
  try {
    const { testType } = await request.json()

    switch (testType) {
      case 'create_test_data':
        return await createTestData()
      case 'cleanup_test_data':
        return await cleanupTestData()
      default:
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test failed' },
      { status: 500 }
    )
  }
}

// Helper function to create test data
async function createTestData() {
  const results = []

  try {
    // Create test category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .insert({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test category for integration testing'
      })
      .select()
      .single()

    results.push({
      action: 'Create Test Category',
      status: categoryError ? 'error' : 'success',
      data: category,
      error: categoryError?.message
    })

    if (category) {
      // Create test product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: 'Test Product',
          description: 'Test product for integration testing',
          price: 99.99,
          sku: 'TEST-001',
          inventory_quantity: 100,
          category_id: category.id,
          status: 'active',
          featured: false,
          images: ['https://via.placeholder.com/300'],
          tags: ['test', 'integration']
        })
        .select()
        .single()

      results.push({
        action: 'Create Test Product',
        status: productError ? 'error' : 'success',
        data: product,
        error: productError?.message
      })
    }

    // Create test coupon
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .insert({
        code: 'TEST10',
        type: 'percentage',
        value: 10,
        description: 'Test coupon - 10% off',
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        usage_count: 0
      })
      .select()
      .single()

    results.push({
      action: 'Create Test Coupon',
      status: couponError ? 'error' : 'success',
      data: coupon,
      error: couponError?.message
    })

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      results
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to create test data',
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    }, { status: 500 })
  }
}

// Helper function to cleanup test data
async function cleanupTestData() {
  const results = []

  try {
    // Delete test products
    const { error: productError } = await supabase
      .from('products')
      .delete()
      .eq('sku', 'TEST-001')

    results.push({
      action: 'Delete Test Products',
      status: productError ? 'error' : 'success',
      error: productError?.message
    })

    // Delete test categories
    const { error: categoryError } = await supabase
      .from('categories')
      .delete()
      .eq('slug', 'test-category')

    results.push({
      action: 'Delete Test Categories',
      status: categoryError ? 'error' : 'success',
      error: categoryError?.message
    })

    // Delete test coupons
    const { error: couponError } = await supabase
      .from('coupons')
      .delete()
      .eq('code', 'TEST10')

    results.push({
      action: 'Delete Test Coupons',
      status: couponError ? 'error' : 'success',
      error: couponError?.message
    })

    return NextResponse.json({
      success: true,
      message: 'Test data cleaned up successfully',
      results
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to cleanup test data',
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    }, { status: 500 })
  }
}