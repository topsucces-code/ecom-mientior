import { InventoryItem, PurchaseOrder, StockAlert, Supplier } from '@ecommerce/shared'

interface ReorderRule {
  id: string
  inventory_item_id: string
  supplier_id: string
  reorder_point: number
  reorder_quantity: number
  max_stock_level: number
  lead_time_days: number
  is_active: boolean
  auto_reorder_enabled: boolean
  preferred_supplier_id?: string
  backup_supplier_ids?: string[]
  reorder_schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    day_of_week?: number // 0-6 for weekly
    day_of_month?: number // 1-31 for monthly
  }
  cost_constraints?: {
    max_unit_cost?: number
    budget_limit?: number
  }
  created_at: string
  updated_at: string
}

interface ReorderRecommendation {
  inventory_item: InventoryItem
  supplier: Supplier
  recommended_quantity: number
  estimated_cost: number
  urgency: 'low' | 'medium' | 'high' | 'critical'
  reason: string
  lead_time_days: number
  expected_delivery_date: string
}

interface AutoReorderConfig {
  enabled: boolean
  default_reorder_rules: {
    low_stock_threshold: number
    reorder_multiplier: number
    max_stock_multiplier: number
  }
  approval_required: boolean
  budget_limits: {
    daily_limit: number
    weekly_limit: number
    monthly_limit: number
  }
  notification_settings: {
    email_notifications: boolean
    slack_notifications: boolean
    dashboard_alerts: boolean
  }
}

export class AutoReorderService {
  private config: AutoReorderConfig = {
    enabled: true,
    default_reorder_rules: {
      low_stock_threshold: 0.2, // 20% of max stock
      reorder_multiplier: 2, // Order 2x the reorder point
      max_stock_multiplier: 3, // Max stock is 3x the reorder point
    },
    approval_required: true,
    budget_limits: {
      daily_limit: 10000,
      weekly_limit: 50000,
      monthly_limit: 200000,
    },
    notification_settings: {
      email_notifications: true,
      slack_notifications: false,
      dashboard_alerts: true,
    },
  }

