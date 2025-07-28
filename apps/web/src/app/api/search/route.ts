import { NextRequest, NextResponse } from 'next/server'
import { supabase, functions } from '@ecommerce/shared'
import type { SearchHistory } from '@ecommerce/shared'

interface SearchRequest {
  query: string
  userId?: string
  filters?: {
    category?: string
    priceRange?: [number, number]
    rating?: number
    inStock?: boolean
    brand?: string
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular'
    tags?: string[]
  }
  limit?: number
  offset?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json()
    
    if (!body.query || body.query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const query = body.query.trim()
    const filters = body.filters || {}
    const limit = body.limit || 20
    const offset = body.offset || 0

    // Build search query
    let searchQuery = supabase
      .from('products')
      .select(`
        *,
        categories!inner(name, slug),
        reviews(rating)
      `)
      .eq('status', 'active')
      .range(offset, offset + limit - 1)

    // Text search using PostgreSQL full-text search
    if (query) {
      searchQuery = searchQuery.textSearch('name', query, {
        type: 'websearch',
        config: 'english'
      })
    }

    // Apply filters
    if (filters.category) {
      searchQuery = searchQuery.eq('categories.slug', filters.category)
    }

    if (filters.priceRange) {
      searchQuery = searchQuery
        .gte('price', filters.priceRange[0])
        .lte('price', filters.priceRange[1])
    }

    if (filters.inStock !== undefined) {
      if (filters.inStock) {
        searchQuery = searchQuery.gt('inventory_quantity', 0)
      } else {
        searchQuery = searchQuery.eq('inventory_quantity', 0)
      }
    }

    if (filters.brand) {
      searchQuery = searchQuery.eq('brand', filters.brand)
    }

    if (filters.tags && filters.tags.length > 0) {
      searchQuery = searchQuery.overlaps('tags', filters.tags)
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_asc':
        searchQuery = searchQuery.order('price', { ascending: true })
        break
      case 'price_desc':
        searchQuery = searchQuery.order('price', { ascending: false })
        break
      case 'newest':
        searchQuery = searchQuery.order('created_at', { ascending: false })
        break
      case 'rating':
        // This would require a more complex query with aggregated ratings
        searchQuery = searchQuery.order('created_at', { ascending: false })
        break
      case 'popular':
        searchQuery = searchQuery.order('featured', { ascending: false })
        break
      default: // relevance
        searchQuery = searchQuery.order('featured', { ascending: false })
        break
    }

    const { data: products, error: searchError } = await searchQuery

    if (searchError) {
      throw new Error(searchError.message)
    }

    // Calculate relevance scores and format results
    const results = (products || []).map(product => {
      // Simple relevance scoring based on query match
      let relevanceScore = 0
      const queryLower = query.toLowerCase()
      const nameLower = product.name.toLowerCase()
      const descLower = product.description.toLowerCase()

      // Exact match in name gets highest score
      if (nameLower.includes(queryLower)) {
        relevanceScore += 100
      }

      // Match in description gets lower score
      if (descLower.includes(queryLower)) {
        relevanceScore += 50
      }

      // Brand match
      if (product.brand?.toLowerCase().includes(queryLower)) {
        relevanceScore += 75
      }

      // Tag matches
      if (product.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
        relevanceScore += 60
      }

      // Featured products get bonus
      if (product.featured) {
        relevanceScore += 25
      }

      return {
        ...product,
        relevanceScore,
        category: product.categories?.name || '',
        categorySlug: product.categories?.slug || ''
      }
    })

    // Sort by relevance if that's the selected sort
    if (filters.sortBy === 'relevance' || !filters.sortBy) {
      results.sort((a, b) => b.relevanceScore - a.relevanceScore)
    }

    // Log search history if user is provided
    if (body.userId) {
      const searchHistoryData: Omit<SearchHistory, 'id' | 'created_at'> = {
        user_id: body.userId,
        query,
        filters: filters as any,
        results_count: results.length,
        session_id: `session_${Date.now()}`
      }

      // Don't await this to avoid slowing down the response
      supabase
        .from('search_history')
        .insert(searchHistoryData)
        .catch(console.error)
    }

    // Get facets for filtering
    const facets = await getFacets(query, filters)

    return NextResponse.json({
      results,
      facets,
      totalCount: results.length,
      hasMore: results.length === limit,
      query,
      filters
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}

// GET - Get search suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'suggestions'

    if (!query) {
      return NextResponse.json({ suggestions: [] })
    }

    if (type === 'suggestions') {
      // Get search suggestions
      const { data: products, error } = await supabase
        .from('products')
        .select('name, brand, tags')
        .textSearch('name', query, { type: 'prefix' })
        .eq('status', 'active')
        .limit(5)

      if (error) {
        throw new Error(error.message)
      }

      const suggestions = new Set<string>()
      
      products?.forEach(product => {
        suggestions.add(product.name)
        if (product.brand) suggestions.add(product.brand)
        product.tags?.forEach((tag: string) => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(tag)
          }
        })
      })

      return NextResponse.json({
        suggestions: Array.from(suggestions).slice(0, 8)
      })
    }

    if (type === 'recent') {
      const userId = searchParams.get('userId')
      if (!userId) {
        return NextResponse.json({ recent: [] })
      }

      // Get recent searches for user
      const { data: recentSearches, error } = await supabase
        .from('search_history')
        .select('query')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        throw new Error(error.message)
      }

      const uniqueQueries = [...new Set(recentSearches?.map(s => s.query) || [])]

      return NextResponse.json({
        recent: uniqueQueries.slice(0, 5)
      })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })

  } catch (error) {
    console.error('Search suggestions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get suggestions' },
      { status: 500 }
    )
  }
}

// Helper function to get search facets
async function getFacets(query: string, filters: any) {
  try {
    // Get categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name')

    // Get brands
    const { data: brands, error: brandError } = await supabase
      .from('products')
      .select('brand')
      .not('brand', 'is', null)
      .eq('status', 'active')

    // Get price range
    const { data: priceRange, error: priceError } = await supabase
      .from('products')
      .select('price')
      .eq('status', 'active')
      .order('price')

    const uniqueBrands = [...new Set(brands?.map(p => p.brand).filter(Boolean) || [])]
    const prices = priceRange?.map(p => p.price) || []
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    return {
      categories: categories || [],
      brands: uniqueBrands.slice(0, 20),
      priceRange: [minPrice || 0, maxPrice || 1000],
      avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    }
  } catch (error) {
    console.error('Facets error:', error)
    return {
      categories: [],
      brands: [],
      priceRange: [0, 1000],
      avgPrice: 0
    }
  }
}