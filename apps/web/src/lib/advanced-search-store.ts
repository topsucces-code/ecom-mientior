import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, functions } from '@ecommerce/shared'
import type { Product, SearchHistory } from '@ecommerce/shared'

export interface SearchFilters {
  category?: string
  priceRange?: [number, number]
  rating?: number
  inStock?: boolean
  brand?: string
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular'
  tags?: string[]
}

export interface SearchResult extends Product {
  popularity: number
  relevanceScore?: number
}

export interface Category {
  id: string
  name: string
  slug: string
  count: number
}

interface SearchStore {
  // State
  query: string
  filters: SearchFilters
  results: SearchResult[]
  suggestions: string[]
  recentSearches: string[]
  categories: Category[]
  brands: string[]
  priceRange: [number, number]
  loading: boolean
  error: string | null
  
  // Search metadata
  totalResults: number
  currentPage: number
  totalPages: number
  searchTime: number
  
  // Actions
  setQuery: (query: string) => void
  setFilters: (filters: SearchFilters) => void
  search: (query: string, page?: number) => Promise<void>
  loadMore: () => Promise<void>
  getSuggestions: (query: string) => Promise<void>
  clearResults: () => void
  clearFilters: () => void
  addRecentSearch: (query: string) => void
  removeRecentSearch: (query: string) => void
  clearRecentSearches: () => void
  
  // Data fetching
  fetchCategories: () => Promise<void>
  fetchBrands: () => Promise<void>
  fetchPriceRange: () => Promise<void>
  
  // Advanced search features
  searchSimilar: (productId: string) => Promise<SearchResult[]>
  searchByImage: (imageFile: File) => Promise<SearchResult[]>
  getPopularSearches: () => Promise<string[]>
  getSearchTrends: () => Promise<{ term: string; count: number }[]>
}

// Mock data and API functions
const mockProducts: SearchResult[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 89.99,
    originalPrice: 129.99,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
    rating: 4.5,
    reviewCount: 234,
    category: 'electronics',
    brand: 'TechSound',
    inStock: true,
    tags: ['wireless', 'bluetooth', 'headphones', 'audio'],
    createdAt: '2024-01-15T00:00:00Z',
    popularity: 95
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracking with heart rate monitor',
    price: 199.99,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30'],
    rating: 4.7,
    reviewCount: 156,
    category: 'electronics',
    brand: 'FitTech',
    inStock: true,
    tags: ['smartwatch', 'fitness', 'health', 'wearable'],
    createdAt: '2024-01-10T00:00:00Z',
    popularity: 88
  },
  {
    id: '3',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable organic cotton t-shirt in various colors',
    price: 24.99,
    originalPrice: 34.99,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'],
    rating: 4.3,
    reviewCount: 89,
    category: 'clothing',
    brand: 'EcoWear',
    inStock: true,
    tags: ['organic', 'cotton', 'tshirt', 'casual'],
    createdAt: '2024-01-20T00:00:00Z',
    popularity: 76
  },
  {
    id: '4',
    name: 'Professional Camera Lens',
    description: '85mm f/1.4 prime lens for professional photography',
    price: 599.99,
    images: ['https://images.unsplash.com/photo-1606983340126-99ab4feaa64a'],
    rating: 4.9,
    reviewCount: 67,
    category: 'electronics',
    brand: 'LensCraft',
    inStock: false,
    tags: ['camera', 'lens', 'photography', 'professional'],
    createdAt: '2024-01-05T00:00:00Z',
    popularity: 92
  },
  {
    id: '5',
    name: 'Minimalist Desk Lamp',
    description: 'Modern LED desk lamp with adjustable brightness',
    price: 45.99,
    images: ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43'],
    rating: 4.4,
    reviewCount: 123,
    category: 'home',
    brand: 'ModernHome',
    inStock: true,
    tags: ['lamp', 'led', 'desk', 'modern'],
    createdAt: '2024-01-12T00:00:00Z',
    popularity: 71
  }
]

