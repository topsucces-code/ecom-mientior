'use client'

import { supabase } from './supabase/client'
import { Product, ProductImage, ProductVariant, Category } from './supabase/types'

export interface ProductFilters {
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  featured?: boolean
  search?: string
}

export interface ProductSort {
  field: 'name' | 'price' | 'created_at' | 'rating' | 'sales_count'
  direction: 'asc' | 'desc'
}

export class ProductService {
  async getProducts(
    filters?: ProductFilters,
    sort?: ProductSort,
    limit = 20,
    offset = 0
  ): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('status', 'active')

    // Apply filters
    if (filters?.category) {
      query = query.eq('category_id', filters.category)
    }
    
    if (filters?.brand) {
      query = query.eq('brand', filters.brand)
    }
    
    if (filters?.minPrice) {
      query = query.gte('price', filters.minPrice)
    }
    
    if (filters?.maxPrice) {
      query = query.lte('price', filters.maxPrice)
    }
    
    if (filters?.inStock) {
      query = query.gt('inventory_quantity', 0)
    }
    
    if (filters?.featured) {
      query = query.eq('featured', true)
    }
    
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      throw new Error('Failed to fetch products')
    }

    return data || []
  }

  async getProduct(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('Error fetching product:', error)
      return null
    }

    return data
  }

  async getFeaturedProducts(limit = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('featured', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching featured products:', error)
      throw new Error('Failed to fetch featured products')
    }

    return data || []
  }

  async getRecommendedProducts(userId: string, limit = 10): Promise<Product[]> {
    // For now, return featured products as recommendations
    // In the future, implement proper recommendation logic based on user behavior
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('status', 'active')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recommended products:', error)
      throw new Error('Failed to fetch recommended products')
    }

    return data || []
  }

  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
      throw new Error('Failed to fetch categories')
    }

    return data || []
  }

  async searchProducts(query: string, limit = 20): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('status', 'active')
      .order('name')
      .limit(limit)

    if (error) {
      console.error('Error searching products:', error)
      throw new Error('Failed to search products')
    }

    return data || []
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      throw new Error('Failed to create product')
    }

    return data
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      throw new Error('Failed to update product')
    }

    return data
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ status: 'archived' })
      .eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      throw new Error('Failed to delete product')
    }
  }

  // Product images are now stored in the images JSON field
  // Product variants functionality to be implemented later

  async updateStock(productId: string, quantity: number): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ inventory_quantity: quantity })
      .eq('id', productId)

    if (error) {
      console.error('Error updating product stock:', error)
      throw new Error('Failed to update product stock')
    }
  }

  async getProductsByBrand(brand: string, limit = 20, offset = 0): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('brand', brand)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching brand products:', error)
      throw new Error('Failed to fetch brand products')
    }

    return data || []
  }
}

export const productService = new ProductService()