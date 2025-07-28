import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSupabaseAuth } from './useSupabaseAuth'

export function useSupabaseWishlist() {
  const [wishlistItems, setWishlistItems] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useSupabaseAuth()

  // Load wishlist items for authenticated user
  useEffect(() => {
    if (user) {
      loadWishlist()
    } else {
      setWishlistItems([])
    }
  }, [user])

  const loadWishlist = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user.id)

      if (error) throw error

      setWishlistItems(data?.map(item => item.product_id) || [])
    } catch (error) {
      console.error('Error loading wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToWishlist = async (productId: string) => {
    if (!user) {
      // Could show auth modal here
      return false
    }

    try {
      const { error } = await supabase
        .from('wishlists')
        .insert({
          user_id: user.id,
          product_id: productId
        })

      if (error) throw error

      setWishlistItems(prev => [...prev, productId])
      return true
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      return false
    }
  }

  const removeFromWishlist = async (productId: string) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)

      if (error) throw error

      setWishlistItems(prev => prev.filter(id => id !== productId))
      return true
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      return false
    }
  }

  const isInWishlist = (productId: string) => {
    return wishlistItems.includes(productId)
  }

  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId)
    } else {
      return await addToWishlist(productId)
    }
  }

  const getWishlistProducts = async () => {
    if (!user || wishlistItems.length === 0) return []

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .in('id', wishlistItems)
        .eq('status', 'active')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching wishlist products:', error)
      return []
    }
  }

  return {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    getWishlistProducts,
    wishlistCount: wishlistItems.length
  }
}