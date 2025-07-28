import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, functions } from '@ecommerce/shared'
import type { Coupon, CouponInsert, CouponUpdate } from '@ecommerce/shared'

export interface CouponUsage {
  id: string
  couponId: string
  userId: string
  orderId: string
  discountAmount: number
  usedAt: string
}

interface CouponStore {
  // State
  coupons: Coupon[]
  availableCoupons: Coupon[]
  appliedCoupon: Coupon | null
  discountAmount: number
  loading: boolean
  error: string | null

  // Actions
  fetchCoupons: () => Promise<void>
  fetchAvailableCoupons: (userId?: string) => Promise<void>
  validateCoupon: (code: string, cartItems: any[], userId?: string) => Promise<boolean>
  applyCoupon: (code: string, cartItems: any[], userId?: string) => Promise<void>
  removeCoupon: () => void
  calculateDiscount: (coupon: Coupon, cartItems: any[]) => number
  createCoupon: (coupon: CouponInsert) => Promise<void>
  updateCoupon: (id: string, updates: Partial<Coupon>) => Promise<void>
  deleteCoupon: (id: string) => Promise<void>
  getCouponUsage: (couponId: string) => Promise<CouponUsage[]>
}

// Supabase API functions
const fetchCoupons = async (): Promise<Coupon[]> => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

const validateCoupon = async (code: string, cartItems: any[], userId?: string): Promise<boolean> => {
  try {
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    
    const { data, error } = await functions.applyCoupon(code, userId || '', cartTotal, cartItems)
    
    if (error) throw new Error(error.message)
    return data?.[0]?.valid || false
  } catch (error) {
    return false
  }
}

export const useCouponStore = create<CouponStore>()(
  persist(
    (set, get) => ({
      // Initial state
      coupons: [],
      availableCoupons: [],
      appliedCoupon: null,
      discountAmount: 0,
      loading: false,
      error: null,

      // Fetch all coupons (admin)
      fetchCoupons: async () => {
        set({ loading: true, error: null })
        try {
          const coupons = await fetchCoupons()
          set({ coupons, loading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch coupons',
            loading: false 
          })
        }
      },

      // Fetch available coupons for user
      fetchAvailableCoupons: async (userId?: string) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('is_active', true)
            .lte('valid_from', new Date().toISOString())
            .gte('valid_to', new Date().toISOString())
            .or('usage_limit.is.null,usage_count.lt.usage_limit')

          if (error) throw new Error(error.message)
          
          set({ availableCoupons: data || [], loading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch available coupons',
            loading: false 
          })
        }
      },

      // Validate coupon
      validateCoupon: async (code: string, cartItems: any[], userId?: string) => {
        try {
          return await validateCoupon(code, cartItems, userId)
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to validate coupon' })
          return false
        }
      },

      // Apply coupon
      applyCoupon: async (code: string, cartItems: any[], userId?: string) => {
        set({ loading: true, error: null })
        try {
          const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          
          const { data, error } = await functions.applyCoupon(code, userId || '', cartTotal, cartItems)
          
          if (error) throw new Error(error.message)
          
          const result = data?.[0]
          if (!result?.valid) {
            set({ 
              error: result?.error_message || 'Invalid coupon code or coupon cannot be applied to current cart',
              loading: false 
            })
            return
          }

          // Fetch the coupon details
          const { data: couponData, error: couponError } = await supabase
            .from('coupons')
            .select('*')
            .eq('id', result.coupon_id)
            .single()

          if (couponError) throw new Error(couponError.message)
          
          if (couponData) {
            set({ 
              appliedCoupon: couponData,
              discountAmount: result.discount_amount,
              loading: false,
              error: null
            })
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to apply coupon',
            loading: false 
          })
        }
      },

      // Remove applied coupon
      removeCoupon: () => {
        set({ 
          appliedCoupon: null,
          discountAmount: 0,
          error: null
        })
      },

      // Calculate discount amount
      calculateDiscount: (coupon: Coupon, cartItems: any[]) => {
        let eligibleItems = cartItems

        // Filter by category if specified
        if (coupon.categories && coupon.categories.length > 0) {
          eligibleItems = cartItems.filter(item => 
            coupon.categories!.includes(item.category?.toLowerCase())
          )
        }

        // Filter by product if specified
        if (coupon.products && coupon.products.length > 0) {
          eligibleItems = cartItems.filter(item => 
            coupon.products!.includes(item.id)
          )
        }

        const eligibleTotal = eligibleItems.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        )

        let discount = 0

        switch (coupon.type) {
          case 'percentage':
            discount = eligibleTotal * (coupon.value / 100)
            if (coupon.maximumDiscountAmount) {
              discount = Math.min(discount, coupon.maximumDiscountAmount)
            }
            break
          
          case 'fixed':
            discount = coupon.value
            // Don't exceed the eligible total
            discount = Math.min(discount, eligibleTotal)
            break
          
          case 'free_shipping':
            // This would be handled differently in the shipping calculation
            discount = 0
            break
        }

        return Math.max(0, discount)
      },

      // Create new coupon (admin)
      createCoupon: async (couponData) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase
            .from('coupons')
            .insert(couponData)
            .select()
            .single()

          if (error) throw new Error(error.message)

          set(state => ({ 
            coupons: [...state.coupons, data],
            loading: false 
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create coupon',
            loading: false 
          })
        }
      },

      // Update coupon (admin)
      updateCoupon: async (id: string, updates) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase
            .from('coupons')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

          if (error) throw new Error(error.message)

          set(state => ({
            coupons: state.coupons.map(coupon =>
              coupon.id === id ? data : coupon
            ),
            loading: false
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update coupon',
            loading: false 
          })
        }
      },

      // Delete coupon (admin)
      deleteCoupon: async (id: string) => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id)

          if (error) throw new Error(error.message)

          set(state => ({
            coupons: state.coupons.filter(coupon => coupon.id !== id),
            loading: false
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete coupon',
            loading: false 
          })
        }
      },

      // Get coupon usage statistics
      getCouponUsage: async (couponId: string) => {
        try {
          const { data, error } = await supabase
            .from('coupon_usage')
            .select('*')
            .eq('coupon_id', couponId)
            .order('used_at', { ascending: false })

          if (error) throw new Error(error.message)
          return data || []
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch coupon usage' })
          return []
        }
      }
    }),
    {
      name: 'coupon-store',
      partialize: (state) => ({
        appliedCoupon: state.appliedCoupon,
        discountAmount: state.discountAmount
      })
    }
  )
)