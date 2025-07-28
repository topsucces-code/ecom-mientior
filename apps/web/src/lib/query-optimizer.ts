import { supabase } from '@ecommerce/shared'
import { useCacheStore } from './cache-store'

// Query optimization utilities for Supabase

interface QueryConfig {
  table: string
  select?: string
  filters?: Record<string, any>
  ordering?: { column: string; ascending?: boolean }[]
  range?: { from: number; to: number }
  cacheTTL?: number
}

class QueryOptimizer {
  private cache = useCacheStore.getState()

  // Optimized product queries
  async getProducts(config: QueryConfig) {
    const cacheKey = `products:${JSON.stringify(config)}`
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Apply select with optimized fields
    const select = config.select || `
      id, 
      name, 
      description, 
      price, 
      compare_at_price,
      inventory_quantity,
      brand,
      category,
      images,
      created_at
    `
    let query = supabase.from(config.table).select(select)

    // Apply filters
    if (config.filters) {
      Object.entries(config.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else if (typeof value === 'object' && value.gte !== undefined) {
            query = query.gte(key, value.gte)
          } else if (typeof value === 'object' && value.lte !== undefined) {
            query = query.lte(key, value.lte)
          } else if (typeof value === 'object' && value.like !== undefined) {
            query = query.like(key, value.like)
          } else {
            query = query.eq(key, value)
          }
        }
      })
    }

    // Apply ordering
    if (config.ordering) {
      config.ordering.forEach(({ column, ascending = false }) => {
        query = query.order(column, { ascending })
      })
    }

    // Apply range
    if (config.range) {
      query = query.range(config.range.from, config.range.to)
    }

    // Execute query
    const { data, error } = await query

    if (error) {
      throw error
    }

    // Cache results
    const ttl = config.cacheTTL || 5 * 60 * 1000 // 5 minutes default
    this.cache.set(cacheKey, data, ttl)

    return data
  }

  // Optimized search with full-text search
  async searchProducts(query: string, options: {
    category?: string
    brand?: string
    priceRange?: { min: number; max: number }
    inStock?: boolean
    limit?: number
    offset?: number
  } = {}) {
    const cacheKey = `search:${query}:${JSON.stringify(options)}`
    
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    let supabaseQuery = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        compare_at_price,
        inventory_quantity,
        brand,
        category,
        images
      `, { count: 'exact' })

    // Full-text search
    if (query.trim()) {
      supabaseQuery = supabaseQuery.textSearch('name', query, {
        type: 'websearch',
        config: 'english'
      })
    }

    // Apply filters
    if (options.category) {
      supabaseQuery = supabaseQuery.eq('category', options.category)
    }

    if (options.brand) {
      supabaseQuery = supabaseQuery.eq('brand', options.brand)
    }

    if (options.priceRange) {
      if (options.priceRange.min > 0) {
        supabaseQuery = supabaseQuery.gte('price', options.priceRange.min)
      }
      if (options.priceRange.max < Number.MAX_SAFE_INTEGER) {
        supabaseQuery = supabaseQuery.lte('price', options.priceRange.max)
      }
    }

    if (options.inStock) {
      supabaseQuery = supabaseQuery.gt('inventory_quantity', 0)
    }

    // Apply pagination
    if (options.offset !== undefined && options.limit !== undefined) {
      supabaseQuery = supabaseQuery.range(options.offset, options.offset + options.limit - 1)
    }

    // Order by relevance (best match first)
    supabaseQuery = supabaseQuery.order('created_at', { ascending: false })

    const { data, error, count } = await supabaseQuery

    if (error) {
      throw error
    }

    const result = { data, count }
    
    // Cache for 2 minutes
    this.cache.set(cacheKey, result, 2 * 60 * 1000)

    return result
  }

  // Optimized category loading
  async getCategories() {
    const cacheKey = 'categories'
    const cached = this.cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null)

    if (error) {
      throw error
    }

    const categories = Array.from(new Set(data.map(item => item.category))).sort()
    
    // Cache for 10 minutes
    this.cache.set(cacheKey, categories, 10 * 60 * 1000)

    return categories
  }

  // Optimized brand loading
  async getBrands() {
    const cacheKey = 'brands'
    const cached = this.cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('products')
      .select('brand')
      .not('brand', 'is', null)

    if (error) {
      throw error
    }

    const brands = Array.from(new Set(data.map(item => item.brand))).sort()
    
    // Cache for 10 minutes
    this.cache.set(cacheKey, brands, 10 * 60 * 1000)

    return brands
  }

  // Batch operations for better performance
  async batchInsert(table: string, records: any[]) {
    const batchSize = 100 // Supabase recommended batch size
    const batches = []

    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize))
    }

    const results = []
    for (const batch of batches) {
      const { data, error } = await supabase
        .from(table)
        .insert(batch)
        .select()

      if (error) {
        throw error
      }

      results.push(...(data || []))
    }

    // Clear related cache
    this.clearCacheByPattern(table)

    return results
  }

  // Clear cache by pattern
  clearCacheByPattern(pattern: string) {
    const cache = this.cache.cache
    const keysToDelete: string[] = []

    cache.forEach((value, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Preload critical data
  async preloadCriticalData() {
    try {
      await Promise.all([
        this.getCategories(),
        this.getBrands(),
        this.getProducts({
          table: 'products',
          range: { from: 0, to: 19 }, // First 20 products
          ordering: [{ column: 'created_at', ascending: false }]
        })
      ])
    } catch (error) {
      console.error('Failed to preload critical data:', error)
    }
  }
}

export const queryOptimizer = new QueryOptimizer()

// React hooks for optimized queries
export const useOptimizedProducts = () => {
  return {
    getProducts: (config: QueryConfig) => queryOptimizer.getProducts(config),
    searchProducts: (query: string, options?: any) => queryOptimizer.searchProducts(query, options),
    preloadData: () => queryOptimizer.preloadCriticalData()
  }
}