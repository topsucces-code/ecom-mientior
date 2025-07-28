import type { Database } from './database'

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export interface ProductWithCategory extends Product {
  category: {
    name: string
    slug: string
  }
}

export interface ProductFilters {
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  tags?: string[]
  status?: Product['status']
  featured?: boolean
  search?: string
}

export interface ProductSortOptions {
  field: 'name' | 'price' | 'created_at' | 'updated_at'
  direction: 'asc' | 'desc'
}

export interface ProductSearchParams {
  filters?: ProductFilters
  sort?: ProductSortOptions
  page?: number
  limit?: number
}