export interface InventoryItem {
  id: string
  product_id: string
  warehouse_id?: string
  sku: string
  quantity_available: number
  quantity_reserved: number
  quantity_allocated: number
  quantity_incoming: number
  reorder_point: number
  max_stock_level: number
  unit_cost: number
  location?: string
  batch_number?: string
  expiration_date?: string
  supplier_id?: string
  last_restocked_at?: string
  created_at: string
  updated_at: string
}

export interface InventoryMovement {
  id: string
  inventory_item_id: string
  movement_type: 'inbound' | 'outbound' | 'adjustment' | 'transfer' | 'reserved' | 'unreserved'
  quantity: number
  reference_id?: string // Order ID, Transfer ID, etc.
  reference_type?: 'order' | 'transfer' | 'adjustment' | 'purchase_order' | 'return'
  reason?: string
  notes?: string
  created_by?: string
  created_at: string
}

export interface StockAlert {
  id: string
  inventory_item_id: string
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring_soon' | 'expired'
  threshold_value?: number
  current_value: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  is_resolved: boolean
  resolved_at?: string
  created_at: string
  updated_at: string
}

export interface Warehouse {
  id: string
  name: string
  code: string
  address: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  contact: {
    phone?: string
    email?: string
    manager?: string
  }
  is_active: boolean
  capacity_info?: {
    total_area?: number
    available_area?: number
    max_items?: number
  }
  operating_hours?: {
    monday?: string
    tuesday?: string
    wednesday?: string
    thursday?: string
    friday?: string
    saturday?: string
    sunday?: string
  }
  created_at: string
  updated_at: string
}

export interface InventoryTransfer {
  id: string
  from_warehouse_id: string
  to_warehouse_id: string
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  items: InventoryTransferItem[]
  requested_by: string
  approved_by?: string
  shipped_at?: string
  received_at?: string
  tracking_number?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface InventoryTransferItem {
  id: string
  transfer_id: string
  inventory_item_id: string
  product_id: string
  quantity_requested: number
  quantity_shipped?: number
  quantity_received?: number
  unit_cost: number
  notes?: string
}

export interface PurchaseOrder {
  id: string
  supplier_id: string
  order_number: string
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'completed' | 'cancelled'
  items: PurchaseOrderItem[]
  subtotal: number
  tax_amount: number
  shipping_cost: number
  total_amount: number
  expected_delivery_date?: string
  actual_delivery_date?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  product_id: string
  quantity_ordered: number
  quantity_received: number
  unit_cost: number
  total_cost: number
  notes?: string
}

export interface Supplier {
  id: string
  name: string
  code: string
  contact: {
    email?: string
    phone?: string
    website?: string
    contact_person?: string
  }
  address: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  payment_terms?: string
  lead_time_days?: number
  minimum_order_amount?: number
  is_active: boolean
  rating?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface InventoryValuation {
  id: string
  warehouse_id?: string
  valuation_date: string
  method: 'fifo' | 'lifo' | 'average_cost' | 'specific_identification'
  items: InventoryValuationItem[]
  total_value: number
  created_by: string
  created_at: string
}

export interface InventoryValuationItem {
  id: string
  valuation_id: string
  inventory_item_id: string
  product_id: string
  quantity: number
  unit_cost: number
  total_cost: number
  valuation_method: string
}

export interface InventoryAdjustment {
  id: string
  warehouse_id?: string
  adjustment_type: 'physical_count' | 'damage' | 'loss' | 'found' | 'correction' | 'write_off'
  status: 'draft' | 'pending_approval' | 'approved' | 'completed' | 'rejected'
  items: InventoryAdjustmentItem[]
  reason: string
  notes?: string
  created_by: string
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface InventoryAdjustmentItem {
  id: string
  adjustment_id: string
  inventory_item_id: string
  product_id: string
  expected_quantity: number
  actual_quantity: number
  quantity_difference: number
  unit_cost: number
  cost_impact: number
  reason?: string
}

export interface InventoryReport {
  id: string
  report_type: 'stock_levels' | 'movement_history' | 'valuation' | 'alerts' | 'aging' | 'turnover'
  warehouse_id?: string
  date_range: {
    start_date: string
    end_date: string
  }
  filters?: Record<string, any>
  data: any
  generated_by: string
  generated_at: string
}

export interface InventoryMetrics {
  total_value: number
  total_items: number
  low_stock_items: number
  out_of_stock_items: number
  overstock_items: number
  average_turnover_rate: number
  stock_accuracy_percentage: number
  warehouse_utilization: Record<string, number>
  top_moving_products: {
    product_id: string
    quantity_moved: number
    value_moved: number
  }[]
  slow_moving_products: {
    product_id: string
    days_since_last_movement: number
    current_stock: number
  }[]
}

// Inventory management configuration
export interface InventoryConfig {
  auto_reorder: boolean
  reorder_buffer_percentage: number
  default_lead_time_days: number
  valuation_method: 'fifo' | 'lifo' | 'average_cost' | 'specific_identification'
  enable_batch_tracking: boolean
  enable_expiration_tracking: boolean
  require_approval_for_adjustments: boolean
  alert_thresholds: {
    low_stock_percentage: number
    overstock_percentage: number
    expiry_warning_days: number
  }
}

export interface InventoryFilters {
  warehouse_id?: string
  product_category?: string
  supplier_id?: string
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock'
  expiration_status?: 'expiring_soon' | 'expired' | 'fresh'
  movement_type?: InventoryMovement['movement_type']
  date_range?: {
    start_date: string
    end_date: string
  }
}

export interface InventorySearchParams {
  query?: string
  filters?: InventoryFilters
  sort_by?: 'name' | 'quantity' | 'value' | 'last_movement' | 'created_at'
  sort_direction?: 'asc' | 'desc'
  limit?: number
  offset?: number
}