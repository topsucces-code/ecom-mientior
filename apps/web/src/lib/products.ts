import type { Product, ProductFilters, ProductSearchParams, Category } from '@ecommerce/shared'
import { mockProducts, mockCategories } from './mock-data'

const USE_MOCK_DATA = false // Always use real database since it's properly configured

export class ProductService {
  static async getProducts(params: ProductSearchParams = {}) {
    const { filters = {}, sort = { field: 'created_at', direction: 'desc' }, page = 1, limit = 12 } = params
    
    if (USE_MOCK_DATA) {
      // Mock data filtering and sorting
      let filteredProducts = [...mockProducts]

      if (filters.category) {
        filteredProducts = filteredProducts.filter(p => p.category_id === filters.category)
      }

      if (filters.brand) {
        filteredProducts = filteredProducts.filter(p => p.brand === filters.brand)
      }

      if (filters.featured !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.featured === filters.featured)
      }

      if (filters.minPrice !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!)
      }

      if (filters.maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!)
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(searchLower) || 
          p.description.toLowerCase().includes(searchLower)
        )
      }

      // Sort
      filteredProducts.sort((a, b) => {
        const aVal = a[sort.field]
        const bVal = b[sort.field]
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        return sort.direction === 'asc' ? comparison : -comparison
      })

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit
      const paginatedProducts = filteredProducts.slice(from, to)

      return {
        products: paginatedProducts,
        totalCount: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit),
        currentPage: page,
      }
    }
    
    // Construire les paramètres pour l'API
    const searchParams = new URLSearchParams()
    searchParams.set('page', page.toString())
    searchParams.set('limit', limit.toString())
    
    if (filters.category) {
      searchParams.set('category', filters.category)
    }
    
    if (filters.featured !== undefined) {
      searchParams.set('featured', filters.featured.toString())
    }
    
    // Appel à l'API
    const response = await fetch(`/api/products?${searchParams.toString()}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch products')
    }
    
    return {
      products: result.products || [],
      totalCount: result.totalCount || 0,
      totalPages: result.totalPages || 1,
      currentPage: result.currentPage || 1,
    }
  }

  static async getProduct(id: string) {
    if (USE_MOCK_DATA) {
      const product = mockProducts.find(p => p.id === id)
      if (!product) throw new Error('Product not found')
      return product
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (error) throw error
    return data
  }

  static async getFeaturedProducts(limit = 8) {
    if (USE_MOCK_DATA) {
      return mockProducts
        .filter(p => p.featured)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name, slug)
      `)
      .eq('status', 'active')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  static async getRelatedProducts(categoryId: string, excludeId: string, limit = 4) {
    if (USE_MOCK_DATA) {
      return mockProducts
        .filter(p => p.category_id === categoryId && p.id !== excludeId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name, slug)
      `)
      .eq('status', 'active')
      .eq('category_id', categoryId)
      .neq('id', excludeId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}

export class CategoryService {
  static async getCategories() {
    if (USE_MOCK_DATA) {
      return mockCategories.sort((a, b) => a.name.localeCompare(b.name))
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) throw error
    return data || []
  }

  static async getCategory(slug: string) {
    if (USE_MOCK_DATA) {
      const category = mockCategories.find(c => c.slug === slug)
      if (!category) throw new Error('Category not found')
      return category
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw error
    return data
  }

  static async getCategoryTree(): Promise<Category[]> {
    const categories = await this.getCategories()
    
    const buildTree = (parentId: string | null = null): Category[] => {
      return categories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          ...cat,
          children: buildTree(cat.id)
        }))
    }

    return buildTree()
  }
}