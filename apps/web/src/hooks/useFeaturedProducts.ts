'use client'

import { useState, useEffect, useCallback } from 'react'
import { SupabaseProductService, type ProductWithCategory } from '@ecommerce/shared/src/services/supabaseProductService'

type Product = ProductWithCategory

interface UseFeaturedProductsResult {
  products: Product[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useFeaturedProducts(limit: number = 6): UseFeaturedProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await SupabaseProductService.getFeaturedProducts(limit)

      if (result.error) {
        setError(result.error)
        return
      }

      setProducts(result.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [limit])

  const refetch = useCallback(() => {
    return fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    loading,
    error,
    refetch
  }
}

interface UseProductsByCategoryResult {
  products: Product[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useProductsByCategory(
  categoryName: string, 
  limit: number = 4,
  featured?: boolean
): UseProductsByCategoryResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = useCallback(async () => {
    if (!categoryName) {
      setProducts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const filters = {
        featured,
        limit,
        page: 1
      }

      // For category-based filtering, use the existing method
      const result = await SupabaseProductService.getProductsByCategory(categoryName, limit)

      if (result.error) {
        setError(result.error)
        return
      }

      setProducts(result.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [categoryName, limit, featured])

  const refetch = useCallback(() => {
    return fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    loading,
    error,
    refetch
  }
}