import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Product = Database['public']['Tables']['products']['Row']

export interface DealOfTheDay {
  id: string
  product: Product
  original_price: number
  deal_price: number
  discount_percentage: number
  starts_at: string
  ends_at: string
  quantity_available?: number
  quantity_sold?: number
  is_active: boolean
  created_at: string
}

export interface CreateDealData {
  product_id: string
  original_price: number
  deal_price: number
  starts_at: string
  ends_at: string
  quantity_available?: number
}

export interface DealStats {
  total_deals: number
  active_deals: number
  expired_deals: number
  total_savings: number
  average_discount: number
}

class DealServiceClass {
  // Get today's deal of the day
  async getTodaysDeal() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: deals, error } = await supabase
        .from('deals_of_the_day')
        .select(`
          *,
          product:products (
            id,
            name,
            description,
            price,
            images,
            category_id,
            brand,
            inventory_quantity,
            status,
            featured
          )
        `)
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .gte('ends_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error fetching today\'s deal:', error)
        return { data: null, error }
      }

      return { data: deals?.[0] || null, error: null }
    } catch (error) {
      console.error('Error in getTodaysDeal:', error)
      return { data: null, error: error as Error }
    }
  }

  // Get all active deals
  async getActiveDeals(limit: number = 10) {
    try {
      const { data: deals, error } = await supabase
        .from('deals_of_the_day')
        .select(`
          *,
          product:products (
            id,
            name,
            description,
            price,
            images,
            category_id,
            brand,
            inventory_quantity,
            status,
            featured
          )
        `)
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .gte('ends_at', new Date().toISOString())
        .order('discount_percentage', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching active deals:', error)
        return { data: [], error }
      }

      return { data: deals || [], error: null }
    } catch (error) {
      console.error('Error in getActiveDeals:', error)
      return { data: [], error: error as Error }
    }
  }

  // Get deals by category
  async getDealsByCategory(categoryId: string, limit: number = 6) {
    try {
      const { data: deals, error } = await supabase
        .from('deals_of_the_day')
        .select(`
          *,
          product:products!inner (
            id,
            name,
            description,
            price,
            images,
            category_id,
            brand,
            inventory_quantity,
            status,
            featured
          )
        `)
        .eq('is_active', true)
        .eq('product.category_id', categoryId)
        .lte('starts_at', new Date().toISOString())
        .gte('ends_at', new Date().toISOString())
        .order('discount_percentage', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching deals by category:', error)
        return { data: [], error }
      }

      return { data: deals || [], error: null }
    } catch (error) {
      console.error('Error in getDealsByCategory:', error)
      return { data: [], error: error as Error }
    }
  }

  // Create a new deal (admin function)
  async createDeal(dealData: CreateDealData) {
    try {
      const discount_percentage = Math.round(
        ((dealData.original_price - dealData.deal_price) / dealData.original_price) * 100
      )

      const { data: deal, error } = await supabase
        .from('deals_of_the_day')
        .insert({
          ...dealData,
          discount_percentage,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating deal:', error)
        return { data: null, error }
      }

      return { data: deal, error: null }
    } catch (error) {
      console.error('Error in createDeal:', error)
      return { data: null, error: error as Error }
    }
  }

  // Update deal
  async updateDeal(dealId: string, updates: Partial<CreateDealData & { is_active: boolean }>) {
    try {
      let updateData: any = { ...updates }

      // Recalculate discount percentage if prices changed
      if (updates.original_price && updates.deal_price) {
        updateData.discount_percentage = Math.round(
          ((updates.original_price - updates.deal_price) / updates.original_price) * 100
        )
      }

      const { data: deal, error } = await supabase
        .from('deals_of_the_day')
        .update(updateData)
        .eq('id', dealId)
        .select()
        .single()

      if (error) {
        console.error('Error updating deal:', error)
        return { data: null, error }
      }

      return { data: deal, error: null }
    } catch (error) {
      console.error('Error in updateDeal:', error)
      return { data: null, error: error as Error }
    }
  }

  // Get deal stats for admin dashboard
  async getDealStats(): Promise<{ data: DealStats | null; error: Error | null }> {
    try {
      const { data: deals, error } = await supabase
        .from('deals_of_the_day')
        .select('*')

      if (error) {
        console.error('Error fetching deal stats:', error)
        return { data: null, error }
      }

      const now = new Date().toISOString()
      const activeDeals = deals.filter(deal => 
        deal.is_active && 
        deal.starts_at <= now && 
        deal.ends_at >= now
      )
      const expiredDeals = deals.filter(deal => deal.ends_at < now)

      const totalSavings = deals.reduce((sum, deal) => {
        const savings = (deal.quantity_sold || 0) * (deal.original_price - deal.deal_price)
        return sum + savings
      }, 0)

      const averageDiscount = deals.length > 0 
        ? deals.reduce((sum, deal) => sum + deal.discount_percentage, 0) / deals.length
        : 0

      const stats: DealStats = {
        total_deals: deals.length,
        active_deals: activeDeals.length,
        expired_deals: expiredDeals.length,
        total_savings: totalSavings,
        average_discount: Math.round(averageDiscount)
      }

      return { data: stats, error: null }
    } catch (error) {
      console.error('Error in getDealStats:', error)
      return { data: null, error: error as Error }
    }
  }

  // Check if a product is on deal
  async isProductOnDeal(productId: string) {
    try {
      const { data: deal, error } = await supabase
        .from('deals_of_the_day')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .gte('ends_at', new Date().toISOString())
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking product deal:', error)
        return { data: null, error }
      }

      return { data: deal || null, error: null }
    } catch (error) {
      console.error('Error in isProductOnDeal:', error)
      return { data: null, error: error as Error }
    }
  }

  // Get time remaining for a deal
  getTimeRemaining(endDate: string) {
    const now = new Date().getTime()
    const end = new Date(endDate).getTime()
    const timeLeft = end - now

    if (timeLeft <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, expired: true }
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

    return { hours, minutes, seconds, expired: false }
  }

  // Format countdown display
  formatCountdown(endDate: string): string {
    const { hours, minutes, expired } = this.getTimeRemaining(endDate)
    
    if (expired) {
      return 'Deal Expired'
    }

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return `${days}d ${remainingHours}h ${minutes}m`
    }

    return `${hours}h ${minutes}m`
  }
}

export const DealService = new DealServiceClass()
export default DealService