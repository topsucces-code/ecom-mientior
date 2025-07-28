export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          description?: string
          slug: string
          image_url?: string
          parent_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          slug: string
          image_url?: string
          parent_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          slug?: string
          image_url?: string
          parent_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          compare_at_price?: number
          sku: string
          inventory_quantity: number
          category_id: string
          brand?: string
          weight?: number
          dimensions?: string
          images: string[]
          tags: string[]
          status: 'active' | 'draft' | 'archived'
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          compare_at_price?: number
          sku: string
          inventory_quantity: number
          category_id: string
          brand?: string
          weight?: number
          dimensions?: string
          images?: string[]
          tags?: string[]
          status?: 'active' | 'draft' | 'archived'
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          compare_at_price?: number
          sku?: string
          inventory_quantity?: number
          category_id?: string
          brand?: string
          weight?: number
          dimensions?: string
          images?: string[]
          tags?: string[]
          status?: 'active' | 'draft' | 'archived'
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          total_amount: number
          tax_amount: number
          shipping_amount: number
          discount_amount: number
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method: string
          payment_id?: string
          shipping_address: any
          billing_address: any
          order_items: any[]
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          total_amount: number
          tax_amount?: number
          shipping_amount?: number
          discount_amount?: number
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method: string
          payment_id?: string
          shipping_address: any
          billing_address: any
          order_items: any[]
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          total_amount?: number
          tax_amount?: number
          shipping_amount?: number
          discount_amount?: number
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method?: string
          payment_id?: string
          shipping_address?: any
          billing_address?: any
          order_items?: any[]
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          first_name?: string
          last_name?: string
          phone?: string
          avatar_url?: string
          addresses: any[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string
          last_name?: string
          phone?: string
          avatar_url?: string
          addresses?: any[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string
          avatar_url?: string
          addresses?: any[]
          created_at?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          rating: number
          title: string
          content: string
          images: string[]
          is_verified_purchase: boolean
          is_featured: boolean
          status: 'pending' | 'approved' | 'rejected'
          helpful_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          rating: number
          title: string
          content: string
          images?: string[]
          is_verified_purchase?: boolean
          is_featured?: boolean
          status?: 'pending' | 'approved' | 'rejected'
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          rating?: number
          title?: string
          content?: string
          images?: string[]
          is_verified_purchase?: boolean
          is_featured?: boolean
          status?: 'pending' | 'approved' | 'rejected'
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_interactions: {
        Row: {
          id: string
          user_id: string
          product_id: string
          interaction_type: 'view' | 'cart' | 'purchase' | 'wishlist' | 'click' | 'impression' | 'search' | 'filter'
          interaction_data: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          interaction_type: 'view' | 'cart' | 'purchase' | 'wishlist' | 'click' | 'impression' | 'search' | 'filter'
          interaction_data?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          interaction_type?: 'view' | 'cart' | 'purchase' | 'wishlist' | 'click' | 'impression' | 'search' | 'filter'
          interaction_data?: any
          created_at?: string
        }
      }
      warehouses: {
        Row: {
          id: string
          name: string
          code: string
          address: any
          contact: any
          is_active: boolean
          capacity_info: any
          operating_hours: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          address: any
          contact?: any
          is_active?: boolean
          capacity_info?: any
          operating_hours?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          address?: any
          contact?: any
          is_active?: boolean
          capacity_info?: any
          operating_hours?: any
          created_at?: string
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          code: string
          contact: any
          address: any
          payment_terms?: string
          lead_time_days?: number
          minimum_order_amount?: number
          is_active: boolean
          rating?: number
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          contact?: any
          address: any
          payment_terms?: string
          lead_time_days?: number
          minimum_order_amount?: number
          is_active?: boolean
          rating?: number
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          contact?: any
          address?: any
          payment_terms?: string
          lead_time_days?: number
          minimum_order_amount?: number
          is_active?: boolean
          rating?: number
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          product_id: string
          warehouse_id?: string
          sku: string
          quantity_available: number
          quantity_reserved: number
          quantity_allocated: number
          quantity_incoming: number
          reorder_point: number
          max_stock_level?: number
          unit_cost: number
          location?: string
          batch_number?: string
          expiration_date?: string
          supplier_id?: string
          last_restocked_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          warehouse_id?: string
          sku: string
          quantity_available?: number
          quantity_reserved?: number
          quantity_allocated?: number
          quantity_incoming?: number
          reorder_point?: number
          max_stock_level?: number
          unit_cost: number
          location?: string
          batch_number?: string
          expiration_date?: string
          supplier_id?: string
          last_restocked_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          warehouse_id?: string
          sku?: string
          quantity_available?: number
          quantity_reserved?: number
          quantity_allocated?: number
          quantity_incoming?: number
          reorder_point?: number
          max_stock_level?: number
          unit_cost?: number
          location?: string
          batch_number?: string
          expiration_date?: string
          supplier_id?: string
          last_restocked_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      inventory_movements: {
        Row: {
          id: string
          inventory_item_id: string
          movement_type: 'inbound' | 'outbound' | 'adjustment' | 'transfer' | 'reserved' | 'unreserved'
          quantity: number
          reference_id?: string
          reference_type?: 'order' | 'transfer' | 'adjustment' | 'purchase_order' | 'return'
          reason?: string
          notes?: string
          created_by?: string
          created_at: string
        }
        Insert: {
          id?: string
          inventory_item_id: string
          movement_type: 'inbound' | 'outbound' | 'adjustment' | 'transfer' | 'reserved' | 'unreserved'
          quantity: number
          reference_id?: string
          reference_type?: 'order' | 'transfer' | 'adjustment' | 'purchase_order' | 'return'
          reason?: string
          notes?: string
          created_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          inventory_item_id?: string
          movement_type?: 'inbound' | 'outbound' | 'adjustment' | 'transfer' | 'reserved' | 'unreserved'
          quantity?: number
          reference_id?: string
          reference_type?: 'order' | 'transfer' | 'adjustment' | 'purchase_order' | 'return'
          reason?: string
          notes?: string
          created_by?: string
          created_at?: string
        }
      }
      stock_alerts: {
        Row: {
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
        Insert: {
          id?: string
          inventory_item_id: string
          alert_type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring_soon' | 'expired'
          threshold_value?: number
          current_value: number
          severity: 'low' | 'medium' | 'high' | 'critical'
          is_resolved?: boolean
          resolved_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inventory_item_id?: string
          alert_type?: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring_soon' | 'expired'
          threshold_value?: number
          current_value?: number
          severity?: 'low' | 'medium' | 'high' | 'critical'
          is_resolved?: boolean
          resolved_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      purchase_orders: {
        Row: {
          id: string
          supplier_id: string
          order_number: string
          status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'completed' | 'cancelled'
          items: any
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
        Insert: {
          id?: string
          supplier_id: string
          order_number: string
          status?: 'draft' | 'sent' | 'confirmed' | 'partial' | 'completed' | 'cancelled'
          items: any
          subtotal: number
          tax_amount?: number
          shipping_cost?: number
          total_amount: number
          expected_delivery_date?: string
          actual_delivery_date?: string
          notes?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          order_number?: string
          status?: 'draft' | 'sent' | 'confirmed' | 'partial' | 'completed' | 'cancelled'
          items?: any
          subtotal?: number
          tax_amount?: number
          shipping_cost?: number
          total_amount?: number
          expected_delivery_date?: string
          actual_delivery_date?: string
          notes?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      inventory_adjustments: {
        Row: {
          id: string
          warehouse_id?: string
          adjustment_type: 'physical_count' | 'damage' | 'loss' | 'found' | 'correction' | 'write_off'
          status: 'draft' | 'pending_approval' | 'approved' | 'completed' | 'rejected'
          items: any
          reason: string
          notes?: string
          created_by: string
          approved_by?: string
          approved_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          warehouse_id?: string
          adjustment_type: 'physical_count' | 'damage' | 'loss' | 'found' | 'correction' | 'write_off'
          status?: 'draft' | 'pending_approval' | 'approved' | 'completed' | 'rejected'
          items: any
          reason: string
          notes?: string
          created_by: string
          approved_by?: string
          approved_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          warehouse_id?: string
          adjustment_type?: 'physical_count' | 'damage' | 'loss' | 'found' | 'correction' | 'write_off'
          status?: 'draft' | 'pending_approval' | 'approved' | 'completed' | 'rejected'
          items?: any
          reason?: string
          notes?: string
          created_by?: string
          approved_by?: string
          approved_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}