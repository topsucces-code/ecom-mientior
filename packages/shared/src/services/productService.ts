import { supabase } from '../lib/supabase'

export interface Product {
  id: string
  vendor_id?: string
  name: string
  description?: string
  price: number
  category: string
  subcategory?: string
  sku: string
  images: string[]
  specifications?: any
  tags: string[]
  status: 'active' | 'inactive' | 'out_of_stock'
  featured: boolean
  rating: number
  review_count: number
  created_at: string
  updated_at: string
  vendors?: {
    id: string
    business_name: string
    logo_url?: string
  }
}

export interface ProductFilter {
  category?: string
  subcategory?: string
  minPrice?: number
  maxPrice?: number
  tags?: string[]
  featured?: boolean
  status?: string
  searchQuery?: string
}

export interface ProductSort {
  field: 'name' | 'price' | 'rating' | 'created_at'
  direction: 'asc' | 'desc'
}

export class ProductService {
  // Obtenir tous les produits avec filtres et pagination
  static async getProducts(
    filter: ProductFilter = {},
    sort: ProductSort = { field: 'created_at', direction: 'desc' },
    page: number = 1,
    limit: number = 20
  ) {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          vendors (
            id,
            business_name,
            logo_url
          )
        `)

      // Appliquer les filtres
      if (filter.category) {
        query = query.eq('category', filter.category)
      }

      if (filter.subcategory) {
        query = query.eq('subcategory', filter.subcategory)
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
        // Par défaut, ne montrer que les produits actifs
        query = query.eq('status', 'active')
      }

      if (filter.tags && filter.tags.length > 0) {
        query = query.overlaps('tags', filter.tags)
      }

      if (filter.searchQuery) {
        query = query.or(`name.ilike.%${filter.searchQuery}%,description.ilike.%${filter.searchQuery}%`)
      }

      // Appliquer le tri
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })

      // Appliquer la pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data as Product[],
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

  // Obtenir un produit par ID
  static async getProductById(id: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendors (
            id,
            business_name,
            logo_url,
            rating,
            review_count
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return { data: data as Product, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Obtenir les produits en vedette
  static async getFeaturedProducts(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendors (
            id,
            business_name,
            logo_url
          )
        `)
        .eq('featured', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data: data as Product[], error: null }
    } catch (error) {
      return { data: [], error: error as Error }
    }
  }

  // Obtenir les produits par catégorie
  static async getProductsByCategory(category: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendors (
            id,
            business_name,
            logo_url
          )
        `)
        .eq('category', category)
        .eq('status', 'active')
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data: data as Product[], error: null }
    } catch (error) {
      return { data: [], error: error as Error }
    }
  }

  // Rechercher des produits
  static async searchProducts(query: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendors (
            id,
            business_name,
            logo_url
          )
        `)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
        .eq('status', 'active')
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data: data as Product[], error: null }
    } catch (error) {
      return { data: [], error: error as Error }
    }
  }

  // Créer un nouveau produit (pour les vendeurs)
  static async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (error) throw error

      return { data: data as Product, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Mettre à jour un produit
  static async updateProduct(id: string, updates: Partial<Product>) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { data: data as Product, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Supprimer un produit
  static async deleteProduct(id: string) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Obtenir les catégories disponibles
  static async getCategories() {
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

  // Obtenir les produits similaires
  static async getSimilarProducts(productId: string, category: string, limit: number = 5) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendors (
            id,
            business_name,
            logo_url
          )
        `)
        .eq('category', category)
        .eq('status', 'active')
        .neq('id', productId)
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data: data as Product[], error: null }
    } catch (error) {
      return { data: [], error: error as Error }
    }
  }

  // Obtenir les produits les mieux notés
  static async getTopRatedProducts(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendors (
            id,
            business_name,
            logo_url
          )
        `)
        .eq('status', 'active')
        .gt('review_count', 0)
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data: data as Product[], error: null }
    } catch (error) {
      return { data: [], error: error as Error }
    }
  }

  // Obtenir les nouveaux produits
  static async getNewProducts(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendors (
            id,
            business_name,
            logo_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data: data as Product[], error: null }
    } catch (error) {
      return { data: [], error: error as Error }
    }
  }

  // Enregistrer une interaction utilisateur
  static async recordUserInteraction(
    userId: string,
    productId: string,
    interactionType: 'view' | 'cart' | 'purchase' | 'wishlist' | 'click' | 'impression'
  ) {
    try {
      const { error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: userId,
          product_id: productId,
          interaction_type: interactionType
        })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }
}

export default ProductService