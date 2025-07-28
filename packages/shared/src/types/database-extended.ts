import { Database } from './database'

// Extend the existing database types with new functionality
export interface ExtendedDatabase extends Database {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      // Coupons and Promotions
      coupons: {
        Row: {
          id: string
          code: string
          type: 'percentage' | 'fixed' | 'free_shipping'
          value: number
          description: string
          minimum_order_amount?: number
          maximum_discount_amount?: number
          usage_limit?: number
          usage_count: number
          user_usage_limit?: number
          valid_from: string
          valid_to: string
          categories?: string[]
          products?: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          type: 'percentage' | 'fixed' | 'free_shipping'
          value: number
          description: string
          minimum_order_amount?: number
          maximum_discount_amount?: number
          usage_limit?: number
          usage_count?: number
          user_usage_limit?: number
          valid_from: string
          valid_to: string
          categories?: string[]
          products?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          type?: 'percentage' | 'fixed' | 'free_shipping'
          value?: number
          description?: string
          minimum_order_amount?: number
          maximum_discount_amount?: number
          usage_limit?: number
          usage_count?: number
          user_usage_limit?: number
          valid_from?: string
          valid_to?: string
          categories?: string[]
          products?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      coupon_usage: {
        Row: {
          id: string
          coupon_id: string
          user_id: string
          order_id: string
          discount_amount: number
          used_at: string
        }
        Insert: {
          id?: string
          coupon_id: string
          user_id: string
          order_id: string
          discount_amount: number
          used_at?: string
        }
        Update: {
          id?: string
          coupon_id?: string
          user_id?: string
          order_id?: string
          discount_amount?: number
          used_at?: string
        }
      }

      // Payment System
      payments: {
        Row: {
          id: string
          order_id: string
          user_id: string
          payment_method_id: string
          amount: number
          currency: string
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded'
          transaction_id?: string
          payment_intent_id?: string
          parent_payment_id?: string
          provider_response: any
          metadata?: any
          processed_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          user_id: string
          payment_method_id: string
          amount: number
          currency?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded'
          transaction_id?: string
          payment_intent_id?: string
          parent_payment_id?: string
          provider_response?: any
          metadata?: any
          processed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          user_id?: string
          payment_method_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded'
          transaction_id?: string
          payment_intent_id?: string
          parent_payment_id?: string
          provider_response?: any
          metadata?: any
          processed_at?: string
          created_at?: string
          updated_at?: string
        }
      }

      payment_methods: {
        Row: {
          id: string
          user_id: string
          type: 'card' | 'bank_account' | 'digital_wallet'
          provider: 'stripe' | 'paypal' | 'bank'
          card_last_four?: string
          card_brand?: string
          card_exp_month?: number
          card_exp_year?: number
          bank_name?: string
          account_last_four?: string
          digital_wallet_email?: string
          is_default: boolean
          is_active: boolean
          provider_payment_method_id?: string
          metadata?: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'card' | 'bank_account' | 'digital_wallet'
          provider: 'stripe' | 'paypal' | 'bank'
          card_last_four?: string
          card_brand?: string
          card_exp_month?: number
          card_exp_year?: number
          bank_name?: string
          account_last_four?: string
          digital_wallet_email?: string
          is_default?: boolean
          is_active?: boolean
          provider_payment_method_id?: string
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'card' | 'bank_account' | 'digital_wallet'
          provider?: 'stripe' | 'paypal' | 'bank'
          card_last_four?: string
          card_brand?: string
          card_exp_month?: number
          card_exp_year?: number
          bank_name?: string
          account_last_four?: string
          digital_wallet_email?: string
          is_default?: boolean
          is_active?: boolean
          provider_payment_method_id?: string
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }

      // Notifications System
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'success' | 'error' | 'warning' | 'info' | 'order' | 'promotion'
          title: string
          message: string
          actions?: any
          category: 'system' | 'order' | 'promotion' | 'account' | 'security'
          priority: 'low' | 'medium' | 'high'
          read: boolean
          auto_hide: boolean
          duration?: number
          metadata?: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'success' | 'error' | 'warning' | 'info' | 'order' | 'promotion'
          title: string
          message: string
          actions?: any
          category: 'system' | 'order' | 'promotion' | 'account' | 'security'
          priority?: 'low' | 'medium' | 'high'
          read?: boolean
          auto_hide?: boolean
          duration?: number
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'success' | 'error' | 'warning' | 'info' | 'order' | 'promotion'
          title?: string
          message?: string
          actions?: any
          category?: 'system' | 'order' | 'promotion' | 'account' | 'security'
          priority?: 'low' | 'medium' | 'high'
          read?: boolean
          auto_hide?: boolean
          duration?: number
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }

      notification_settings: {
        Row: {
          id: string
          user_id: string
          enabled: boolean
          sound: boolean
          desktop: boolean
          email: boolean
          categories: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          enabled?: boolean
          sound?: boolean
          desktop?: boolean
          email?: boolean
          categories?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          enabled?: boolean
          sound?: boolean
          desktop?: boolean
          email?: boolean
          categories?: any
          created_at?: string
          updated_at?: string
        }
      }

      // Search and Analytics
      search_history: {
        Row: {
          id: string
          user_id?: string
          query: string
          filters?: any
          results_count: number
          clicked_product_id?: string
          session_id?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          query: string
          filters?: any
          results_count: number
          clicked_product_id?: string
          session_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          query?: string
          filters?: any
          results_count?: number
          clicked_product_id?: string
          session_id?: string
          created_at?: string
        }
      }

      product_analytics: {
        Row: {
          id: string
          product_id: string
          date: string
          views: number
          clicks: number
          cart_adds: number
          purchases: number
          revenue: number
          conversion_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          date: string
          views?: number
          clicks?: number
          cart_adds?: number
          purchases?: number
          revenue?: number
          conversion_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          date?: string
          views?: number
          clicks?: number
          cart_adds?: number
          purchases?: number
          revenue?: number
          conversion_rate?: number
          created_at?: string
          updated_at?: string
        }
      }

      // Wishlist
      wishlist_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          added_at: string
          notes?: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          added_at?: string
          notes?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          added_at?: string
          notes?: string
        }
      }