  async analyzeInventoryForReorder(inventoryItems: InventoryItem[]): Promise<ReorderRecommendation[]> {
    const recommendations: ReorderRecommendation[] = []

    for (const item of inventoryItems) {
      const recommendation = await this.evaluateItemForReorder(item)
      if (recommendation) {
        recommendations.push(recommendation)
      }
    }

    // Sort by urgency and cost
    return recommendations.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
      if (urgencyDiff !== 0) return urgencyDiff
      return a.estimated_cost - b.estimated_cost
    })
  }

  private async evaluateItemForReorder(item: InventoryItem): Promise<ReorderRecommendation | null> {
    // Check if item needs reordering
    const needsReorder = this.checkIfNeedsReorder(item)
    if (!needsReorder.required) {
      return null
    }

    // Find best supplier
    const supplier = await this.findBestSupplier(item)
    if (!supplier) {
      return null
    }

    // Calculate recommended quantity
    const recommendedQuantity = this.calculateReorderQuantity(item)

    // Estimate cost
    const estimatedCost = recommendedQuantity * item.unit_cost

    // Calculate lead time and delivery date
    const leadTimeDays = supplier.lead_time_days || 7
    const expectedDeliveryDate = new Date(Date.now() + leadTimeDays * 24 * 60 * 60 * 1000).toISOString()

    return {
      inventory_item: item,
      supplier,
      recommended_quantity: recommendedQuantity,
      estimated_cost: estimatedCost,
      urgency: needsReorder.urgency,
      reason: needsReorder.reason,
      lead_time_days: leadTimeDays,
      expected_delivery_date: expectedDeliveryDate,
    }
  }

  private checkIfNeedsReorder(item: InventoryItem): { required: boolean; urgency: ReorderRecommendation['urgency']; reason: string } {
    const totalAvailable = item.quantity_available + item.quantity_incoming
    const reorderPoint = item.reorder_point || (item.max_stock_level || 100) * this.config.default_reorder_rules.low_stock_threshold

    // Critical: Out of stock
    if (item.quantity_available <= 0) {
      return {
        required: true,
        urgency: 'critical',
        reason: 'Out of stock - immediate reorder required'
      }
    }

    // High: Below reorder point
    if (totalAvailable <= reorderPoint) {
      return {
        required: true,
        urgency: 'high',
        reason: `Below reorder point (${reorderPoint})`
      }
    }

    // Medium: Low stock trend (predictive reordering)
    const lowStockThreshold = reorderPoint * 1.5
    if (totalAvailable <= lowStockThreshold) {
      return {
        required: true,
        urgency: 'medium',
        reason: `Approaching reorder point - preventive reorder`
      }
    }

    // Check for expiring items that need replacement
    if (item.expiration_date) {
      const expirationDate = new Date(item.expiration_date)
      const daysUntilExpiration = (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      
      if (daysUntilExpiration <= 30) {
        return {
          required: true,
          urgency: 'medium',
          reason: `Items expiring in ${Math.round(daysUntilExpiration)} days`
        }
      }
    }

    return { required: false, urgency: 'low', reason: '' }
  }

  private async findBestSupplier(item: InventoryItem): Promise<Supplier | null> {
    // In a real implementation, this would query the database
    // For now, we'll return a mock supplier
    return {
      id: 'supplier-1',
      name: 'Default Supplier',
      code: 'SUP001',
      contact: { email: 'supplier@example.com' },
      address: {
        street: '123 Supplier St',
        city: 'Supply City',
        state: 'SC',
        postal_code: '12345',
        country: 'US'
      },
      payment_terms: 'Net 30',
      lead_time_days: 7,
      minimum_order_amount: 100,
      is_active: true,
      rating: 4.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  private calculateReorderQuantity(item: InventoryItem): number {
    const reorderPoint = item.reorder_point || (item.max_stock_level || 100) * this.config.default_reorder_rules.low_stock_threshold
    const maxStock = item.max_stock_level || reorderPoint * this.config.default_reorder_rules.max_stock_multiplier
    
    // Calculate based on demand and safety stock
    const safetyStock = Math.ceil(reorderPoint * 0.5)
    const demandDuringLeadTime = Math.ceil(reorderPoint * 0.3) // Estimated demand
    
    // Reorder quantity = (Max stock - Current available) or minimum economic order quantity
    const targetQuantity = Math.max(
      maxStock - item.quantity_available,
      reorderPoint * this.config.default_reorder_rules.reorder_multiplier,
      safetyStock + demandDuringLeadTime
    )

    return Math.ceil(targetQuantity)
  }

  async createAutomaticPurchaseOrder(recommendation: ReorderRecommendation): Promise<PurchaseOrder> {
    const orderNumber = `AUTO-PO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    
    const items = [{
      inventory_item_id: recommendation.inventory_item.id,
      sku: recommendation.inventory_item.sku,
      quantity: recommendation.recommended_quantity,
      unit_cost: recommendation.inventory_item.unit_cost,
      total: recommendation.estimated_cost,
    }]

    const subtotal = recommendation.estimated_cost
    const taxAmount = subtotal * 0.1 // 10% tax
    const shippingCost = subtotal > 1000 ? 0 : 50 // Free shipping over $1000
    const totalAmount = subtotal + taxAmount + shippingCost

    const purchaseOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      supplier_id: recommendation.supplier.id,
      order_number: orderNumber,
      status: this.config.approval_required ? 'draft' : 'sent',
      items,
      subtotal,
      tax_amount: taxAmount,
      shipping_cost: shippingCost,
      total_amount: totalAmount,
      expected_delivery_date: recommendation.expected_delivery_date,
      notes: `Automatic reorder - ${recommendation.reason}`,
      created_by: 'auto-reorder-system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return purchaseOrder
  }

  async generateReorderReport(recommendations: ReorderRecommendation[]): Promise<{
    summary: {
      total_items: number
      total_cost: number
      critical_items: number
      high_priority_items: number
    }
    by_supplier: Record<string, {
      supplier_name: string
      item_count: number
      total_cost: number
      items: ReorderRecommendation[]
    }>
    budget_analysis: {
      daily_spending: number
      weekly_spending: number
      monthly_spending: number
      within_budget: boolean
    }
  }> {
    const summary = {
      total_items: recommendations.length,
      total_cost: recommendations.reduce((sum, rec) => sum + rec.estimated_cost, 0),
      critical_items: recommendations.filter(rec => rec.urgency === 'critical').length,
      high_priority_items: recommendations.filter(rec => rec.urgency === 'high').length,
    }

    const bySupplier: Record<string, any> = {}
    recommendations.forEach(rec => {
      const supplierId = rec.supplier.id
      if (!bySupplier[supplierId]) {
        bySupplier[supplierId] = {
          supplier_name: rec.supplier.name,
          item_count: 0,
          total_cost: 0,
          items: [],
        }
      }
      bySupplier[supplierId].item_count++
      bySupplier[supplierId].total_cost += rec.estimated_cost
      bySupplier[supplierId].items.push(rec)
    })

    const budgetAnalysis = {
      daily_spending: summary.total_cost,
      weekly_spending: summary.total_cost, // This would be calculated from recent orders
      monthly_spending: summary.total_cost, // This would be calculated from recent orders
      within_budget: summary.total_cost <= this.config.budget_limits.daily_limit,
    }

    return {
      summary,
      by_supplier: bySupplier,
      budget_analysis: budgetAnalysis,
    }
  }

  async processAutomaticReorders(inventoryItems: InventoryItem[]): Promise<{
    recommendations: ReorderRecommendation[]
    created_orders: PurchaseOrder[]
    errors: string[]
  }> {
    const errors: string[] = []
    const createdOrders: PurchaseOrder[] = []

    try {
      // Get reorder recommendations
      const recommendations = await this.analyzeInventoryForReorder(inventoryItems)

      // Filter by budget constraints
      const affordableRecommendations = this.filterByBudget(recommendations)

      // Create automatic orders for critical items
      for (const recommendation of affordableRecommendations) {
        if (recommendation.urgency === 'critical' || 
           (recommendation.urgency === 'high' && !this.config.approval_required)) {
          try {
            const order = await this.createAutomaticPurchaseOrder(recommendation)
            createdOrders.push(order)
          } catch (error) {
            errors.push(`Failed to create order for ${recommendation.inventory_item.sku}: ${error}`)
          }
        }
      }

      return {
        recommendations,
        created_orders: createdOrders,
        errors,
      }
    } catch (error) {
      errors.push(`Auto-reorder process failed: ${error}`)
      return {
        recommendations: [],
        created_orders: [],
        errors,
      }
    }
  }

  private filterByBudget(recommendations: ReorderRecommendation[]): ReorderRecommendation[] {
    let totalCost = 0
    const filtered: ReorderRecommendation[] = []

    // Sort by urgency first, then by cost
    const sorted = [...recommendations].sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
      if (urgencyDiff !== 0) return urgencyDiff
      return a.estimated_cost - b.estimated_cost
    })

    for (const recommendation of sorted) {
      if (totalCost + recommendation.estimated_cost <= this.config.budget_limits.daily_limit) {
        filtered.push(recommendation)
        totalCost += recommendation.estimated_cost
      }
    }

    return filtered
  }

  async scheduleAutomaticReorders(): Promise<void> {
    // This would integrate with a job scheduler like cron
    console.log('Auto-reorder system scheduled to run daily at 2 AM')
  }

  getConfig(): AutoReorderConfig {
    return this.config
  }

  updateConfig(newConfig: Partial<AutoReorderConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

export const autoReorderService = new AutoReorderService()