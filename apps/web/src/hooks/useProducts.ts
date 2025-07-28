'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProductService, Product, ProductFilter, ProductSort } from '@ecommerce/shared/src/services/productService'

interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: Error | null
  totalPages: number
  currentPage: number
  totalCount: number
  fetchProducts: (
    filter?: ProductFilter,
    sort?: ProductSort,
    page?: number
  ) => Promise<void>
  refetch: () => Promise<void>
}

export function useProducts(
  initialFilter: ProductFilter = {},
  initialSort: ProductSort = { field: 'created_at', direction: 'desc' },
  initialPage: number = 1,
  limit: number = 20
): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalCount, setTotalCount] = useState(0)
  const [currentFilter, setCurrentFilter] = useState(initialFilter)
  const [currentSort, setCurrentSort] = useState(initialSort)

  const fetchProducts = useCallback(async (
    filter: ProductFilter = currentFilter,
    sort: ProductSort = currentSort,
    page: number = currentPage
  ) => {
    try {
      setLoading(true)
      setError(null)

      const result = await ProductService.getProducts(filter, sort, page, limit)

      if (result.error) {
        setError(result.error)
        return
      }

      setProducts(result.data)
      setTotalPages(result.totalPages)
      setCurrentPage(page)
      setTotalCount(result.count)
      setCurrentFilter(filter)
      setCurrentSort(sort)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [currentFilter, currentSort, currentPage, limit])

  const refetch = useCallback(() => {
    return fetchProducts(currentFilter, currentSort, currentPage)
  }, [fetchProducts, currentFilter, currentSort, currentPage])

  useEffect(() => {
    fetchProducts()
  }, [])

  return {
    products,
    loading,
    error,
    totalPages,
    currentPage,
    totalCount,
    fetchProducts,
    refetch
  }
}

interface UseProductResult {
  product: Product | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useProduct(productId: string | null): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setProduct(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await ProductService.getProductById(productId)

      if (result.error) {
        setError(result.error)
        return
      }

      setProduct(result.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  return {
    product,
    loading,
    error,
    refetch: fetchProduct
  }
}

interface UseFeaturedProductsResult {
  products: Product[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useFeaturedProducts(limit: number = 10): UseFeaturedProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await ProductService.getFeaturedProducts(limit)

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

  useEffect(() => {
    fetchFeaturedProducts()
  }, [fetchFeaturedProducts])

  return {
    products,
    loading,
    error,
    refetch: fetchFeaturedProducts
  }
}

interface UseProductSearchResult {
  products: Product[]
  loading: boolean
  error: Error | null
  search: (query: string) => Promise<void>
  clearSearch: () => void
}

export function useProductSearch(): UseProductSearchResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await ProductService.searchProducts(query)

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
  }, [])

  const clearSearch = useCallback(() => {
    setProducts([])
    setError(null)
  }, [])

  return {
    products,
    loading,
    error,
    search,
    clearSearch
  }
}

interface UseCategoriesResult {
  categories: any[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await ProductService.getCategories()

      if (result.error) {
        setError(result.error)
        return
      }

      setCategories(result.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  }
}

interface UseSimilarProductsResult {
  products: Product[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useSimilarProducts(
  productId: string | null,
  category: string | null,
  limit: number = 5
): UseSimilarProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchSimilarProducts = useCallback(async () => {
    if (!productId || !category) {
      setProducts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await ProductService.getSimilarProducts(productId, category, limit)

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
  }, [productId, category, limit])

  useEffect(() => {
    fetchSimilarProducts()
  }, [fetchSimilarProducts])

  return {
    products,
    loading,
    error,
    refetch: fetchSimilarProducts
  }
}