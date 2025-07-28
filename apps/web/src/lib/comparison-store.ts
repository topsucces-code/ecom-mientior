import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from './supabase'

interface ComparisonItem {
  id: string
  name: string
  price: number
  image: string
  brand?: string
  featured: boolean
  addedAt: Date
}

interface ComparisonStore {
  items: ComparisonItem[]
  maxItems: number
  addItem: (product: Product) => boolean
  removeItem: (productId: string) => void
  isInComparison: (productId: string) => boolean
  clearComparison: () => void
  getItemCount: () => number
  canAddMore: () => boolean
}

export const useComparisonStore = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      items: [],
      maxItems: 4, // Maximum 4 products for comparison
      
      addItem: (product: Product) => {
        const { items, maxItems } = get()
        
        // Check if already in comparison
        if (items.find(item => item.id === product.id)) {
          return false
        }
        
        // Check if we've reached the maximum
        if (items.length >= maxItems) {
          return false
        }
        
        const comparisonItem: ComparisonItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          image: (product.images && product.images.length > 0) ? product.images[0] : '',
          brand: product.brand || '',
          featured: product.featured,
          addedAt: new Date()
        }
        
        set({ items: [...items, comparisonItem] })
        return true
      },
      
      removeItem: (productId: string) => {
        set(state => ({
          items: state.items.filter(item => item.id !== productId)
        }))
      },
      
      isInComparison: (productId: string) => {
        return get().items.some(item => item.id === productId)
      },
      
      clearComparison: () => {
        set({ items: [] })
      },
      
      getItemCount: () => {
        return get().items.length
      },
      
      canAddMore: () => {
        const { items, maxItems } = get()
        return items.length < maxItems
      }
    }),
    {
      name: 'comparison-storage',
    }
  )
)