      // Product Comparison
      product_comparisons: {
        Row: {
          id: string
          user_id: string
          product_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_ids: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_ids?: string[]
          created_at?: string
          updated_at?: string
        }
      }

      // Advanced Chat System (already in schema.sql but extending for types)
      chat_agents: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          avatar?: string
          status: 'online' | 'away' | 'busy' | 'offline'
          is_active: boolean
          specialties: string[]
          max_concurrent_chats: number
          current_chat_count: number
          average_response_time: number
          customer_rating: number
          total_chats_handled: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          avatar?: string
          status?: 'online' | 'away' | 'busy' | 'offline'
          is_active?: boolean
          specialties?: string[]
          max_concurrent_chats?: number
          current_chat_count?: number
          average_response_time?: number
          customer_rating?: number
          total_chats_handled?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          avatar?: string
          status?: 'online' | 'away' | 'busy' | 'offline'
          is_active?: boolean
          specialties?: string[]
          max_concurrent_chats?: number
          current_chat_count?: number
          average_response_time?: number
          customer_rating?: number
          total_chats_handled?: number
          created_at?: string
          updated_at?: string
        }
      }

      chat_conversations: {
        Row: {
          id: string
          customer_id: string
          agent_id?: string
          status: 'open' | 'assigned' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          category: 'general' | 'order_support' | 'technical' | 'billing' | 'product_inquiry'
          subject?: string
          tags: string[]
          customer_info: any
          agent_info?: any
          metadata?: any
          created_at: string
          updated_at: string
          last_message_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          agent_id?: string
          status?: 'open' | 'assigned' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          category: 'general' | 'order_support' | 'technical' | 'billing' | 'product_inquiry'
          subject?: string
          tags?: string[]
          customer_info: any
          agent_info?: any
          metadata?: any
          created_at?: string
          updated_at?: string
          last_message_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          agent_id?: string
          status?: 'open' | 'assigned' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          category?: 'general' | 'order_support' | 'technical' | 'billing' | 'product_inquiry'
          subject?: string
          tags?: string[]
          customer_info?: any
          agent_info?: any
          metadata?: any
          created_at?: string
          updated_at?: string
          last_message_at?: string
        }
      }

      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          sender_type: 'customer' | 'agent' | 'bot'
          message: string
          message_type: 'text' | 'image' | 'file' | 'system'
          metadata?: any
          read_by: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          sender_type: 'customer' | 'agent' | 'bot'
          message: string
          message_type?: 'text' | 'image' | 'file' | 'system'
          metadata?: any
          read_by?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          sender_type?: 'customer' | 'agent' | 'bot'
          message?: string
          message_type?: 'text' | 'image' | 'file' | 'system'
          metadata?: any
          read_by?: string[]
          created_at?: string
          updated_at?: string
        }
      }

      // Vendor System Extensions
      vendor_payouts: {
        Row: {
          id: string
          vendor_id: string
          order_id: string
          amount: number
          platform_fee: number
          currency: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          payout_method?: string
          transaction_id?: string
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          order_id: string
          amount: number
          platform_fee: number
          currency?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          payout_method?: string
          transaction_id?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          order_id?: string
          amount?: number
          platform_fee?: number
          currency?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          payout_method?: string
          transaction_id?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }

      // User sessions for analytics
      user_sessions: {
        Row: {
          id: string
          user_id?: string
          session_id: string
          ip_address?: string
          user_agent?: string
          referrer?: string
          landing_page?: string
          started_at: string
          ended_at?: string
          page_views: number
          events: any[]
        }
        Insert: {
          id?: string
          user_id?: string
          session_id: string
          ip_address?: string
          user_agent?: string
          referrer?: string
          landing_page?: string
          started_at?: string
          ended_at?: string
          page_views?: number
          events?: any[]
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          ip_address?: string
          user_agent?: string
          referrer?: string
          landing_page?: string
          started_at?: string
          ended_at?: string
          page_views?: number
          events?: any[]
        }
      }
    }
    
    Functions: Database['public']['Functions'] & {
      get_payment_analytics: {
        Args: {
          date_from: string
          date_to: string
        }
        Returns: {
          total_amount: number
          transaction_count: number
          success_rate: number
          average_amount: number
          revenue_by_day: any[]
          payment_methods: any[]
        }[]
      }
      
      get_inventory_metrics: {
        Args: {
          warehouse_id?: string
        }
        Returns: {
          total_items: number
          total_value: number
          low_stock_items: number
          out_of_stock_items: number
          turnover_rate: number
          top_selling_products: any[]
        }[]
      }
      
      get_search_analytics: {
        Args: {
          date_from: string
          date_to: string
        }
        Returns: {
          total_searches: number
          unique_searches: number
          top_queries: any[]
          conversion_rate: number
          zero_result_rate: number
        }[]
      }
      
      check_stock_alerts: {
        Args: {
          warehouse_id?: string
        }
        Returns: {
          alert_id: string
          alert_type: string
          severity: string
          product_name: string
          current_stock: number
          threshold: number
        }[]
      }
      
      apply_coupon: {
        Args: {
          coupon_code: string
          user_id: string
          cart_total: number
          cart_items: any[]
        }
        Returns: {
          valid: boolean
          discount_amount: number
          error_message?: string
          coupon_id?: string
        }[]
      }
      
      get_personalized_recommendations: {
        Args: {
          user_id: string
          limit?: number
          category?: string
        }
        Returns: {
          product_id: string
          score: number
          reason: string
        }[]
      }
    }
  }
}

