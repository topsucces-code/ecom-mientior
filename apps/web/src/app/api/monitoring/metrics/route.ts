import { NextRequest, NextResponse } from 'next/server'
import { supabase, functions } from '@ecommerce/shared'

interface Metrics {
  timestamp: string
  timeframe: string
  business: {
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    conversionRate: number
    activeUsers: number
    newCustomers: number
  }
  inventory: {
    totalProducts: number
    lowStockItems: number
    outOfStockItems: number
    totalValue: number
    turnoverRate: number
  }
  performance: {
    averageResponseTime: number
    errorRate: number
    uptime: number
    databaseConnections: number
  }
  analytics: {
    topSellingProducts: any[]
    popularCategories: any[]
    searchQueries: any[]
    userSessions: number
  }
  alerts: any[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '24h'
    const includeAlerts = searchParams.get('alerts') !== 'false'

    // Calculate date range based on timeframe
    const { startDate, endDate } = getDateRange(timeframe)

    const metrics: Metrics = {
      timestamp: new Date().toISOString(),
      timeframe,
      business: await getBusinessMetrics(startDate, endDate),
      inventory: await getInventoryMetrics(),
      performance: await getPerformanceMetrics(),
      analytics: await getAnalyticsMetrics(startDate, endDate),
      alerts: includeAlerts ? await getAlerts() : []
    }

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Metrics error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get metrics' },
      { status: 500 }
    )
  }
}

function getDateRange(timeframe: string) {
  const now = new Date()
  let startDate: Date

  switch (timeframe) {
    case '1h':
      startDate = new Date(now.getTime() - 60 * 60 * 1000)
      break
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }

  return {
    startDate: startDate.toISOString(),
    endDate: now.toISOString()
  }
}

async function getBusinessMetrics(startDate: string, endDate: string) {
  try {
    // Get orders data
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (ordersError) throw ordersError

    // Get payment data
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Calculate metrics
    const totalOrders = orders?.length || 0
    const totalRevenue = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get user sessions for conversion rate
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .gte('started_at', startDate)
      .lte('started_at', endDate)

    const totalSessions = sessions?.length || 1
    const conversionRate = (totalOrders / totalSessions) * 100

    // Get new customers
    const { data: newUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const newCustomers = newUsers?.length || 0

    // Get active users (users with recent activity)
    const { data: interactions, error: interactionsError } = await supabase
      .from('user_interactions')
      .select('user_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const activeUsers = new Set(interactions?.map(i => i.user_id)).size

    return {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      activeUsers,
      newCustomers
    }
  } catch (error) {
    console.error('Business metrics error:', error)
    return {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      activeUsers: 0,
      newCustomers: 0
    }
  }
}

async function getInventoryMetrics() {
  try {
    const { data: inventoryData, error } = await functions.getInventoryMetrics()

    if (error) throw error

    const result = inventoryData?.[0]
    return {
      totalProducts: Number(result?.total_items || 0),
      lowStockItems: Number(result?.low_stock_items || 0),
      outOfStockItems: Number(result?.out_of_stock_items || 0),
      totalValue: Number(result?.total_value || 0),
      turnoverRate: Number(result?.turnover_rate || 0)
    }
  } catch (error) {
    console.error('Inventory metrics error:', error)
    return {
      totalProducts: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalValue: 0,
      turnoverRate: 0
    }
  }
}

async function getPerformanceMetrics() {
  try {
    // Mock performance data (in real app, this would come from monitoring tools)
    const startTime = Date.now()
    
    // Test database response time
    await supabase.from('categories').select('*').limit(1)
    const dbResponseTime = Date.now() - startTime

    // Calculate uptime (mock data)
    const uptime = process.uptime()
    const uptimePercentage = Math.min(99.9, (uptime / (24 * 60 * 60)) * 100)

    return {
      averageResponseTime: dbResponseTime,
      errorRate: Math.random() * 2, // Mock error rate 0-2%
      uptime: Math.round(uptimePercentage * 100) / 100,
      databaseConnections: Math.floor(Math.random() * 50) + 10 // Mock connection count
    }
  } catch (error) {
    console.error('Performance metrics error:', error)
    return {
      averageResponseTime: 0,
      errorRate: 0,
      uptime: 0,
      databaseConnections: 0
    }
  }
}

async function getAnalyticsMetrics(startDate: string, endDate: string) {
  try {
    // Get top selling products
    const { data: productInteractions, error: productError } = await supabase
      .from('user_interactions')
      .select(`
        product_id,
        products!inner(name, price, images)
      `)
      .eq('interaction_type', 'purchase')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const productCounts = {}
    productInteractions?.forEach(interaction => {
      const productId = interaction.product_id
      productCounts[productId] = (productCounts[productId] || 0) + 1
    })

    const topSellingProducts = Object.entries(productCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([productId, count]) => {
        const product = productInteractions?.find(p => p.product_id === productId)?.products
        return {
          productId,
          name: product?.name || 'Unknown',
          sales: count,
          revenue: (count as number) * (product?.price || 0)
        }
      })

    // Get popular categories
    const { data: categoryData, error: categoryError } = await supabase
      .from('products')
      .select(`
        category_id,
        categories!inner(name),
        user_interactions!inner(interaction_type)
      `)
      .eq('user_interactions.interaction_type', 'view')
      .gte('user_interactions.created_at', startDate)
      .lte('user_interactions.created_at', endDate)

    const categoryCounts = {}
    categoryData?.forEach(item => {
      const categoryName = item.categories?.name
      if (categoryName) {
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1
      }
    })

    const popularCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([name, views]) => ({ name, views }))

    // Get top search queries
    const { data: searchData, error: searchError } = await supabase
      .from('search_history')
      .select('query')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const queryCounts = {}
    searchData?.forEach(search => {
      const query = search.query.toLowerCase()
      queryCounts[query] = (queryCounts[query] || 0) + 1
    })

    const searchQueries = Object.entries(queryCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }))

    // Get user sessions count
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('id')
      .gte('started_at', startDate)
      .lte('started_at', endDate)

    const userSessions = sessions?.length || 0

    return {
      topSellingProducts,
      popularCategories,
      searchQueries,
      userSessions
    }
  } catch (error) {
    console.error('Analytics metrics error:', error)
    return {
      topSellingProducts: [],
      popularCategories: [],
      searchQueries: [],
      userSessions: 0
    }
  }
}

