import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '@ecommerce/shared'
import type { Product } from '@ecommerce/shared'

interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  loading: boolean
  
  // Pricing calculations
  shippingCost: number
  taxRate: number
  discountAmount: number
  
  // Actions
  addItem: (item: CartItem | Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  increaseQuantity: (productId: string) => void
  decreaseQuantity: (productId: string) => void
  clearCart: () => void
  toggleCart: () => void
  
  // Discount and shipping
  applyDiscount: (amount: number) => void
  removeDiscount: () => void
  setShippingCost: (cost: number) => void
  applyCouponDiscount: (amount: number) => void
  
  // Computed values (will be calculated in selectors)
  getItemCount: () => number
  getSubtotal: () => number
  getTax: () => number
  getShipping: () => number
  getDiscount: () => number
  getTotal: () => number
  isEmpty: () => boolean
  
  // Item utilities
  isInCart: (productId: string) => boolean
  getItemQuantity: (productId: string) => number
  
  // Async actions
  syncWithDatabase: () => Promise<void>
  loadFromDatabase: () => Promise<void>
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      loading: false,
      
      // Pricing defaults
      shippingCost: 9.99, // Default shipping cost
      taxRate: 0.08, // 8% tax
      discountAmount: 0,
      
      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      
      getSubtotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },
      
      getTax: () => {
        const subtotal = get().getSubtotal()
        return subtotal * get().taxRate
      },
      
      getShipping: () => {
        const subtotal = get().getSubtotal()
        // Free shipping over $50
        return subtotal >= 50 ? 0 : get().shippingCost
      },
      
      getDiscount: () => {
        return get().discountAmount
      },
      
      getTotal: () => {
        const subtotal = get().getSubtotal()
        const tax = get().getTax()
        const shipping = get().getShipping()
        const discount = get().getDiscount()
        return Math.max(0, subtotal + tax + shipping - discount)
      },
      
      isEmpty: () => {
        return get().items.length === 0
      },
      
      isInCart: (productId: string) => {
        return get().items.some(item => item.id === productId)
      },
      
      getItemQuantity: (productId: string) => {
        const item = get().items.find(item => item.id === productId)
        return item ? item.quantity : 0
      },
  
  addItem: (item: CartItem | Product, quantity = 1) => {
    set((state) => {
      // Convert Product to CartItem if needed
      const cartItem: CartItem = 'name' in item && 'price' in item && 'image' in item
        ? item as CartItem
        : {
            id: item.id,
            name: (item as Product).name,
            price: (item as Product).price,
            image: (item as Product).images?.[0] || '',
            quantity
          }
      
      const existingItem = state.items.find(existing => existing.id === cartItem.id)
      
      if (existingItem) {
        return {
          items: state.items.map(existing =>
            existing.id === cartItem.id
              ? { ...existing, quantity: existing.quantity + quantity }
              : existing
          )
        }
      } else {
        return {
          items: [...state.items, cartItem]
        }
      }
    })
    
    // Sync with database if user is logged in
    get().syncWithDatabase()
  },
      
  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter(item => item.id !== productId)
    }))
    
    get().syncWithDatabase()
  },
  
  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    
    set((state) => ({
      items: state.items.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    }))
    
    get().syncWithDatabase()
  },
  
  increaseQuantity: (productId: string) => {
    const currentQuantity = get().getItemQuantity(productId)
    if (currentQuantity > 0) {
      get().updateQuantity(productId, currentQuantity + 1)
    }
  },
  
  decreaseQuantity: (productId: string) => {
    const currentQuantity = get().getItemQuantity(productId)
    if (currentQuantity > 1) {
      get().updateQuantity(productId, currentQuantity - 1)
    } else if (currentQuantity === 1) {
      get().removeItem(productId)
    }
  },
  
  clearCart: () => {
    set({ items: [] })
    get().syncWithDatabase()
  },
  
  toggleCart: () => {
    set((state) => ({ isOpen: !state.isOpen }))
  },
  
  applyDiscount: (amount: number) => {
    set({ discountAmount: Math.max(0, amount) })
  },
  
  removeDiscount: () => {
    set({ discountAmount: 0 })
  },
  
  setShippingCost: (cost: number) => {
    set({ shippingCost: Math.max(0, cost) })
  },

  applyCouponDiscount: (amount: number) => {
    set({ discountAmount: Math.max(0, amount) })
  },
      
  syncWithDatabase: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { items } = get()
      
      // Clear existing cart items
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
      
      // Insert new cart items
      if (items.length > 0) {
        const cartItems = items.map(item => ({
          user_id: user.id,
          product_id: item.id,
          quantity: item.quantity
        }))
        
        await supabase
          .from('cart_items')
          .insert(cartItems)
      }
    } catch (error) {
      console.error('Failed to sync cart with database:', error)
    }
  },
  
  loadFromDatabase: async () => {
    try {
      set({ loading: true })
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ loading: false })
        return
      }
      
      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      if (cartItems) {
        const items: CartItem[] = cartItems.map(item => ({
          id: item.product_id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.images?.[0] || '',
          quantity: item.quantity
        }))
        
        set({ items })
      }
    } catch (error) {
      console.error('Failed to load cart from database:', error)
    } finally {
      set({ loading: false })
    }
  }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        shippingCost: state.shippingCost,
        taxRate: state.taxRate,
        discountAmount: state.discountAmount
      })
    }
  )
)

// Selectors for computed values
export const useCartItemCount = () => useCartStore(state => state.getItemCount())
export const useCartSubtotal = () => useCartStore(state => state.getSubtotal())
export const useCartTax = () => useCartStore(state => state.getTax())
export const useCartShipping = () => useCartStore(state => state.getShipping())
export const useCartDiscount = () => useCartStore(state => state.getDiscount())
export const useCartTotal = () => useCartStore(state => state.getTotal())
export const useCartIsEmpty = () => useCartStore(state => state.isEmpty())