import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

// Use the real Supabase types
type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export interface ProductWithCategory extends Product {
  category?: Category
}

export interface ProductFilter {
  category_id?: string
  minPrice?: number
  maxPrice?: number
  featured?: boolean
  status?: string
  searchQuery?: string
}

export interface ProductSort {
  field: 'name' | 'price' | 'created_at'
  direction: 'asc' | 'desc'
}

export interface ProductsResult {
  data: ProductWithCategory[]
  count: number
  page: number
  limit: number
  totalPages: number
  error: Error | null
}

export class SupabaseProductService {
  // Get featured products
  static async getFeaturedProducts(limit: number = 10): Promise<{ data: ProductWithCategory[], error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories (
            id,
            name,
            slug,
            description
          )
        `)
        .eq('featured', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data: data as ProductWithCategory[], error: null }
    } catch (error) {
      return { data: [], error: error as Error }
    }
  }

  // Get products with filters and pagination
  static async getProducts(
    filter: ProductFilter = {},
    sort: ProductSort = { field: 'created_at', direction: 'desc' },
    page: number = 1,
    limit: number = 20
  ): Promise<ProductsResult> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories (
            id,
            name,
            slug,
            description
          )
        `, { count: 'exact' })

      // Apply filters
      if (filter.category_id) {
        query = query.eq('category_id', filter.category_id)
      }

      if (filter.minPrice !== undefined) {
        query = query.gte('price', filter.minPrice)
      }

      if (filter.maxPrice !== undefined) {
        query = query.lte('price', filter.maxPrice)
      }

      if (filter.featured !== undefined) {
        query = query.eq('featured', filter.featured)
      }

      if (filter.status) {
        query = query.eq('status', filter.status)
      } else {
        // Default to active products only
        query = query.eq('status', 'active')
      }

      if (filter.searchQuery) {
        query = query.or(`name.ilike.%${filter.searchQuery}%,description.ilike.%${filter.searchQuery}%`)
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data as ProductWithCategory[],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        error: null
      }
    } catch (error) {
      return {
        data: [],
        count: 0,
        page,
        limit,
        totalPages: 0,
        error: error as Error
      }
    }
  }

  // Get product by ID
  static async getProductById(id: string): Promise<{ data: ProductWithCategory | null, error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories (
            id,
            name,
            slug,
            description
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return { data: data as ProductWithCategory, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Get products by category
  static async getProductsByCategory(categoryId: string, limit: number = 20): Promise<{ data: ProductWithCategory[], error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories (
            id,
            name,
            slug,
            description
          )
        `)
        .eq('category_id', categoryId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data: data as ProductWithCategory[], error: null }
    } catch (error) {
      return { data: [], error: error as Error }
    }
  }

  // Search products
  static async searchProducts(query: string, limit: number = 20): Promise<{ data: ProductWithCategory[], error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories (
            id,
            name,
            slug,
            description
          )
        `)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data: data as ProductWithCategory[], error: null }
    } catch (error) {
      return { data: [], error: error as Error }
    }
  }

  // Get categories
  static async getCategories(): Promise<{ data: Category[], error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error: error as Error }
    }
  }
}

export default SupabaseProductService
export type { Product, ProductWithCategory, Category }