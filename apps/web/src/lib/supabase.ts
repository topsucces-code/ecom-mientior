import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fhewhxjprkksjriohxpv.supabase.co'
const supabaseAnonKey = 'sb_publishable_ETUd5-_NuEu06GVBOOoakw_9SUgaD2G'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Product {
  id: string
  name: string
  description: string
  price: number
  compare_at_price?: number
  sku: string
  inventory_quantity: number
  category_id: string
  brand: string
  weight?: number
  dimensions?: string
  images: string[]
  tags: string[]
  status: 'active' | 'inactive' | 'draft'
  featured: boolean
  created_at: string
  updated_at: string
  categories?: {
    id: string
    name: string
  }
}

export interface Category {
  id: string
  name: string
  description?: string
  slug: string
  parent_id?: string
  featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface ProductReview {
  id: string
  product_id: string
  user_id: string
  rating: number
  title?: string
  content?: string
  verified_purchase: boolean
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface Wishlist {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

export interface Promotion {
  id: string
  code: string
  name: string
  description?: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  minimum_order: number
  maximum_discount?: number
  usage_limit?: number
  used_count: number
  valid_from: string
  valid_until: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface ProductAnalytics {
  id: string
  product_id: string
  date: string
  views_count: number
  cart_additions: number
  purchases: number
  revenue: number
  conversion_rate: number
  created_at: string
  updated_at: string
}