async function getAlerts() {
  try {
    // Get stock alerts
    const { data: stockAlerts, error: stockError } = await functions.checkStockAlerts()

    if (stockError) throw stockError

    // Get recent errors from logs (mock data)
    const systemAlerts = [
      {
        id: 'sys_' + Date.now(),
        type: 'system',
        severity: 'medium',
        message: 'High memory usage detected',
        timestamp: new Date().toISOString(),
        resolved: false
      }
    ]

    // Get payment failures
    const { data: failedPayments, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(5)

    const paymentAlerts = failedPayments?.map(payment => ({
      id: 'payment_' + payment.id,
      type: 'payment',
      severity: 'high',
      message: `Payment failed for order ${payment.order_id}`,
      timestamp: payment.created_at,
      resolved: false,
      metadata: { paymentId: payment.id, orderId: payment.order_id }
    })) || []

    const allAlerts = [
      ...(stockAlerts || []).map(alert => ({
        id: alert.alert_id,
        type: 'inventory',
        severity: alert.severity,
        message: `${alert.alert_type} for ${alert.product_name}`,
        timestamp: new Date().toISOString(),
        resolved: false,
        metadata: { 
          productName: alert.product_name,
          currentStock: alert.current_stock,
          threshold: alert.threshold
        }
      })),
      ...systemAlerts,
      ...paymentAlerts
    ]

    return allAlerts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 10)

  } catch (error) {
    console.error('Alerts error:', error)
    return []
  }
}

// POST endpoint for custom metrics queries
export async function POST(request: NextRequest) {
  try {
    const { query, params } = await request.json()

    switch (query) {
      case 'revenue_by_period':
        return await getRevenuByPeriod(params)
      case 'user_growth':
        return await getUserGrowth(params)
      case 'product_performance':
        return await getProductPerformance(params)
      default:
        return NextResponse.json({ error: 'Unknown query type' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}

async function getRevenuByPeriod(params: any) {
  const { period = 'daily', days = 30 } = params
  
  // Implementation for revenue by period analysis
  const data = [] // Mock data - implement actual query
  
  return NextResponse.json({ data })
}

async function getUserGrowth(params: any) {
  const { period = 'daily', days = 30 } = params
  
  // Implementation for user growth analysis
  const data = [] // Mock data - implement actual query
  
  return NextResponse.json({ data })
}

async function getProductPerformance(params: any) {
  const { productId, period = '30d' } = params
  
  // Implementation for product performance analysis
  const data = {} // Mock data - implement actual query
  
  return NextResponse.json({ data })
}