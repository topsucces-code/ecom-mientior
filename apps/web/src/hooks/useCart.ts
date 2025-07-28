'use client'

import { useState, useEffect, useCallback } from 'react'
import { CartService, CartItem, CartSummary } from '@ecommerce/shared/src/services/cartService'
import { useAuth } from './useAuth'

interface UseCartResult {
  cart: CartSummary | null
  loading: boolean
  error: Error | null
  addToCart: (productId: string, quantity?: number) => Promise<void>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  removeFromCart: (cartItemId: string) => Promise<void>
  clearCart: () => Promise<void>
  moveToWishlist: (cartItemId: string) => Promise<void>
  isInCart: (productId: string) => Promise<{ inCart: boolean; quantity: number }>
  refetch: () => Promise<void>
}

export function useCart(): UseCartResult {
  const { user } = useAuth()
  const [cart, setCart] = useState<CartSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCart = useCallback(async () => {
    if (!user?.id) {
      setCart(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await CartService.getCart(user.id)

      if (result.error) {
        setError(result.error)
        return
      }

      setCart(result.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const addToCart = useCallback(async (productId: string, quantity: number = 1) => {
    if (!user?.id) {
      throw new Error('User must be logged in to add items to cart')
    }

    try {
      setError(null)
      const result = await CartService.addToCart(user.id, productId, quantity)

      if (result.error) {
        setError(result.error)
        throw result.error
      }

      // Refetch cart to get updated data
      await fetchCart()
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [user?.id, fetchCart])

  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    try {
      setError(null)
      const result = await CartService.updateCartItemQuantity(cartItemId, quantity)

      if (result.error) {
        setError(result.error)
        throw result.error
      }

      // Refetch cart to get updated data
      await fetchCart()
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [fetchCart])

  const removeFromCart = useCallback(async (cartItemId: string) => {
    try {
      setError(null)
      const result = await CartService.removeFromCart(cartItemId)

      if (result.error) {
        setError(result.error)
        throw result.error
      }

      // Refetch cart to get updated data
      await fetchCart()
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [fetchCart])

  const clearCart = useCallback(async () => {
    if (!user?.id) {
      throw new Error('User must be logged in')
    }

    try {
      setError(null)
      const result = await CartService.clearCart(user.id)

      if (result.error) {
        setError(result.error)
        throw result.error
      }

      // Update local state immediately
      setCart(null)
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [user?.id])

  const moveToWishlist = useCallback(async (cartItemId: string) => {
    if (!user?.id) {
      throw new Error('User must be logged in')
    }

    try {
      setError(null)
      const result = await CartService.moveToWishlist(user.id, cartItemId)

      if (result.error) {
        setError(result.error)
        throw result.error
      }

      // Refetch cart to get updated data
      await fetchCart()
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [user?.id, fetchCart])

  const isInCart = useCallback(async (productId: string) => {
    if (!user?.id) {
      return { inCart: false, quantity: 0 }
    }

    try {
      const result = await CartService.isInCart(user.id, productId)
      return result.data
    } catch (err) {
      return { inCart: false, quantity: 0 }
    }
  }, [user?.id])

  const refetch = useCallback(() => {
    return fetchCart()
  }, [fetchCart])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  return {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    moveToWishlist,
    isInCart,
    refetch
  }
}

interface UseCartCountResult {
  count: number
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCartCount(): UseCartCountResult {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCount = useCallback(async () => {
    if (!user?.id) {
      setCount(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await CartService.getCartCount(user.id)

      if (result.error) {
        setError(result.error)
        return
      }

      setCount(result.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  return {
    count,
    loading,
    error,
    refetch: fetchCount
  }
}

interface UseCartWithFeesResult {
  cart: any | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCartWithFees(
  userLocation?: string,
  taxRate?: number
): UseCartWithFeesResult {
  const { user } = useAuth()
  const [cart, setCart] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCartWithFees = useCallback(async () => {
    if (!user?.id) {
      setCart(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await CartService.getCartSummaryWithFees(
        user.id,
        userLocation,
        taxRate
      )

      if (result.error) {
        setError(result.error)
        return
      }

      setCart(result.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, userLocation, taxRate])

  useEffect(() => {
    fetchCartWithFees()
  }, [fetchCartWithFees])

  return {
    cart,
    loading,
    error,
    refetch: fetchCartWithFees
  }
}

interface UseCartItemResult {
  inCart: boolean
  quantity: number
  loading: boolean
  addToCart: (quantity?: number) => Promise<void>
  removeFromCart: () => Promise<void>
  updateQuantity: (quantity: number) => Promise<void>
}

export function useCartItem(productId: string): UseCartItemResult {
  const { user } = useAuth()
  const [inCart, setInCart] = useState(false)
  const [quantity, setQuantity] = useState(0)
  const [loading, setLoading] = useState(false)

  const checkCartStatus = useCallback(async () => {
    if (!user?.id || !productId) {
      setInCart(false)
      setQuantity(0)
      return
    }

    try {
      const result = await CartService.isInCart(user.id, productId)
      setInCart(result.data.inCart)
      setQuantity(result.data.quantity)
    } catch (err) {
      setInCart(false)
      setQuantity(0)
    }
  }, [user?.id, productId])

  const addToCart = useCallback(async (qty: number = 1) => {
    if (!user?.id) {
      throw new Error('User must be logged in')
    }

    try {
      setLoading(true)
      await CartService.addToCart(user.id, productId, qty)
      await checkCartStatus()
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }, [user?.id, productId, checkCartStatus])

  const removeFromCart = useCallback(async () => {
    if (!user?.id) {
      throw new Error('User must be logged in')
    }

    try {
      setLoading(true)
      // First get cart item ID
      const cart = await CartService.getCart(user.id)
      const cartItem = cart.data?.items.find(item => item.product_id === productId)
      
      if (cartItem) {
        await CartService.removeFromCart(cartItem.id)
        await checkCartStatus()
      }
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }, [user?.id, productId, checkCartStatus])

  const updateQuantity = useCallback(async (qty: number) => {
    if (!user?.id) {
      throw new Error('User must be logged in')
    }

    try {
      setLoading(true)
      // First get cart item ID
      const cart = await CartService.getCart(user.id)
      const cartItem = cart.data?.items.find(item => item.product_id === productId)
      
      if (cartItem) {
        await CartService.updateCartItemQuantity(cartItem.id, qty)
        await checkCartStatus()
      }
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }, [user?.id, productId, checkCartStatus])

  useEffect(() => {
    checkCartStatus()
  }, [checkCartStatus])

  return {
    inCart,
    quantity,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity
  }
}