const mockCategories: Category[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', count: 1250 },
  { id: '2', name: 'Clothing', slug: 'clothing', count: 890 },
  { id: '3', name: 'Home & Garden', slug: 'home', count: 567 },
  { id: '4', name: 'Sports & Outdoors', slug: 'sports', count: 432 },
  { id: '5', name: 'Books', slug: 'books', count: 234 },
  { id: '6', name: 'Beauty', slug: 'beauty', count: 345 }
]

const mockBrands = ['TechSound', 'FitTech', 'EcoWear', 'LensCraft', 'ModernHome', 'Apple', 'Samsung', 'Nike', 'Adidas']

const mockSearch = async (query: string, filters: SearchFilters = {}, page: number = 1): Promise<{
  results: SearchResult[]
  totalResults: number
  totalPages: number
  searchTime: number
}> => {
  await new Promise(resolve => setTimeout(resolve, 300)) // Simulate API delay

  let filteredResults = [...mockProducts]

  // Apply search query
  if (query.trim()) {
    const lowerQuery = query.toLowerCase()
    filteredResults = filteredResults.filter(product =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      product.brand.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery) ||
      product.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  // Apply filters
  if (filters.category) {
    filteredResults = filteredResults.filter(product => product.category === filters.category)
  }

  if (filters.brand) {
    filteredResults = filteredResults.filter(product => product.brand === filters.brand)
  }

  if (filters.priceRange) {
    filteredResults = filteredResults.filter(product => 
      product.price >= filters.priceRange![0] && product.price <= filters.priceRange![1]
    )
  }

  if (filters.rating) {
    filteredResults = filteredResults.filter(product => product.rating >= filters.rating!)
  }

  if (filters.inStock) {
    filteredResults = filteredResults.filter(product => product.inStock)
  }

  // Apply sorting
  switch (filters.sortBy) {
    case 'price_asc':
      filteredResults.sort((a, b) => a.price - b.price)
      break
    case 'price_desc':
      filteredResults.sort((a, b) => b.price - a.price)
      break
    case 'rating':
      filteredResults.sort((a, b) => b.rating - a.rating)
      break
    case 'newest':
      filteredResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case 'popular':
      filteredResults.sort((a, b) => b.popularity - a.popularity)
      break
    default: // relevance
      // For relevance, we could implement a more sophisticated scoring algorithm
      if (query.trim()) {
        filteredResults.sort((a, b) => {
          const aScore = a.name.toLowerCase().includes(query.toLowerCase()) ? 2 : 
                        a.description.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
          const bScore = b.name.toLowerCase().includes(query.toLowerCase()) ? 2 : 
                        b.description.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
          return bScore - aScore
        })
      }
      break
  }

  const itemsPerPage = 20
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const results = filteredResults.slice(startIndex, endIndex)

  return {
    results,
    totalResults: filteredResults.length,
    totalPages: Math.ceil(filteredResults.length / itemsPerPage),
    searchTime: Math.random() * 100 + 50 // Random search time between 50-150ms
  }
}

const mockGetSuggestions = async (query: string): Promise<string[]> => {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const suggestions = [
    'wireless headphones',
    'bluetooth speaker',
    'smart watch',
    'laptop computer',
    'phone case',
    'camera lens',
    'desk lamp',
    'cotton shirt',
    'running shoes',
    'gaming mouse'
  ]

  if (!query.trim()) return suggestions.slice(0, 5)

  return suggestions
    .filter(suggestion => suggestion.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8)
}

export const useAdvancedSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      // Initial state
      query: '',
      filters: {},
      results: [],
      suggestions: [],
      recentSearches: [],
      categories: [],
      brands: [],
      priceRange: [0, 1000],
      loading: false,
      error: null,
      totalResults: 0,
      currentPage: 1,
      totalPages: 0,
      searchTime: 0,

      // Actions
      setQuery: (query) => {
        set({ query })
        if (query.trim()) {
          get().getSuggestions(query)
        } else {
          set({ suggestions: [] })
        }
      },

      setFilters: (filters) => {
        set({ filters: { ...get().filters, ...filters } })
      },

      search: async (query, page = 1) => {
        set({ loading: true, error: null, currentPage: page })
        
        try {
          const { results, totalResults, totalPages, searchTime } = await mockSearch(
            query, 
            get().filters, 
            page
          )

          set({
            results: page === 1 ? results : [...get().results, ...results],
            totalResults,
            totalPages,
            searchTime,
            loading: false
          })

          // Add to recent searches if it's a new search (page 1)
          if (page === 1 && query.trim()) {
            get().addRecentSearch(query)
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Search failed',
            loading: false
          })
        }
      },

      loadMore: async () => {
        const { currentPage, totalPages, query } = get()
        if (currentPage < totalPages) {
          await get().search(query, currentPage + 1)
        }
      },

      getSuggestions: async (query) => {
        try {
          const suggestions = await mockGetSuggestions(query)
          set({ suggestions })
        } catch (error) {
          console.error('Failed to get suggestions:', error)
        }
      },

      clearResults: () => {
        set({ 
          results: [], 
          totalResults: 0, 
          totalPages: 0, 
          currentPage: 1,
          searchTime: 0 
        })
      },

      clearFilters: () => {
        set({ filters: {} })
      },

      addRecentSearch: (query) => {
        const trimmedQuery = query.trim()
        if (!trimmedQuery) return

        set(state => {
          const filtered = state.recentSearches.filter(search => search !== trimmedQuery)
          return {
            recentSearches: [trimmedQuery, ...filtered].slice(0, 10)
          }
        })
      },

      removeRecentSearch: (query) => {
        set(state => ({
          recentSearches: state.recentSearches.filter(search => search !== query)
        }))
      },

      clearRecentSearches: () => {
        set({ recentSearches: [] })
      },

      fetchCategories: async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 200))
          set({ categories: mockCategories })
        } catch (error) {
          console.error('Failed to fetch categories:', error)
        }
      },

      fetchBrands: async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 200))
          set({ brands: mockBrands })
        } catch (error) {
          console.error('Failed to fetch brands:', error)
        }
      },

      fetchPriceRange: async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 200))
          // In a real app, this would fetch the actual min/max prices from the API
          set({ priceRange: [0, 1000] })
        } catch (error) {
          console.error('Failed to fetch price range:', error)
        }
      },

      searchSimilar: async (productId) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 300))
          // In a real app, this would use ML/AI to find similar products
          const currentProduct = mockProducts.find(p => p.id === productId)
          if (!currentProduct) return []

          return mockProducts
            .filter(p => p.id !== productId && p.category === currentProduct.category)
            .slice(0, 6)
        } catch (error) {
          console.error('Failed to search similar products:', error)
          return []
        }
      },

      searchByImage: async (imageFile) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000))
          // In a real app, this would use image recognition AI
          return mockProducts.slice(0, 5)
        } catch (error) {
          console.error('Failed to search by image:', error)
          return []
        }
      },

      getPopularSearches: async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 200))
          return [
            'wireless headphones',
            'smart watch',
            'laptop',
            'phone case',
            'running shoes'
          ]
        } catch (error) {
          console.error('Failed to get popular searches:', error)
          return []
        }
      },

      getSearchTrends: async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 200))
          return [
            { term: 'wireless headphones', count: 1250 },
            { term: 'smart watch', count: 890 },
            { term: 'laptop computer', count: 567 },
            { term: 'phone accessories', count: 432 },
            { term: 'gaming peripherals', count: 234 }
          ]
        } catch (error) {
          console.error('Failed to get search trends:', error)
          return []
        }
      }
    }),
    {
      name: 'advanced-search-store',
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        filters: state.filters
      })
    }
  )
)