// Export the extended types
export type ExtendedTables = ExtendedDatabase['public']['Tables']
export type ExtendedFunctions = ExtendedDatabase['public']['Functions']

// Specific table types for easier imports
export type Coupon = ExtendedTables['coupons']['Row']
export type CouponInsert = ExtendedTables['coupons']['Insert']
export type CouponUpdate = ExtendedTables['coupons']['Update']

export type Payment = ExtendedTables['payments']['Row']
export type PaymentInsert = ExtendedTables['payments']['Insert']
export type PaymentUpdate = ExtendedTables['payments']['Update']

export type PaymentMethod = ExtendedTables['payment_methods']['Row']
export type PaymentMethodInsert = ExtendedTables['payment_methods']['Insert']
export type PaymentMethodUpdate = ExtendedTables['payment_methods']['Update']

export type Notification = ExtendedTables['notifications']['Row']
export type NotificationInsert = ExtendedTables['notifications']['Insert']
export type NotificationUpdate = ExtendedTables['notifications']['Update']

export type SearchHistory = ExtendedTables['search_history']['Row']
export type ProductAnalytics = ExtendedTables['product_analytics']['Row']

export type ChatAgent = ExtendedTables['chat_agents']['Row']
export type ChatConversation = ExtendedTables['chat_conversations']['Row']
export type ChatMessage = ExtendedTables['chat_messages']['Row']

export type VendorPayout = ExtendedTables['vendor_payouts']['Row']

// Original types re-exported for backward compatibility
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type Category = Database['public']['Tables']['categories']['Row']
export type User = Database['public']['Tables']['user_profiles']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type Review = Database['public']['Tables']['reviews']['Row']
export type CartItem = Database['public']['Tables']['cart_items']['Row']

export type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
export type InventoryMovement = Database['public']['Tables']['inventory_movements']['Row']
export type StockAlert = Database['public']['Tables']['stock_alerts']['Row']
export type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row']
export type Warehouse = Database['public']['Tables']['warehouses']['Row']
export type Supplier = Database['public']['Tables']['suppliers']['Row']