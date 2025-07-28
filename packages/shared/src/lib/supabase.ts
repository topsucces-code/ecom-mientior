import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import type { ExtendedDatabase } from '../types/database-extended'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Main client with extended types for all new features
export const supabase = createClient<ExtendedDatabase>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-my-custom-header': 'ecommerce-platform'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Convenience client for backward compatibility with basic types
export const supabaseBasic = createClient<Database>(supabaseUrl, supabaseAnonKey)

export type SupabaseClient = typeof supabase
export type ExtendedSupabaseClient = typeof supabase

// Authentication helpers
export const auth = supabase.auth

// Storage helpers for product images, user avatars, etc.
export const storage = supabase.storage

// Real-time helpers for notifications and live updates
export const realtime = supabase.realtime

// Database helpers
export const db = supabase

// Database functions with proper typing
export const functions = {
  getPaymentAnalytics: (dateFrom: string, dateTo: string) =>
    supabase.rpc('get_payment_analytics', { date_from: dateFrom, date_to: dateTo }),
  
  getInventoryMetrics: (warehouseId?: string) =>
    supabase.rpc('get_inventory_metrics', { warehouse_id: warehouseId }),
  
  getSearchAnalytics: (dateFrom: string, dateTo: string) =>
    supabase.rpc('get_search_analytics', { date_from: dateFrom, date_to: dateTo }),
  
  checkStockAlerts: (warehouseId?: string) =>
    supabase.rpc('check_stock_alerts', { warehouse_id: warehouseId }),
  
  applyCoupon: (couponCode: string, userId: string, cartTotal: number, cartItems: any[]) =>
    supabase.rpc('apply_coupon', { 
      coupon_code: couponCode, 
      user_id: userId, 
      cart_total: cartTotal, 
      cart_items: cartItems 
    }),
  
  getPersonalizedRecommendations: (userId: string, limit?: number, category?: string) =>
    supabase.rpc('get_personalized_recommendations', { 
      user_id: userId, 
      limit: limit, 
      category: category 
    })
}