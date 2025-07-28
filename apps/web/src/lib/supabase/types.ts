export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Additional types for the application
export type Product = Database['public']['Tables']['products']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']

// Legacy types for compatibility
export interface ProductImage {
  id: string
  url: string
  alt_text?: string
  sort_order?: number
}

export interface ProductVariant {
  id: string
  name: string
  value: string
  price_adjustment?: number
  stock_quantity?: number
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          addresses: Json | null
          role: 'customer' | 'vendor' | 'agent' | 'admin'
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          addresses?: Json | null
          role?: 'customer' | 'vendor' | 'agent' | 'admin'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          addresses?: Json | null
          role?: 'customer' | 'vendor' | 'agent' | 'admin'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          slug: string
          image_url: string | null
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          slug: string
          image_url?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          slug?: string
          image_url?: string | null
          parent_id?: string | null
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
          compare_at_price: number | null
          sku: string
          inventory_quantity: number
          category_id: string | null
          brand: string | null
          weight: number | null
          dimensions: string | null
          images: Json
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
          compare_at_price?: number | null
          sku: string
          inventory_quantity?: number
          category_id?: string | null
          brand?: string | null
          weight?: number | null
          dimensions?: string | null
          images?: Json
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
          compare_at_price?: number | null
          sku?: string
          inventory_quantity?: number
          category_id?: string | null
          brand?: string | null
          weight?: number | null
          dimensions?: string | null
          images?: Json
          tags?: string[]
          status?: 'active' | 'draft' | 'archived'
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          user_id: string
          business_name: string
          business_type: 'individual' | 'business' | 'corporation'
          description: string
          logo_url: string | null
          banner_url: string | null
          contact_info: Json
          business_address: Json | null
          verification_status: 'pending' | 'verified' | 'rejected'
          status: 'active' | 'inactive' | 'suspended' | 'pending'
          commission_rate: number
          total_sales: number
          rating: number
          review_count: number
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          business_type: 'individual' | 'business' | 'corporation'
          description: string
          logo_url?: string | null
          banner_url?: string | null
          contact_info?: Json
          business_address?: Json | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          status?: 'active' | 'inactive' | 'suspended' | 'pending'
          commission_rate?: number
          total_sales?: number
          rating?: number
          review_count?: number
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          business_type?: 'individual' | 'business' | 'corporation'
          description?: string
          logo_url?: string | null
          banner_url?: string | null
          contact_info?: Json
          business_address?: Json | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          status?: 'active' | 'inactive' | 'suspended' | 'pending'
          commission_rate?: number
          total_sales?: number
          rating?: number
          review_count?: number
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          total_amount: number
          tax_amount: number
          shipping_amount: number
          discount_amount: number
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method: string | null
          shipping_address: Json
          billing_address: Json
          tracking_number: string | null
          notes: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          total_amount: number
          tax_amount?: number
          shipping_amount?: number
          discount_amount?: number
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method?: string | null
          shipping_address: Json
          billing_address: Json
          tracking_number?: string | null
          notes?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          total_amount?: number
          tax_amount?: number
          shipping_amount?: number
          discount_amount?: number
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method?: string | null
          shipping_address?: Json
          billing_address?: Json
          tracking_number?: string | null
          notes?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          vendor_id: string | null
          quantity: number
          unit_price: number
          total_price: number
          product_snapshot: Json
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          vendor_id?: string | null
          quantity: number
          unit_price: number
          total_price: number
          product_snapshot: Json
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          vendor_id?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          product_snapshot?: Json
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          customer_id: string
          rating: number
          title: string | null
          comment: string | null
          images: Json | null
          verified_purchase: boolean
          helpful_count: number
          reported_count: number
          status: 'published' | 'pending' | 'hidden'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          customer_id: string
          rating: number
          title?: string | null
          comment?: string | null
          images?: Json | null
          verified_purchase?: boolean
          helpful_count?: number
          reported_count?: number
          status?: 'published' | 'pending' | 'hidden'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          customer_id?: string
          rating?: number
          title?: string | null
          comment?: string | null
          images?: Json | null
          verified_purchase?: boolean
          helpful_count?: number
          reported_count?: number
          status?: 'published' | 'pending' | 'hidden'
          created_at?: string
          updated_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          product_id: string
          vendor_id: string | null
          quantity_available: number
          quantity_reserved: number
          reorder_point: number
          reorder_quantity: number
          unit_cost: number
          location: string | null
          last_restocked: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          vendor_id?: string | null
          quantity_available: number
          quantity_reserved?: number
          reorder_point?: number
          reorder_quantity?: number
          unit_cost?: number
          location?: string | null
          last_restocked?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          vendor_id?: string | null
          quantity_available?: number
          quantity_reserved?: number
          reorder_point?: number
          reorder_quantity?: number
          unit_cost?: number
          location?: string | null
          last_restocked?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_conversations: {
        Row: {
          id: string
          customer_id: string
          agent_id: string | null
          status: 'open' | 'assigned' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          category: 'general' | 'order_support' | 'technical' | 'billing' | 'product_inquiry'
          subject: string | null
          tags: string[]
          customer_info: Json
          agent_info: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
          last_message_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          agent_id?: string | null
          status?: 'open' | 'assigned' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          category: 'general' | 'order_support' | 'technical' | 'billing' | 'product_inquiry'
          subject?: string | null
          tags?: string[]
          customer_info: Json
          agent_info?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          last_message_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          agent_id?: string | null
          status?: 'open' | 'assigned' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          category?: 'general' | 'order_support' | 'technical' | 'billing' | 'product_inquiry'
          subject?: string | null
          tags?: string[]
          customer_info?: Json
          agent_info?: Json | null
          metadata?: Json | null
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
          metadata: Json | null
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
          metadata?: Json | null
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
          metadata?: Json | null
          read_by?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      chat_agents: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          avatar: string | null
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
          avatar?: string | null
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
          avatar?: string | null
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
      commissions: {
        Row: {
          id: string
          vendor_id: string
          order_id: string
          order_item_id: string
          commission_rate: number
          commission_amount: number
          base_amount: number
          commission_type: 'percentage' | 'fixed' | 'tiered'
          status: 'pending' | 'approved' | 'paid' | 'disputed'
          payment_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          order_id: string
          order_item_id: string
          commission_rate: number
          commission_amount: number
          base_amount: number
          commission_type: 'percentage' | 'fixed' | 'tiered'
          status?: 'pending' | 'approved' | 'paid' | 'disputed'
          payment_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          order_id?: string
          order_item_id?: string
          commission_rate?: number
          commission_amount?: number
          base_amount?: number
          commission_type?: 'percentage' | 'fixed' | 'tiered'
          status?: 'pending' | 'approved' | 'paid' | 'disputed'
          payment_date?: string | null
          notes?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}