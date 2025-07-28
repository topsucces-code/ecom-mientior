import { VendorCommission, VendorOrder, VendorProduct, Vendor, VendorPayout } from '@ecommerce/shared'

interface CommissionRule {
  id: string
  vendor_id?: string // If null, applies to all vendors
  product_category?: string
  commission_type: 'percentage' | 'flat_fee' | 'tiered'
  commission_rate: number
  min_amount?: number
  max_amount?: number
  tiered_rates?: {
    min_sales: number
    max_sales: number
    rate: number
  }[]
  effective_date: string
  expiry_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CommissionCalculationInput {
  vendor_id: string
  order_id: string
  product_id: string
  base_amount: number
  quantity: number
  product_category?: string
  vendor_performance_tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
}

interface CommissionCalculationResult {
  commission_amount: number
  commission_rate: number
  commission_type: 'percentage' | 'flat_fee' | 'tiered'
  base_amount: number
  net_payout: number
  breakdown: {
    base_commission: number
    performance_bonus?: number
    volume_discount?: number
    category_adjustment?: number
    fees?: {
      payment_processing: number
      platform_fee: number
      transaction_fee: number
    }
  }
  applied_rules: string[]
}

interface VendorPerformanceMetrics {
  vendor_id: string
  period: {
    start_date: string
    end_date: string
  }
  metrics: {
    total_sales: number
    total_orders: number
    average_order_value: number
    customer_rating: number
    return_rate: number
    cancellation_rate: number
    response_time_hours: number
    on_time_shipping_rate: number
  }
  performance_tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  commission_adjustments: {
    performance_bonus: number
    volume_discount: number
  }
}

export class CommissionService {
  private defaultCommissionRules: CommissionRule[] = [
    {
      id: 'default-percentage',
      commission_type: 'percentage',
      commission_rate: 0.15, // 15% default
      is_active: true,
      effective_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'electronics-special',
      product_category: 'Electronics',
      commission_type: 'percentage',
      commission_rate: 0.08, // 8% for electronics
      is_active: true,
      effective_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'fashion-premium',
      product_category: 'Clothing & Fashion',
      commission_type: 'percentage',
      commission_rate: 0.20, // 20% for fashion
      is_active: true,
      effective_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]

  private performanceTierBonuses = {
    bronze: 0, // No bonus
    silver: 0.01, // 1% bonus
    gold: 0.02, // 2% bonus
    platinum: 0.03, // 3% bonus
  }

  async calculateCommission(input: CommissionCalculationInput): Promise<CommissionCalculationResult> {
    try {
      // Find applicable commission rules
      const applicableRules = await this.findApplicableRules(input)
      
      // Get vendor performance metrics
      const performanceMetrics = await this.getVendorPerformance(input.vendor_id)
      
      // Calculate base commission
      const baseCommission = this.calculateBaseCommission(input, applicableRules)
      
      // Apply performance adjustments
      const performanceBonus = this.calculatePerformanceBonus(baseCommission.commission_amount, performanceMetrics)
      
      // Apply volume discounts
      const volumeDiscount = this.calculateVolumeDiscount(input.vendor_id, baseCommission.commission_amount)
      
      // Calculate platform fees
      const fees = this.calculatePlatformFees(input.base_amount)
      
      // Calculate final amounts
      const totalCommission = baseCommission.commission_amount + performanceBonus - volumeDiscount
      const totalFees = fees.payment_processing + fees.platform_fee + fees.transaction_fee
      const netPayout = input.base_amount - totalCommission - totalFees

      return {
        commission_amount: totalCommission,
        commission_rate: baseCommission.commission_rate,
        commission_type: baseCommission.commission_type,
        base_amount: input.base_amount,
        net_payout: Math.max(0, netPayout),
        breakdown: {
          base_commission: baseCommission.commission_amount,
          performance_bonus: performanceBonus,
          volume_discount: volumeDiscount,
          fees,
        },
        applied_rules: baseCommission.applied_rules,
      }
    } catch (error) {
      console.error('Error calculating commission:', error)
      throw error
    }
  }

  private async findApplicableRules(input: CommissionCalculationInput): Promise<CommissionRule[]> {
    // In a real implementation, this would query the database
    // For now, return mock rules based on the input
    const rules = this.defaultCommissionRules.filter(rule => {
      if (!rule.is_active) return false
      
      // Check vendor-specific rules
      if (rule.vendor_id && rule.vendor_id !== input.vendor_id) return false
      
      // Check product category rules
      if (rule.product_category && rule.product_category !== input.product_category) return false
      
      // Check amount thresholds
      if (rule.min_amount && input.base_amount < rule.min_amount) return false
      if (rule.max_amount && input.base_amount > rule.max_amount) return false
      
      // Check date validity
      const now = new Date()
      const effectiveDate = new Date(rule.effective_date)
      if (effectiveDate > now) return false
      
      if (rule.expiry_date) {
        const expiryDate = new Date(rule.expiry_date)
        if (expiryDate < now) return false
      }
      
      return true
    })

    return rules.length > 0 ? rules : [this.defaultCommissionRules[0]]
  }

  private calculateBaseCommission(input: CommissionCalculationInput, rules: CommissionRule[]): {
    commission_amount: number
    commission_rate: number
    commission_type: CommissionRule['commission_type']
    applied_rules: string[]
  } {
    // Use the most specific rule (vendor-specific > category-specific > default)
    const rule = rules.reduce((best, current) => {
      const bestSpecificity = (best.vendor_id ? 2 : 0) + (best.product_category ? 1 : 0)
      const currentSpecificity = (current.vendor_id ? 2 : 0) + (current.product_category ? 1 : 0)
      return currentSpecificity > bestSpecificity ? current : best
    })

    let commissionAmount = 0
    
    switch (rule.commission_type) {
      case 'percentage':
        commissionAmount = input.base_amount * rule.commission_rate
        break
        
      case 'flat_fee':
        commissionAmount = rule.commission_rate
        break
        
      case 'tiered':
        if (rule.tiered_rates) {
          const applicableTier = rule.tiered_rates.find(tier => 
            input.base_amount >= tier.min_sales && 
            (tier.max_sales === undefined || input.base_amount <= tier.max_sales)
          )
          commissionAmount = applicableTier ? input.base_amount * applicableTier.rate : input.base_amount * rule.commission_rate
        } else {
          commissionAmount = input.base_amount * rule.commission_rate
        }
        break
    }

    return {
      commission_amount: commissionAmount,
      commission_rate: rule.commission_rate,
      commission_type: rule.commission_type,
      applied_rules: [rule.id],
    }
  }

  private async getVendorPerformance(vendorId: string): Promise<VendorPerformanceMetrics> {
    // Mock performance data - in real implementation, this would come from database
    return {
      vendor_id: vendorId,
      period: {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString(),
      },
      metrics: {
        total_sales: 25000,
        total_orders: 150,
        average_order_value: 166.67,
        customer_rating: 4.5,
        return_rate: 0.05,
        cancellation_rate: 0.02,
        response_time_hours: 4,
        on_time_shipping_rate: 0.95,
      },
      performance_tier: 'gold',
      commission_adjustments: {
        performance_bonus: 0.02,
        volume_discount: 0.005,
      },
    }
  }

  private calculatePerformanceBonus(baseCommission: number, performance: VendorPerformanceMetrics): number {
    const bonusRate = this.performanceTierBonuses[performance.performance_tier]
    
    // Additional bonuses for exceptional performance
    let additionalBonus = 0
    
    if (performance.metrics.customer_rating >= 4.8) {
      additionalBonus += 0.005 // 0.5% bonus for excellent ratings
    }
    
    if (performance.metrics.on_time_shipping_rate >= 0.98) {
      additionalBonus += 0.005 // 0.5% bonus for excellent shipping
    }
    
    if (performance.metrics.return_rate <= 0.02) {
      additionalBonus += 0.003 // 0.3% bonus for low returns
    }

    return baseCommission * (bonusRate + additionalBonus)
  }

  private calculateVolumeDiscount(vendorId: string, commissionAmount: number): Promise<number> {
    // Volume-based commission discounts
    // Higher volume vendors get lower commission rates
    return Promise.resolve(0) // Placeholder for now
  }

  private calculatePlatformFees(baseAmount: number): {
    payment_processing: number
    platform_fee: number
    transaction_fee: number
  } {
    return {
      payment_processing: baseAmount * 0.029, // 2.9% payment processing
      platform_fee: Math.min(baseAmount * 0.01, 5), // 1% platform fee, max $5
      transaction_fee: 0.30, // $0.30 per transaction
    }
  }

  async createCommission(commissionData: Omit<VendorCommission, 'id' | 'created_at' | 'updated_at'>): Promise<VendorCommission> {
    const commission: VendorCommission = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ...commissionData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // In real implementation, save to database
    console.log('Created commission:', commission)
    
    return commission
  }

  async getVendorCommissions(vendorId: string, filters?: {
    status?: VendorCommission['status'][]
    date_range?: { start_date: string; end_date: string }
  }): Promise<VendorCommission[]> {
    // Mock data - in real implementation, query database
    return []
  }

  async calculateVendorPayout(vendorId: string, periodStart: string, periodEnd: string): Promise<{
    payout: VendorPayout
    commission_details: VendorCommission[]
    summary: {
      total_sales: number
      total_orders: number
      total_commission: number
      total_fees: number
      net_payout: number
    }
  }> {
    try {
      // Get all commissions for the period
      const commissions = await this.getVendorCommissions(vendorId, {
        date_range: { start_date: periodStart, end_date: periodEnd }
      })

      // Calculate totals
      const totalSales = commissions.reduce((sum, comm) => sum + comm.base_amount, 0)
      const totalCommission = commissions.reduce((sum, comm) => sum + comm.commission_amount, 0)
      const totalFees = totalSales * 0.039 // 3.9% total fees
      const netPayout = totalSales - totalCommission - totalFees

      const payout: VendorPayout = {
        id: `payout-${Date.now()}`,
        vendor_id: vendorId,
        payout_period_start: periodStart,
        payout_period_end: periodEnd,
        total_sales: totalSales,
        total_commission: totalCommission,
        net_payout: netPayout,
        orders_count: commissions.length,
        status: 'pending',
        payment_method: 'bank_transfer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      return {
        payout,
        commission_details: commissions,
        summary: {
          total_sales: totalSales,
          total_orders: commissions.length,
          total_commission: totalCommission,
          total_fees: totalFees,
          net_payout: netPayout,
        },
      }
    } catch (error) {
      console.error('Error calculating vendor payout:', error)
      throw error
    }
  }

  async getCommissionRules(vendorId?: string): Promise<CommissionRule[]> {
    // Filter rules by vendor if specified
    if (vendorId) {
      return this.defaultCommissionRules.filter(rule => 
        !rule.vendor_id || rule.vendor_id === vendorId
      )
    }
    return this.defaultCommissionRules
  }

  async createCommissionRule(ruleData: Omit<CommissionRule, 'id' | 'created_at' | 'updated_at'>): Promise<CommissionRule> {
    const rule: CommissionRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ...ruleData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // In real implementation, save to database
    console.log('Created commission rule:', rule)
    
    return rule
  }

  async updateCommissionRule(ruleId: string, updates: Partial<CommissionRule>): Promise<CommissionRule> {
    // In real implementation, update in database
    const rule = this.defaultCommissionRules.find(r => r.id === ruleId)
    if (!rule) {
      throw new Error('Commission rule not found')
    }

    const updatedRule = {
      ...rule,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    console.log('Updated commission rule:', updatedRule)
    return updatedRule
  }

  async getCommissionAnalytics(vendorId?: string, dateRange?: { start_date: string; end_date: string }): Promise<{
    total_commissions: number
    average_commission_rate: number
    top_performing_vendors: Array<{
      vendor_id: string
      total_commission: number
      commission_rate: number
      sales_volume: number
    }>
    commission_trends: Array<{
      date: string
      total_commission: number
      order_count: number
    }>
    category_breakdown: Array<{
      category: string
      commission_amount: number
      order_count: number
      average_rate: number
    }>
  }> {
    // Mock analytics data
    return {
      total_commissions: 45000,
      average_commission_rate: 0.135,
      top_performing_vendors: [
        {
          vendor_id: 'vendor-1',
          total_commission: 15000,
          commission_rate: 0.12,
          sales_volume: 125000,
        },
        {
          vendor_id: 'vendor-2',
          total_commission: 12000,
          commission_rate: 0.15,
          sales_volume: 80000,
        },
      ],
      commission_trends: [
        { date: '2024-01-01', total_commission: 5000, order_count: 150 },
        { date: '2024-01-02', total_commission: 5500, order_count: 165 },
      ],
      category_breakdown: [
        {
          category: 'Electronics',
          commission_amount: 18000,
          order_count: 200,
          average_rate: 0.08,
        },
        {
          category: 'Fashion',
          commission_amount: 15000,
          order_count: 120,
          average_rate: 0.20,
        },
      ],
    }
  }

  async processOrderCommission(vendorOrder: VendorOrder): Promise<VendorCommission[]> {
    const commissions: VendorCommission[] = []

    for (const item of vendorOrder.order_items) {
      const calculationInput: CommissionCalculationInput = {
        vendor_id: vendorOrder.vendor_id,
        order_id: vendorOrder.order_id,
        product_id: item.product_id,
        base_amount: item.total_price,
        quantity: item.quantity,
      }

      const calculation = await this.calculateCommission(calculationInput)
      
      const commission = await this.createCommission({
        vendor_id: vendorOrder.vendor_id,
        order_id: vendorOrder.order_id,
        product_id: item.product_id,
        commission_type: 'percentage',
        commission_rate: calculation.commission_rate,
        commission_amount: calculation.commission_amount,
        base_amount: calculation.base_amount,
        status: 'pending',
      })

      commissions.push(commission)
    }

    return commissions
  }

  async confirmCommissions(orderIds: string[]): Promise<void> {
    // Update commission status to confirmed when order is completed
    console.log('Confirming commissions for orders:', orderIds)
  }

  async disputeCommission(commissionId: string, reason: string): Promise<void> {
    // Handle commission disputes
    console.log('Commission dispute filed:', commissionId, reason)
  }
}

export const commissionService = new CommissionService()