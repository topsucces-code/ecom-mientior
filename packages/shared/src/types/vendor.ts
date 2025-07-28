export interface Vendor {
  id: string
  user_id: string
  business_name: string
  business_type: 'individual' | 'company' | 'corporation' | 'partnership'
  legal_name?: string
  tax_id?: string
  registration_number?: string
  
  // Contact Information
  contact: {
    email: string
    phone?: string
    website?: string
    primary_contact_name?: string
    primary_contact_role?: string
  }
  
  // Business Address
  business_address: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  
  // Shipping Address (if different)
  shipping_address?: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  
  // Business Information
  business_info: {
    description: string
    logo_url?: string
    banner_url?: string
    established_year?: number
    employee_count?: string
    annual_revenue?: string
    business_categories: string[]
  }
  
  // Financial Information
  financial_info: {
    bank_account_holder: string
    bank_name: string
    account_number: string
    routing_number?: string
    iban?: string
    swift_code?: string
    tax_exempt?: boolean
    tax_rate?: number
  }
  
  // Platform Settings
  settings: {
    commission_rate: number
    auto_approve_products: boolean
    allow_direct_messaging: boolean
    show_contact_info: boolean
    vacation_mode: boolean
    vacation_message?: string
    return_policy?: string
    shipping_policy?: string
    processing_time_days: number
  }
  
  // Status and Verification
  status: 'pending' | 'active' | 'suspended' | 'banned' | 'under_review'
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
  verification_documents?: string[]
  verification_notes?: string
  
  // Metrics
  metrics: {
    total_products: number
    total_sales: number
    total_revenue: number
    average_rating: number
    total_reviews: number
    response_rate: number
    response_time_hours: number
    on_time_shipping_rate: number
    cancellation_rate: number
  }
  
  // Timestamps
  created_at: string
  updated_at: string
  approved_at?: string
  last_active_at?: string
}

