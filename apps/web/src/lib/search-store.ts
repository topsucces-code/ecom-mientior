import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@ecommerce/shared'
import type { Product } from '@ecommerce/shared'
import { useCacheStore } from './cache-store'

export interface SearchFilters {
  query: string
  category: string
  brand: string
  minPrice: number
  maxPrice: number
  rating: number
  inStock: boolean
  onSale: boolean
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular'
}

export interface SearchSuggestion {
  text: string
  type: 'product' | 'category' | 'brand'
  count?: number
}

interface SearchStore {
  // Search state
  filters: SearchFilters
  results: Product[]
  suggestions: SearchSuggestion[]
  loading: boolean
  totalResults: number
  currentPage: number
  resultsPerPage: number
  
  // Recent searches
  recentSearches: string[]
  
  // Popular searches
  popularSearches: string[]
  
  // Available filter options
  categories: string[]
  brands: string[]
  priceRanges: { min: number; max: number; label: string }[]
  
  // Actions
  setFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void
  setFilters: (filters: Partial<SearchFilters>) => void
  clearFilters: () => void
  search: (query?: string) => Promise<void>
  loadSuggestions: (query: string) => Promise<void>
  addRecentSearch: (query: string) => void
  setPage: (page: number) => void
  
  // Filter options loading
  loadFilterOptions: () => Promise<void>
  
  // Utility functions
  hasActiveFilters: () => boolean
  getActiveFilterCount: () => number
}

