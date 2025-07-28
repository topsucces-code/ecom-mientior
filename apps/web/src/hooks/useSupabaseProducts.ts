import { useState, useEffect } from 'react'
import { supabase, type Product } from '../lib/supabase'

interface UseProductsOptions {
  category?: string
  featured?: boolean
  limit?: number
  search?: string
  sortBy?: 'name' | 'price' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export function useSupabaseProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    category,
    featured,
    limit = 20,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from('products')
          .select(`
            *,
            categories (
              id,
              name
            )
          `)
          .eq('status', 'active')

        // Apply filters
        if (category) {
          // Try to find category by name first
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id')
            .eq('name', category)
            .single()

          if (categoryData) {
            query = query.eq('category_id', categoryData.id)
          }
        }

        if (featured !== undefined) {
          query = query.eq('featured', featured)
        }

        if (search) {
          query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,brand.ilike.%${search}%`)
        }

        // Apply sorting
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })

        // Apply limit
        if (limit) {
          query = query.limit(limit)
        }

        const { data, error: fetchError } = await query

        if (fetchError) {
          throw fetchError
        }

        setProducts(data || [])
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category, featured, limit, search, sortBy, sortOrder])

  return { products, loading, error, refetch: () => fetchProducts() }
}

export function useProductById(id: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return

      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('products')
          .select(`
            *,
            categories (
              id,
              name
            )
          `)
          .eq('id', id)
          .eq('status', 'active')
          .single()

        if (fetchError) {
          throw fetchError
        }

        setProduct(data)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  return { product, loading, error }
}

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true })

        if (fetchError) {
          throw fetchError
        }

        setCategories(data || [])
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading, error }
}

// Analytics tracking
export async function trackProductView(productId: string) {
  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Check if analytics entry exists for today
    const { data: existing } = await supabase
      .from('product_analytics')
      .select('*')
      .eq('product_id', productId)
      .eq('date', today)
      .single()

    if (existing) {
      // Update existing entry
      await supabase
        .from('product_analytics')
        .update({ 
          views_count: existing.views_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      // Create new entry
      await supabase
        .from('product_analytics')
        .insert({
          product_id: productId,
          date: today,
          views_count: 1
        })
    }
  } catch (error) {
    console.error('Error tracking product view:', error)
  }
}

export async function trackCartAddition(productId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data: existing } = await supabase
      .from('product_analytics')
      .select('*')
      .eq('product_id', productId)
      .eq('date', today)
      .single()

    if (existing) {
      await supabase
        .from('product_analytics')
        .update({ 
          cart_additions: existing.cart_additions + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('product_analytics')
        .insert({
          product_id: productId,
          date: today,
          cart_additions: 1
        })
    }
  } catch (error) {
    console.error('Error tracking cart addition:', error)
  }
}