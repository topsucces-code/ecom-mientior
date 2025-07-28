import { Product, Order, User, Review } from '@ecommerce/shared'

export interface PlatformMetrics {
  // Overview Metrics
  overview: {
    total_revenue: number
    total_orders: number
    total_users: number
    total_products: number
    total_vendors: number
    revenue_growth: number
    order_growth: number
    user_growth: number
  }
  
  // Sales Analytics
  sales: {
    daily_revenue: Array<{
      date: string
      revenue: number
      orders: number
      average_order_value: number
    }>
    revenue_by_category: Array<{
      category: string
      revenue: number
      percentage: number
      growth_rate: number
    }>
    top_selling_products: Array<{
      product_id: string
      product_name: string
      sales_count: number
      revenue: number
      category: string
    }>
    payment_methods: Array<{
      method: string
      usage_count: number
      percentage: number
      success_rate: number
    }>
  }
  
  // User Analytics
  users: {
    active_users: {
      daily: number
      weekly: number
      monthly: number
    }
    user_retention: {
      day_1: number
      day_7: number
      day_30: number
    }
    user_acquisition: Array<{
      source: string
      users: number
      percentage: number
      cost_per_acquisition: number
    }>
    demographics: {
      age_groups: Array<{
        range: string
        count: number
        percentage: number
      }>
      locations: Array<{
        country: string
        users: number
        percentage: number
      }>
    }
  }
  
  // Product Analytics
  products: {
    inventory_status: {
      in_stock: number
      low_stock: number
      out_of_stock: number
    }
    product_performance: Array<{
      product_id: string
      product_name: string
      views: number
      conversions: number
      conversion_rate: number
      revenue: number
    }>
    category_performance: Array<{
      category: string
      total_products: number
      total_sales: number
      average_rating: number
      return_rate: number
    }>
    search_analytics: Array<{
      query: string
      search_count: number
      result_clicks: number
      conversion_rate: number
    }>
  }
  
  // Vendor Analytics
  vendors: {
    total_vendors: number
    active_vendors: number
    top_performing_vendors: Array<{
      vendor_id: string
      vendor_name: string
      total_sales: number
      commission_earned: number
      rating: number
      products_count: number
    }>
    vendor_distribution: Array<{
      category: string
      vendor_count: number
      percentage: number
    }>
  }
  
  // Marketing Analytics
  marketing: {
    traffic_sources: Array<{
      source: string
      visitors: number
      percentage: number
      conversion_rate: number
    }>
    campaign_performance: Array<{
      campaign_id: string
      campaign_name: string
      impressions: number
      clicks: number
      conversions: number
      cost: number
      roi: number
    }>
    email_marketing: {
      total_sent: number
      open_rate: number
      click_rate: number
      conversion_rate: number
    }
  }
  
  // Financial Analytics
  financial: {
    revenue_breakdown: {
      product_sales: number
      shipping_fees: number
      service_fees: number
      commission_revenue: number
    }
    costs: {
      payment_processing: number
      hosting_infrastructure: number
      marketing_spend: number
      support_costs: number
    }
    profit_margins: {
      gross_margin: number
      net_margin: number
      contribution_margin: number
    }
  }
}

export interface RealtimeMetrics {
  current_visitors: number
  active_sessions: number
  live_orders: number
  real_time_revenue: number
  conversion_rate_today: number
  cart_abandonment_rate: number
  top_pages: Array<{
    page: string
    visitors: number
    bounce_rate: number
  }>
  recent_orders: Array<{
    order_id: string
    amount: number
    timestamp: string
    location: string
  }>
}

export interface AnalyticsFilters {
  date_range: {
    start_date: string
    end_date: string
  }
  categories?: string[]
  vendors?: string[]
  locations?: string[]
  user_segments?: string[]
  comparison_period?: 'previous_period' | 'previous_year' | 'none'
}