export interface VendorApplication {
  id: string
  user_id: string
  business_name: string
  business_type: 'individual' | 'company' | 'corporation' | 'partnership'
  contact_email: string
  contact_phone?: string
  business_description: string
  business_address: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  estimated_monthly_volume: string
  product_categories: string[]
  documents: VendorDocument[]
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
  rejection_reason?: string
  reviewer_id?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface VendorDocument {
  id: string
  vendor_id: string
  document_type: 'business_license' | 'tax_certificate' | 'identity_proof' | 'bank_statement' | 'insurance_certificate' | 'other'
  file_url: string
  file_name: string
  file_size: number
  upload_date: string
  verification_status: 'pending' | 'verified' | 'rejected'
  verification_notes?: string
}

export interface VendorProduct {
  id: string
  vendor_id: string
  product_id: string
  vendor_sku?: string
  vendor_price?: number
  vendor_inventory?: number
  vendor_description?: string
  status: 'draft' | 'pending' | 'active' | 'inactive' | 'rejected'
  commission_rate?: number
  featured: boolean
  created_at: string
  updated_at: string
}

export interface VendorOrder {
  id: string
  vendor_id: string
  order_id: string
  order_items: VendorOrderItem[]
  subtotal: number
  commission_amount: number
  vendor_payout: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  tracking_number?: string
  shipping_carrier?: string
  shipped_at?: string
  delivered_at?: string
  created_at: string
  updated_at: string
}

export interface VendorOrderItem {
  id: string
  vendor_order_id: string
  product_id: string
  vendor_product_id: string
  quantity: number
  unit_price: number
  total_price: number
  commission_rate: number
  commission_amount: number
  vendor_payout: number
}

export interface VendorPayout {
  id: string
  vendor_id: string
  payout_period_start: string
  payout_period_end: string
  total_sales: number
  total_commission: number
  net_payout: number
  orders_count: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  payment_method: 'bank_transfer' | 'paypal' | 'stripe' | 'check'
  payment_reference?: string
  processed_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface VendorReview {
  id: string
  vendor_id: string
  order_id: string
  user_id: string
  rating: number
  review_text?: string
  review_categories: {
    communication: number
    shipping_speed: number
    item_as_described: number
    customer_service: number
  }
  is_verified_purchase: boolean
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface VendorMessage {
  id: string
  vendor_id: string
  user_id?: string
  admin_id?: string
  subject: string
  message: string
  message_type: 'inquiry' | 'complaint' | 'support' | 'order_related' | 'general'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  attachments?: string[]
  thread_id?: string
  parent_message_id?: string
  created_at: string
  updated_at: string
}

export interface VendorCommission {
  id: string
  vendor_id: string
  order_id: string
  product_id: string
  commission_type: 'percentage' | 'flat_fee' | 'tiered'
  commission_rate: number
  commission_amount: number
  base_amount: number
  status: 'pending' | 'confirmed' | 'paid' | 'disputed'
  created_at: string
  updated_at: string
}

export interface VendorAnalytics {
  vendor_id: string
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  date_range: {
    start_date: string
    end_date: string
  }
  metrics: {
    total_sales: number
    total_revenue: number
    total_orders: number
    average_order_value: number
    conversion_rate: number
    page_views: number
    unique_visitors: number
    return_customers: number
    new_customers: number
    refund_rate: number
    cancellation_rate: number
    inventory_turnover: number
  }
  top_products: {
    product_id: string
    sales_count: number
    revenue: number
  }[]
  customer_demographics: {
    age_groups: Record<string, number>
    locations: Record<string, number>
    gender_distribution: Record<string, number>
  }
  traffic_sources: Record<string, number>
  generated_at: string
}

export interface VendorSettings {
  vendor_id: string
  notification_preferences: {
    email_new_orders: boolean
    email_low_inventory: boolean
    email_customer_messages: boolean
    email_reviews: boolean
    email_payouts: boolean
    sms_urgent_notifications: boolean
    push_notifications: boolean
  }
  business_hours: {
    monday?: { open: string; close: string; closed?: boolean }
    tuesday?: { open: string; close: string; closed?: boolean }
    wednesday?: { open: string; close: string; closed?: boolean }
    thursday?: { open: string; close: string; closed?: boolean }
    friday?: { open: string; close: string; closed?: boolean }
    saturday?: { open: string; close: string; closed?: boolean }
    sunday?: { open: string; close: string; closed?: boolean }
    timezone: string
  }
  shipping_settings: {
    default_processing_time: number
    shipping_methods: VendorShippingMethod[]
    international_shipping: boolean
    free_shipping_threshold?: number
    packaging_options: string[]
  }
  return_policy: {
    accepts_returns: boolean
    return_window_days: number
    return_conditions: string[]
    return_shipping_cost: 'buyer' | 'seller' | 'shared'
    restocking_fee_percentage?: number
  }
  updated_at: string
}

export interface VendorShippingMethod {
  id: string
  name: string
  carrier: string
  service_type: string
  base_cost: number
  per_item_cost?: number
  weight_based_pricing?: {
    base_weight: number
    per_additional_unit: number
    cost_per_unit: number
  }
  delivery_time: {
    min_days: number
    max_days: number
  }
  restrictions?: {
    max_weight?: number
    max_dimensions?: { length: number; width: number; height: number }
    excluded_regions?: string[]
  }
  is_active: boolean
}

export interface VendorFilters {
  status?: Vendor['status'][]
  verification_status?: Vendor['verification_status'][]
  business_type?: Vendor['business_type'][]
  business_categories?: string[]
  location?: {
    country?: string
    state?: string
    city?: string
  }
  metrics?: {
    min_rating?: number
    min_sales?: number
    min_revenue?: number
  }
  date_range?: {
    start_date: string
    end_date: string
  }
}

export interface VendorSearchParams {
  query?: string
  filters?: VendorFilters
  sort_by?: 'name' | 'rating' | 'sales' | 'revenue' | 'created_at' | 'last_active'
  sort_direction?: 'asc' | 'desc'
  limit?: number
  offset?: number
}