'use client'

import { supabase } from './supabase/client'
import { Vendor, VendorProfile, Product, Order } from './supabase/types'

export interface VendorFilters {
  status?: string[]
  verification_status?: string[]
  business_type?: string[]
  location?: string
  metrics?: any
  date_range?: { start_date: string; end_date: string }
}

export interface VendorSearchParams {
  query?: string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  limit?: number
  offset?: number
  filters?: VendorFilters
}

export class VendorService {

  async getVendors(params?: VendorSearchParams): Promise<{
    vendors: Vendor[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const limit = params?.limit || 20
      const offset = params?.offset || 0

      let query = supabase
        .from('vendors')
        .select(`
          *,
          user:users(id, email, profile:user_profiles(*)),
          vendor_profile:vendor_profiles(*)
        `, { count: 'exact' })

      // Apply filters
      if (params?.filters?.status && params.filters.status.length > 0) {
        query = query.in('status', params.filters.status)
      }

      if (params?.filters?.verification_status && params.filters.verification_status.length > 0) {
        query = query.in('verification_status', params.filters.verification_status)
      }

      if (params?.filters?.business_type && params.filters.business_type.length > 0) {
        query = query.in('business_type', params.filters.business_type)
      }

      if (params?.query) {
        query = query.or(`business_name.ilike.%${params.query}%,business_description.ilike.%${params.query}%`)
      }

      // Apply sorting
      if (params?.sort_by) {
        query = query.order(params.sort_by, { ascending: params.sort_direction === 'asc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching vendors:', error)
        throw new Error('Failed to fetch vendors')
      }

      return {
        vendors: data || [],
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      throw error
    }
  }

  async getVendorById(vendorId: string): Promise<Vendor | null> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          user:users(id, email, profile:user_profiles(*)),
          vendor_profile:vendor_profiles(*)
        `)
        .eq('id', vendorId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        console.error('Error fetching vendor:', error)
        throw new Error('Failed to fetch vendor')
      }

      return data
    } catch (error) {
      console.error('Error fetching vendor:', error)
      throw error
    }
  }

  async getVendorByUserId(userId: string): Promise<Vendor | null> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          user:users(id, email, profile:user_profiles(*)),
          vendor_profile:vendor_profiles(*)
        `)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        console.error('Error fetching vendor by user ID:', error)
        throw new Error('Failed to fetch vendor by user ID')
      }

      return data
    } catch (error) {
      console.error('Error fetching vendor by user ID:', error)
      throw error
    }
  }

  async createVendor(vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>): Promise<Vendor> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select(`
          *,
          user:users(id, email, profile:user_profiles(*)),
          vendor_profile:vendor_profiles(*)
        `)
        .single()

      if (error) {
        console.error('Error creating vendor:', error)
        throw new Error('Failed to create vendor')
      }

      return data
    } catch (error) {
      console.error('Error creating vendor:', error)
      throw error
    }
  }

  async updateVendor(vendorId: string, updates: Partial<Vendor>): Promise<Vendor> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', vendorId)
        .select(`
          *,
          user:users(id, email, profile:user_profiles(*)),
          vendor_profile:vendor_profiles(*)
        `)
        .single()

      if (error) {
        console.error('Error updating vendor:', error)
        throw new Error('Failed to update vendor')
      }

      return data
    } catch (error) {
      console.error('Error updating vendor:', error)
      throw error
    }
  }

  async deleteVendor(vendorId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ status: 'inactive' })
        .eq('id', vendorId)

      if (error) {
        console.error('Error deleting vendor:', error)
        throw new Error('Failed to delete vendor')
      }
    } catch (error) {
      console.error('Error deleting vendor:', error)
      throw error
    }
  }

  async approveVendor(vendorId: string, notes?: string): Promise<Vendor> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update({
          status: 'approved',
          verification_status: 'verified',
          approved_at: new Date().toISOString(),
          admin_notes: notes
        })
        .eq('id', vendorId)
        .select(`
          *,
          user:users(id, email, profile:user_profiles(*)),
          vendor_profile:vendor_profiles(*)
        `)
        .single()

      if (error) {
        console.error('Error approving vendor:', error)
        throw new Error('Failed to approve vendor')
      }

      return data
    } catch (error) {
      console.error('Error approving vendor:', error)
      throw error
    }
  }

  async suspendVendor(vendorId: string, reason: string): Promise<Vendor> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update({
          status: 'suspended',
          admin_notes: reason
        })
        .eq('id', vendorId)
        .select(`
          *,
          user:users(id, email, profile:user_profiles(*)),
          vendor_profile:vendor_profiles(*)
        `)
        .single()

      if (error) {
        console.error('Error suspending vendor:', error)
        throw new Error('Failed to suspend vendor')
      }

      return data
    } catch (error) {
      console.error('Error suspending vendor:', error)
      throw error
    }
  }

  async getVendorProducts(vendorId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          images:product_images(*),
          variants:product_variants(*)
        `)
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching vendor products:', error)
        throw new Error('Failed to fetch vendor products')
      }

      return data || []
    } catch (error) {
      console.error('Error fetching vendor products:', error)
      throw error
    }
  }

  async getVendorOrders(vendorId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user:users(id, email, profile:user_profiles(*)),
          order_items:order_items(
            *,
            product:products(name, price, images:product_images(*))
          )
        `)
        .eq('order_items.product.vendor_id', vendorId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching vendor orders:', error)
        throw new Error('Failed to fetch vendor orders')
      }

      return data || []
    } catch (error) {
      console.error('Error fetching vendor orders:', error)
      throw error
    }
  }

  async updateVendorOrder(orderId: string, updates: {
    status?: string
    tracking_number?: string
    shipping_carrier?: string
  }): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        console.error('Error updating vendor order:', error)
        throw new Error('Failed to update vendor order')
      }

      return data
    } catch (error) {
      console.error('Error updating vendor order:', error)
      throw error
    }
  }

  async getVendorStats(vendorId: string): Promise<{
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    averageRating: number
  }> {
    try {
      const [productsCount, ordersData, rating] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('vendor_id', vendorId)
          .eq('is_active', true),
        
        supabase
          .from('order_items')
          .select(`
            quantity,
            price,
            order:orders(status)
          `)
          .eq('product.vendor_id', vendorId)
          .eq('order.status', 'completed'),
          
        supabase
          .from('product_reviews')
          .select('rating')
          .eq('product.vendor_id', vendorId)
      ])

      const totalProducts = productsCount.count || 0
      const totalOrders = ordersData.data?.length || 0
      const totalRevenue = ordersData.data?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0
      const averageRating = rating.data?.length 
        ? rating.data.reduce((sum, review) => sum + review.rating, 0) / rating.data.length 
        : 0

      return {
        totalProducts,
        totalOrders,
        totalRevenue,
        averageRating: Math.round(averageRating * 10) / 10
      }
    } catch (error) {
      console.error('Error fetching vendor stats:', error)
      throw error
    }
  }
}

export const vendorService = new VendorService()