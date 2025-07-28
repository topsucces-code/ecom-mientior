'use client'

import { supabase } from './supabase/client'
import { 
  InventoryItem, 
  InventoryMovement, 
  StockAlert, 
  PurchaseOrder,
  Product 
} from './supabase/types'

export interface InventoryFilters {
  warehouse_id?: string
  product_id?: string
  vendor_id?: string
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock'
  category?: string
}

export interface InventorySearchParams {
  query?: string
  filters?: InventoryFilters
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export class InventoryService {
  
  // ========== INVENTORY ITEMS ==========
  
  async getInventoryItems(params: InventorySearchParams = {}): Promise<InventoryItem[]> {
    try {
      const {
        query,
        filters = {},
        sort_by = 'created_at',
        sort_direction = 'desc',
        limit = 50,
        offset = 0
      } = params

      let dbQuery = supabase
        .from('inventory_items')
        .select(`
          *,
          product:products (
            id, name, sku, category_id, price, vendor_id
          ),
          warehouse:warehouses (
            id, name, location
          )
        `)

      // Apply filters
      if (filters.warehouse_id) {
        dbQuery = dbQuery.eq('warehouse_id', filters.warehouse_id)
      }

      if (filters.product_id) {
        dbQuery = dbQuery.eq('product_id', filters.product_id)
      }

      if (filters.vendor_id) {
        dbQuery = dbQuery.eq('product.vendor_id', filters.vendor_id)
      }

      if (filters.stock_status) {
        switch (filters.stock_status) {
          case 'out_of_stock':
            dbQuery = dbQuery.eq('quantity_available', 0)
            break
          case 'low_stock':
            dbQuery = dbQuery.gt('quantity_available', 0).filter('quantity_available', 'lte', 'reorder_point')
            break
          case 'overstock':
            dbQuery = dbQuery.filter('quantity_available', 'gt', 'max_stock_level')
            break
          case 'in_stock':
            dbQuery = dbQuery.filter('quantity_available', 'gt', 'reorder_point')
            break
        }
      }

      // Apply text search
      if (query) {
        dbQuery = dbQuery.or(`sku.ilike.%${query}%,product.name.ilike.%${query}%,product.sku.ilike.%${query}%`)
      }

      // Apply sorting
      dbQuery = dbQuery.order(sort_by, { ascending: sort_direction === 'asc' })

      // Apply pagination
      dbQuery = dbQuery.range(offset, offset + limit - 1)

      const { data, error } = await dbQuery

      if (error) {
        console.error('Error fetching inventory items:', error)
        throw new Error('Failed to fetch inventory items')
      }

      return data || []
    } catch (error) {
      console.error('Error in getInventoryItems:', error)
      throw error
    }
  }

  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          product:products (
            id, name, sku, category_id, price, vendor_id
          ),
          warehouse:warehouses (
            id, name, location
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        console.error('Error fetching inventory item:', error)
        throw new Error('Failed to fetch inventory item')
      }

      return data
    } catch (error) {
      console.error('Error in getInventoryItem:', error)
      throw error
    }
  }

  async updateInventoryQuantity(itemId: string, newQuantity: number, reason: string = 'manual_adjustment'): Promise<InventoryItem> {
    try {
      // First get current item to create movement record
      const currentItem = await this.getInventoryItem(itemId)
      if (!currentItem) {
        throw new Error('Inventory item not found')
      }

      const quantityChange = newQuantity - currentItem.quantity_available

      // Update inventory item
      const { data: updatedItem, error: updateError } = await supabase
        .from('inventory_items')
        .update({
          quantity_available: newQuantity,
          quantity_reserved: Math.max(0, currentItem.quantity_reserved),
          last_movement_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select(`
          *,
          product:products (
            id, name, sku, category_id, price, vendor_id
          ),
          warehouse:warehouses (
            id, name, location
          )
        `)
        .single()

      if (updateError) {
        console.error('Error updating inventory:', updateError)
        throw new Error('Failed to update inventory')
      }

      // Create movement record
      await this.createInventoryMovement({
        inventory_item_id: itemId,
        movement_type: quantityChange > 0 ? 'stock_in' : 'stock_out',
        quantity: Math.abs(quantityChange),
        reason,
        reference_number: `ADJ-${Date.now()}`,
        metadata: {
          previous_quantity: currentItem.quantity_available,
          new_quantity: newQuantity
        }
      })

      // Check for stock alerts
      await this.checkStockAlerts(updatedItem)

      return updatedItem
    } catch (error) {
      console.error('Error in updateInventoryQuantity:', error)
      throw error
    }
  }

  // ========== INVENTORY MOVEMENTS ==========

  async createInventoryMovement(movementData: Omit<InventoryMovement, 'id' | 'created_at'>): Promise<InventoryMovement> {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .insert({
          ...movementData,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          inventory_item:inventory_items (
            id, sku, product:products (name)
          )
        `)
        .single()

      if (error) {
        console.error('Error creating inventory movement:', error)
        throw new Error('Failed to create inventory movement')
      }

      return data
    } catch (error) {
      console.error('Error in createInventoryMovement:', error)
      throw error
    }
  }

  async getInventoryMovements(filters?: {
    inventory_item_id?: string
    movement_type?: string
    date_from?: string
    date_to?: string
    limit?: number
  }): Promise<InventoryMovement[]> {
    try {
      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          inventory_item:inventory_items (
            id, sku, product:products (name)
          )
        `)

      if (filters?.inventory_item_id) {
        query = query.eq('inventory_item_id', filters.inventory_item_id)
      }

      if (filters?.movement_type) {
        query = query.eq('movement_type', filters.movement_type)
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      query = query.order('created_at', { ascending: false })

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching inventory movements:', error)
        throw new Error('Failed to fetch inventory movements')
      }

      return data || []
    } catch (error) {
      console.error('Error in getInventoryMovements:', error)
      throw error
    }
  }

  // ========== STOCK ALERTS ==========

  async getStockAlerts(filters?: {
    alert_type?: string
    status?: string
    warehouse_id?: string
  }): Promise<StockAlert[]> {
    try {
      let query = supabase
        .from('stock_alerts')
        .select(`
          *,
          inventory_item:inventory_items (
            id, sku, quantity_available, reorder_point,
            product:products (name, vendor_id),
            warehouse:warehouses (name)
          )
        `)

      if (filters?.alert_type) {
        query = query.eq('alert_type', filters.alert_type)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.warehouse_id) {
        query = query.eq('inventory_item.warehouse_id', filters.warehouse_id)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching stock alerts:', error)
        throw new Error('Failed to fetch stock alerts')
      }

      return data || []
    } catch (error) {
      console.error('Error in getStockAlerts:', error)
      throw error
    }
  }

  async createStockAlert(alertData: Omit<StockAlert, 'id' | 'created_at'>): Promise<StockAlert> {
    try {
      const { data, error } = await supabase
        .from('stock_alerts')
        .insert({
          ...alertData,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          inventory_item:inventory_items (
            id, sku, quantity_available, reorder_point,
            product:products (name, vendor_id),
            warehouse:warehouses (name)
          )
        `)
        .single()

      if (error) {
        console.error('Error creating stock alert:', error)
        throw new Error('Failed to create stock alert')
      }

      return data
    } catch (error) {
      console.error('Error in createStockAlert:', error)
      throw error
    }
  }

  async resolveStockAlert(alertId: string, resolutionNotes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('stock_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes
        })
        .eq('id', alertId)

      if (error) {
        console.error('Error resolving stock alert:', error)
        throw new Error('Failed to resolve stock alert')
      }
    } catch (error) {
      console.error('Error in resolveStockAlert:', error)
      throw error
    }
  }

  private async checkStockAlerts(inventoryItem: InventoryItem): Promise<void> {
    try {
      const { quantity_available, reorder_point, max_stock_level } = inventoryItem

      // Check for low stock alert
      if (quantity_available <= reorder_point && quantity_available > 0) {
        await this.createStockAlert({
          inventory_item_id: inventoryItem.id,
          alert_type: 'low_stock',
          message: `Stock level is below reorder point (${quantity_available} <= ${reorder_point})`,
          severity: 'medium',
          status: 'active'
        })
      }

      // Check for out of stock alert
      if (quantity_available === 0) {
        await this.createStockAlert({
          inventory_item_id: inventoryItem.id,
          alert_type: 'out_of_stock',
          message: 'Item is completely out of stock',
          severity: 'high',
          status: 'active'
        })
      }

      // Check for overstock alert
      if (max_stock_level && quantity_available > max_stock_level) {
        await this.createStockAlert({
          inventory_item_id: inventoryItem.id,
          alert_type: 'overstock',
          message: `Stock level exceeds maximum (${quantity_available} > ${max_stock_level})`,
          severity: 'low',
          status: 'active'
        })
      }
    } catch (error) {
      console.error('Error checking stock alerts:', error)
    }
  }

  // ========== PURCHASE ORDERS ==========

  async createPurchaseOrder(orderData: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>): Promise<PurchaseOrder> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert({
          ...orderData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          vendor:vendors (id, business_name),
          items:purchase_order_items (
            *,
            product:products (name, sku)
          )
        `)
        .single()

      if (error) {
        console.error('Error creating purchase order:', error)
        throw new Error('Failed to create purchase order')
      }

      return data
    } catch (error) {
      console.error('Error in createPurchaseOrder:', error)
      throw error
    }
  }

  async getPurchaseOrders(filters?: {
    vendor_id?: string
    status?: string
    date_from?: string
    date_to?: string
  }): Promise<PurchaseOrder[]> {
    try {
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          vendor:vendors (id, business_name),
          items:purchase_order_items (
            *,
            product:products (name, sku)
          )
        `)

      if (filters?.vendor_id) {
        query = query.eq('vendor_id', filters.vendor_id)
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
        console.error('Error fetching purchase orders:', error)
        throw new Error('Failed to fetch purchase orders')
      }

      return data || []
    } catch (error) {
      console.error('Error in getPurchaseOrders:', error)
      throw error
    }
  }

  async updatePurchaseOrderStatus(orderId: string, status: string, notes?: string): Promise<PurchaseOrder> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(notes ? { notes } : {}),
          ...(status === 'delivered' ? { delivered_at: new Date().toISOString() } : {})
        })
        .eq('id', orderId)
        .select(`
          *,
          vendor:vendors (id, business_name),
          items:purchase_order_items (
            *,
            product:products (name, sku)
          )
        `)
        .single()

      if (error) {
        console.error('Error updating purchase order:', error)
        throw new Error('Failed to update purchase order')
      }

      // If delivered, update inventory quantities
      if (status === 'delivered' && data.items) {
        for (const item of data.items) {
          await this.receiveStock(item.product.id, item.quantity_ordered, orderId)
        }
      }

      return data
    } catch (error) {
      console.error('Error in updatePurchaseOrderStatus:', error)
      throw error
    }
  }

  // ========== STOCK RECEIVING ==========

  async receiveStock(productId: string, quantity: number, purchaseOrderId?: string): Promise<void> {
    try {
      // Find inventory item for the product
      const { data: inventoryItems, error: findError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('product_id', productId)
        .limit(1)

      if (findError) {
        console.error('Error finding inventory item:', findError)
        throw new Error('Failed to find inventory item')
      }

      if (!inventoryItems || inventoryItems.length === 0) {
        throw new Error('No inventory item found for product')
      }

      const inventoryItem = inventoryItems[0]
      const newQuantity = inventoryItem.quantity_available + quantity

      // Update inventory
      await this.updateInventoryQuantity(
        inventoryItem.id, 
        newQuantity, 
        purchaseOrderId ? `purchase_order_${purchaseOrderId}` : 'stock_receipt'
      )
    } catch (error) {
      console.error('Error in receiveStock:', error)
      throw error
    }
  }

  // ========== ANALYTICS ==========

  async getInventoryMetrics(warehouseId?: string): Promise<any> {
    try {
      const { data: metrics, error } = await supabase.rpc('get_inventory_metrics', {
        warehouse_id: warehouseId
      })

      if (error) {
        console.error('Error fetching inventory metrics:', error)
        throw new Error('Failed to fetch inventory metrics')
      }

      return metrics
    } catch (error) {
      console.error('Error in getInventoryMetrics:', error)
      throw error
    }
  }

  async getStockTurnoverAnalysis(dateFrom: string, dateTo: string): Promise<any> {
    try {
      const { data: analysis, error } = await supabase.rpc('get_stock_turnover_analysis', {
        date_from: dateFrom,
        date_to: dateTo
      })

      if (error) {
        console.error('Error fetching stock turnover analysis:', error)
        throw new Error('Failed to fetch stock turnover analysis')
      }

      return analysis
    } catch (error) {
      console.error('Error in getStockTurnoverAnalysis:', error)
      throw error
    }
  }

  // ========== AUTO REORDER ==========

  async generateAutoReorderSuggestions(): Promise<any[]> {
    try {
      const { data: suggestions, error } = await supabase.rpc('generate_auto_reorder_suggestions')

      if (error) {
        console.error('Error generating auto reorder suggestions:', error)
        throw new Error('Failed to generate auto reorder suggestions')
      }

      return suggestions || []
    } catch (error) {
      console.error('Error in generateAutoReorderSuggestions:', error)
      throw error
    }
  }

  async executeAutoReorder(inventoryItemId: string, quantity: number): Promise<PurchaseOrder> {
    try {
      // Get inventory item with product and vendor info
      const inventoryItem = await this.getInventoryItem(inventoryItemId)
      if (!inventoryItem || !inventoryItem.product) {
        throw new Error('Inventory item or product not found')
      }

      // Create purchase order
      const purchaseOrder = await this.createPurchaseOrder({
        vendor_id: inventoryItem.product.vendor_id,
        status: 'pending',
        total_amount: quantity * (inventoryItem.product.price || 0),
        currency: 'USD',
        order_number: `AUTO-${Date.now()}`,
        notes: 'Auto-generated reorder based on stock levels'
      })

      return purchaseOrder
    } catch (error) {
      console.error('Error in executeAutoReorder:', error)
      throw error
    }
  }
}

export const inventoryService = new InventoryService()