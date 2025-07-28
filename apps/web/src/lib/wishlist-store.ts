import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@ecommerce/shared'

interface WishlistItem {
  id: string
  name: string
  price: number
  image: string
  addedAt: Date
}

interface WishlistStore {
  items: WishlistItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
  getItemCount: () => number
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product: Product) => {
        const { items } = get()
        if (!items.find(item => item.id === product.id)) {
          const wishlistItem: WishlistItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0] || '',
            addedAt: new Date()
          }
          set({ items: [...items, wishlistItem] })
        }
      },
      
      removeItem: (productId: string) => {
        set(state => ({
          items: state.items.filter(item => item.id !== productId)
        }))
      },
      
      isInWishlist: (productId: string) => {
        return get().items.some(item => item.id === productId)
      },
      
      clearWishlist: () => {
        set({ items: [] })
      },
      
      getItemCount: () => {
        return get().items.length
      }
    }),
    {
      name: 'wishlist-storage',
    }
  )
)