export class PlatformAnalyticsService {
  private mockData: PlatformMetrics = {
    overview: {
      total_revenue: 2_450_000,
      total_orders: 15_680,
      total_users: 45_230,
      total_products: 8_450,
      total_vendors: 234,
      revenue_growth: 0.23,
      order_growth: 0.18,
      user_growth: 0.31,
    },
    
    sales: {
      daily_revenue: [
        { date: '2024-03-01', revenue: 85000, orders: 420, average_order_value: 202.38 },
        { date: '2024-03-02', revenue: 92000, orders: 450, average_order_value: 204.44 },
        { date: '2024-03-03', revenue: 78000, orders: 380, average_order_value: 205.26 },
        { date: '2024-03-04', revenue: 95000, orders: 470, average_order_value: 202.13 },
        { date: '2024-03-05', revenue: 105000, orders: 520, average_order_value: 201.92 },
      ],
      revenue_by_category: [
        { category: 'Electronics', revenue: 850000, percentage: 34.7, growth_rate: 0.25 },
        { category: 'Fashion', revenue: 720000, percentage: 29.4, growth_rate: 0.18 },
        { category: 'Home & Garden', revenue: 480000, percentage: 19.6, growth_rate: 0.32 },
        { category: 'Sports & Outdoors', revenue: 280000, percentage: 11.4, growth_rate: 0.15 },
        { category: 'Books & Media', revenue: 120000, percentage: 4.9, growth_rate: -0.05 },
      ],
      top_selling_products: [
        { product_id: 'prod-1', product_name: 'Wireless Bluetooth Headphones', sales_count: 2450, revenue: 245000, category: 'Electronics' },
        { product_id: 'prod-2', product_name: 'Smart Fitness Watch', sales_count: 1890, revenue: 378000, category: 'Electronics' },
        { product_id: 'prod-3', product_name: 'Premium Coffee Maker', sales_count: 1650, revenue: 165000, category: 'Home & Garden' },
      ],
      payment_methods: [
        { method: 'Credit Card', usage_count: 9800, percentage: 62.5, success_rate: 0.98 },
        { method: 'PayPal', usage_count: 3920, percentage: 25.0, success_rate: 0.99 },
        { method: 'Apple Pay', usage_count: 1568, percentage: 10.0, success_rate: 0.99 },
        { method: 'Google Pay', usage_count: 392, percentage: 2.5, success_rate: 0.97 },
      ],
    },
    
    users: {
      active_users: {
        daily: 8500,
        weekly: 23400,
        monthly: 45230,
      },
      user_retention: {
        day_1: 0.85,
        day_7: 0.42,
        day_30: 0.28,
      },
      user_acquisition: [
        { source: 'Organic Search', users: 18500, percentage: 40.9, cost_per_acquisition: 0 },
        { source: 'Social Media', users: 12300, percentage: 27.2, cost_per_acquisition: 15.50 },
        { source: 'Email Marketing', users: 6800, percentage: 15.0, cost_per_acquisition: 8.25 },
        { source: 'Paid Ads', users: 5200, percentage: 11.5, cost_per_acquisition: 28.75 },
        { source: 'Referrals', users: 2430, percentage: 5.4, cost_per_acquisition: 5.00 },
      ],
      demographics: {
        age_groups: [
          { range: '18-24', count: 9046, percentage: 20.0 },
          { range: '25-34', count: 15842, percentage: 35.0 },
          { range: '35-44', count: 11308, percentage: 25.0 },
          { range: '45-54', count: 6784, percentage: 15.0 },
          { range: '55+', count: 2250, percentage: 5.0 },
        ],
        locations: [
          { country: 'United States', users: 22615, percentage: 50.0 },
          { country: 'Canada', users: 6784, percentage: 15.0 },
          { country: 'United Kingdom', users: 4523, percentage: 10.0 },
          { country: 'Australia', users: 3615, percentage: 8.0 },
          { country: 'Germany', users: 2708, percentage: 6.0 },
        ],
      },
    },
    
    products: {
      inventory_status: {
        in_stock: 7200,
        low_stock: 950,
        out_of_stock: 300,
      },
      product_performance: [
        { product_id: 'prod-1', product_name: 'Wireless Headphones', views: 25000, conversions: 1250, conversion_rate: 0.05, revenue: 125000 },
        { product_id: 'prod-2', product_name: 'Smart Watch', views: 18000, conversions: 900, conversion_rate: 0.05, revenue: 180000 },
        { product_id: 'prod-3', product_name: 'Coffee Maker', views: 12000, conversions: 480, conversion_rate: 0.04, revenue: 48000 },
      ],
      category_performance: [
        { category: 'Electronics', total_products: 2850, total_sales: 12500, average_rating: 4.3, return_rate: 0.08 },
        { category: 'Fashion', total_products: 3200, total_sales: 9800, average_rating: 4.1, return_rate: 0.12 },
        { category: 'Home & Garden', total_products: 1800, total_sales: 6200, average_rating: 4.4, return_rate: 0.05 },
      ],
      search_analytics: [
        { query: 'wireless headphones', search_count: 8500, result_clicks: 3400, conversion_rate: 0.06 },
        { query: 'smart watch', search_count: 6200, result_clicks: 2480, conversion_rate: 0.08 },
        { query: 'coffee maker', search_count: 4800, result_clicks: 1920, conversion_rate: 0.05 },
      ],
    },
    
    vendors: {
      total_vendors: 234,
      active_vendors: 198,
      top_performing_vendors: [
        { vendor_id: 'vendor-1', vendor_name: 'TechMaster Electronics', total_sales: 450000, commission_earned: 45000, rating: 4.8, products_count: 120 },
        { vendor_id: 'vendor-2', vendor_name: 'Fashion Forward', total_sales: 380000, commission_earned: 76000, rating: 4.6, products_count: 85 },
        { vendor_id: 'vendor-3', vendor_name: 'Home Essentials', total_sales: 320000, commission_earned: 48000, rating: 4.7, products_count: 95 },
      ],
      vendor_distribution: [
        { category: 'Electronics', vendor_count: 65, percentage: 27.8 },
        { category: 'Fashion', vendor_count: 58, percentage: 24.8 },
        { category: 'Home & Garden', vendor_count: 42, percentage: 17.9 },
        { category: 'Sports', vendor_count: 35, percentage: 15.0 },
        { category: 'Other', vendor_count: 34, percentage: 14.5 },
      ],
    },
    
    marketing: {
      traffic_sources: [
        { source: 'Organic Search', visitors: 125000, percentage: 45.5, conversion_rate: 0.035 },
        { source: 'Direct Traffic', visitors: 68000, percentage: 24.7, conversion_rate: 0.045 },
        { source: 'Social Media', visitors: 42000, percentage: 15.3, conversion_rate: 0.025 },
        { source: 'Email Marketing', visitors: 25000, percentage: 9.1, conversion_rate: 0.065 },
        { source: 'Paid Advertising', visitors: 15000, percentage: 5.4, conversion_rate: 0.055 },
      ],
      campaign_performance: [
        { campaign_id: 'camp-1', campaign_name: 'Spring Sale 2024', impressions: 500000, clicks: 25000, conversions: 1250, cost: 15000, roi: 3.2 },
        { campaign_id: 'camp-2', campaign_name: 'Electronics Promotion', impressions: 300000, clicks: 18000, conversions: 900, cost: 12000, roi: 2.8 },
      ],
      email_marketing: {
        total_sent: 250000,
        open_rate: 0.24,
        click_rate: 0.08,
        conversion_rate: 0.035,
      },
    },
    
    financial: {
      revenue_breakdown: {
        product_sales: 2200000,
        shipping_fees: 150000,
        service_fees: 75000,
        commission_revenue: 25000,
      },
      costs: {
        payment_processing: 70000,
        hosting_infrastructure: 25000,
        marketing_spend: 180000,
        support_costs: 45000,
      },
      profit_margins: {
        gross_margin: 0.35,
        net_margin: 0.18,
        contribution_margin: 0.42,
      },
    },
  }