const defaultFilters: SearchFilters = {
  query: '',
  category: '',
  brand: '',
  minPrice: 0,
  maxPrice: 10000,
  rating: 0,
  inStock: false,
  onSale: false,
  sortBy: 'relevance'
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      // Initial state
      filters: defaultFilters,
      results: [],
      suggestions: [],
      loading: false,
      totalResults: 0,
      currentPage: 1,
      resultsPerPage: 12,
      recentSearches: [],
      popularSearches: [
        'smartphone',
        'laptop',
        'headphones',
        'camera',
        'tablet',
        'smartwatch',
        'gaming'
      ],
      categories: [],
      brands: [],
      priceRanges: [
        { min: 0, max: 50, label: 'Under $50' },
        { min: 50, max: 100, label: '$50 - $100' },
        { min: 100, max: 250, label: '$100 - $250' },
        { min: 250, max: 500, label: '$250 - $500' },
        { min: 500, max: 1000, label: '$500 - $1000' },
        { min: 1000, max: 10000, label: 'Over $1000' }
      ],
      
      setFilter: (key, value) => {
        set(state => ({
          filters: { ...state.filters, [key]: value },
          currentPage: 1 // Reset to first page when filters change
        }))
        
        // Auto-search when filters change (except for query)
        if (key !== 'query') {
          get().search()
        }
      },
      
      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1
        }))
        get().search()
      },
      
      clearFilters: () => {
        set({
          filters: { ...defaultFilters, query: get().filters.query }, // Keep search query
          currentPage: 1
        })
        get().search()
      },
      
      search: async (query) => {
        const state = get()
        const searchFilters = query !== undefined 
          ? { ...state.filters, query }
          : state.filters
        
        if (query !== undefined) {
          set({ filters: searchFilters })
        }
        
        // Check cache first
        const cacheStore = useCacheStore.getState()
        const cacheKey = `${searchFilters.query}:${JSON.stringify({
          ...searchFilters,
          page: state.currentPage
        })}`
        
        const cachedResult = cacheStore.getSearchResults(cacheKey, searchFilters)
        if (cachedResult) {
          set({
            results: cachedResult.results,
            totalResults: cachedResult.total,
            loading: false
          })
          return
        }
        
        set({ loading: true })
        
        try {
          // Add to recent searches if it's a new query
          if (query && query.trim() && !state.recentSearches.includes(query.trim())) {
            get().addRecentSearch(query.trim())
          }
          
          let supabaseQuery = supabase
            .from('products')
            .select('*', { count: 'exact' })
          
          // Apply text search
          if (searchFilters.query) {
            supabaseQuery = supabaseQuery.textSearch('name', searchFilters.query)
          }
          
          // Apply category filter
          if (searchFilters.category) {
            supabaseQuery = supabaseQuery.eq('category', searchFilters.category)
          }
          
          // Apply brand filter
          if (searchFilters.brand) {
            supabaseQuery = supabaseQuery.eq('brand', searchFilters.brand)
          }
          
          // Apply price range filter
          if (searchFilters.minPrice > 0) {
            supabaseQuery = supabaseQuery.gte('price', searchFilters.minPrice)
          }
          if (searchFilters.maxPrice < 10000) {
            supabaseQuery = supabaseQuery.lte('price', searchFilters.maxPrice)
          }
          
          // Apply rating filter
          if (searchFilters.rating > 0) {
            supabaseQuery = supabaseQuery.gte('rating', searchFilters.rating)
          }
          
          // Apply stock filter
          if (searchFilters.inStock) {
            supabaseQuery = supabaseQuery.gt('inventory_quantity', 0)
          }
          
          // Apply sale filter
          if (searchFilters.onSale) {
            supabaseQuery = supabaseQuery.lt('price', supabaseQuery.select('compare_at_price'))
          }
          
          // Apply sorting
          switch (searchFilters.sortBy) {
            case 'price_asc':
              supabaseQuery = supabaseQuery.order('price', { ascending: true })
              break
            case 'price_desc':
              supabaseQuery = supabaseQuery.order('price', { ascending: false })
              break
            case 'rating':
              supabaseQuery = supabaseQuery.order('rating', { ascending: false })
              break
            case 'newest':
              supabaseQuery = supabaseQuery.order('created_at', { ascending: false })
              break
            case 'popular':
              supabaseQuery = supabaseQuery.order('views', { ascending: false })
              break
            default: // relevance
              supabaseQuery = supabaseQuery.order('created_at', { ascending: false })
              break
          }
          
          // Apply pagination
          const offset = (state.currentPage - 1) * state.resultsPerPage
          supabaseQuery = supabaseQuery.range(offset, offset + state.resultsPerPage - 1)
          
          const { data: products, error, count } = await supabaseQuery
          
          if (error) throw error
          
          const results = products || []
          const totalResults = count || 0
          
          // Cache the results
          cacheStore.setSearchResults(cacheKey, searchFilters, results, totalResults)
          
          set({
            results,
            totalResults,
            loading: false
          })
        } catch (error) {
          console.error('Search failed:', error)
          set({
            results: [],
            totalResults: 0,
            loading: false
          })
        }
      },
      
      loadSuggestions: async (query) => {
        if (!query.trim()) {
          set({ suggestions: [] })
          return
        }
        
        try {
          // Get product suggestions
          const { data: products } = await supabase
            .from('products')
            .select('name')
            .textSearch('name', query)
            .limit(5)
          
          // Get category suggestions
          const { data: categories } = await supabase
            .from('products')
            .select('category')
            .textSearch('category', query)
            .limit(3)
          
          // Get brand suggestions
          const { data: brands } = await supabase
            .from('products')
            .select('brand')
            .textSearch('brand', query)
            .limit(3)
          
          const suggestions: SearchSuggestion[] = [
            ...(products?.map(p => ({ text: p.name, type: 'product' as const })) || []),
            ...(categories?.map(c => ({ text: c.category, type: 'category' as const })) || []),
            ...(brands?.map(b => ({ text: b.brand, type: 'brand' as const })) || [])
          ]
          
          set({ suggestions })
        } catch (error) {
          console.error('Failed to load suggestions:', error)
          set({ suggestions: [] })
        }
      },
      
      addRecentSearch: (query) => {
        set(state => ({
          recentSearches: [
            query,
            ...state.recentSearches.filter(s => s !== query)
          ].slice(0, 10) // Keep only last 10 searches
        }))
      },
      
      setPage: (page) => {
        set({ currentPage: page })
        get().search()
      },
      
      loadFilterOptions: async () => {
        try {
          // Load unique categories
          const { data: categoryData } = await supabase
            .from('products')
            .select('category')
            .not('category', 'is', null)
          
          // Load unique brands
          const { data: brandData } = await supabase
            .from('products')
            .select('brand')
            .not('brand', 'is', null)
          
          const categories = Array.from(new Set(
            categoryData?.map(item => item.category).filter(Boolean) || []
          )).sort()
          
          const brands = Array.from(new Set(
            brandData?.map(item => item.brand).filter(Boolean) || []
          )).sort()
          
          set({ categories, brands })
        } catch (error) {
          console.error('Failed to load filter options:', error)
        }
      },
      
      hasActiveFilters: () => {
        const { filters } = get()
        return (
          filters.category !== '' ||
          filters.brand !== '' ||
          filters.minPrice > 0 ||
          filters.maxPrice < 10000 ||
          filters.rating > 0 ||
          filters.inStock ||
          filters.onSale
        )
      },
      
      getActiveFilterCount: () => {
        const { filters } = get()
        let count = 0
        
        if (filters.category) count++
        if (filters.brand) count++
        if (filters.minPrice > 0 || filters.maxPrice < 10000) count++
        if (filters.rating > 0) count++
        if (filters.inStock) count++
        if (filters.onSale) count++
        
        return count
      }
    }),
    {
      name: 'search-storage',
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        filters: {
          ...state.filters,
          query: '' // Don't persist search query
        }
      })
    }
  )
)

// Selectors
export const useSearchResults = () => useSearchStore(state => state.results)
export const useSearchLoading = () => useSearchStore(state => state.loading)
export const useSearchFilters = () => useSearchStore(state => state.filters)
export const useSearchSuggestions = () => useSearchStore(state => state.suggestions)
export const useRecentSearches = () => useSearchStore(state => state.recentSearches)
export const useHasActiveFilters = () => useSearchStore(state => state.hasActiveFilters())
export const useActiveFilterCount = () => useSearchStore(state => state.getActiveFilterCount())