  async getPlatformMetrics(filters: AnalyticsFilters): Promise<PlatformMetrics> {
    // In a real implementation, this would query the database with filters
    console.log('Fetching platform metrics with filters:', filters)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return this.mockData
  }

  async getRealtimeMetrics(): Promise<RealtimeMetrics> {
    return {
      current_visitors: 1250,
      active_sessions: 890,
      live_orders: 23,
      real_time_revenue: 4750,
      conversion_rate_today: 0.042,
      cart_abandonment_rate: 0.68,
      top_pages: [
        { page: '/products/electronics', visitors: 450, bounce_rate: 0.32 },
        { page: '/home', visitors: 380, bounce_rate: 0.28 },
        { page: '/products/fashion', visitors: 320, bounce_rate: 0.35 },
      ],
      recent_orders: [
        { order_id: 'order-1', amount: 249.99, timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), location: 'New York, US' },
        { order_id: 'order-2', amount: 89.50, timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), location: 'Toronto, CA' },
        { order_id: 'order-3', amount: 156.75, timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(), location: 'London, UK' },
      ],
    }
  }

  async getCustomReport(config: {
    metrics: string[]
    dimensions: string[]
    filters: AnalyticsFilters
    visualization: 'table' | 'chart' | 'graph'
  }): Promise<{
    report_id: string
    data: any[]
    summary: any
    generated_at: string
  }> {
    const reportId = `report-${Date.now()}`
    
    // Mock custom report data
    return {
      report_id: reportId,
      data: [
        { metric: 'Revenue', value: 245000, change: 0.15 },
        { metric: 'Orders', value: 1250, change: 0.08 },
        { metric: 'Conversion Rate', value: 0.042, change: 0.03 },
      ],
      summary: {
        total_revenue: 245000,
        total_orders: 1250,
        period: '30 days',
      },
      generated_at: new Date().toISOString(),
    }
  }

  async exportAnalyticsData(format: 'csv' | 'excel' | 'pdf', filters: AnalyticsFilters): Promise<{
    download_url: string
    expires_at: string
  }> {
    // Mock export functionality
    return {
      download_url: `/api/analytics/export/${Date.now()}.${format}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  async getPerformanceInsights(): Promise<{
    insights: Array<{
      type: 'opportunity' | 'warning' | 'success'
      title: string
      description: string
      impact: 'high' | 'medium' | 'low'
      recommendation: string
    }>
    forecasts: Array<{
      metric: string
      current_value: number
      predicted_value: number
      confidence: number
      timeframe: string
    }>
  }> {
    return {
      insights: [
        {
          type: 'opportunity',
          title: 'Mobile Conversion Rate Optimization',
          description: 'Mobile users have 25% lower conversion rate than desktop users',
          impact: 'high',
          recommendation: 'Optimize mobile checkout flow and improve page load speed',
        },
        {
          type: 'warning',
          title: 'Cart Abandonment Rate Increasing',
          description: 'Cart abandonment rate has increased by 8% in the last 30 days',
          impact: 'medium',
          recommendation: 'Implement abandoned cart email campaigns and simplify checkout process',
        },
        {
          type: 'success',
          title: 'Email Marketing Performance',
          description: 'Email conversion rate is 85% above industry average',
          impact: 'high',
          recommendation: 'Increase email marketing budget and expand to new segments',
        },
      ],
      forecasts: [
        {
          metric: 'Monthly Revenue',
          current_value: 2450000,
          predicted_value: 2940000,
          confidence: 0.78,
          timeframe: 'Next 3 months',
        },
        {
          metric: 'New Users',
          current_value: 45230,
          predicted_value: 54276,
          confidence: 0.82,
          timeframe: 'Next 3 months',
        },
      ],
    }
  }

  // Real-time updates simulation
  subscribeToRealtimeUpdates(callback: (metrics: RealtimeMetrics) => void): () => void {
    const interval = setInterval(async () => {
      const metrics = await this.getRealtimeMetrics()
      callback(metrics)
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }
}

export const platformAnalyticsService = new PlatformAnalyticsService()