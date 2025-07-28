import { create } from 'zustand'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

interface CacheStore {
  cache: Map<string, CacheEntry<any>>
  
  // Actions
  set: <T>(key: string, data: T, ttl?: number) => void
  get: <T>(key: string) => T | null
  has: (key: string) => boolean
  delete: (key: string) => void
  clear: () => void
  cleanup: () => void
  
  // Search-specific caching
  setSearchResults: (query: string, filters: any, results: any, total: number) => void
  getSearchResults: (query: string, filters: any) => { results: any[]; total: number } | null
}

// Default TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000

export const useCacheStore = create<CacheStore>((set, get) => ({
  cache: new Map(),

  set: <T>(key: string, data: T, ttl = DEFAULT_TTL) => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    }
    
    set(state => {
      const newCache = new Map(state.cache)
      newCache.set(key, entry)
      return { cache: newCache }
    })
  },

  get: <T>(key: string): T | null => {
    const { cache } = get()
    const entry = cache.get(key)
    
    if (!entry) {
      return null
    }
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      get().delete(key)
      return null
    }
    
    return entry.data
  },

  has: (key: string) => {
    const { cache } = get()
    const entry = cache.get(key)
    
    if (!entry) {
      return false
    }
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      get().delete(key)
      return false
    }
    
    return true
  },

  delete: (key: string) => {
    set(state => {
      const newCache = new Map(state.cache)
      newCache.delete(key)
      return { cache: newCache }
    })
  },

  clear: () => {
    set({ cache: new Map() })
  },

  cleanup: () => {
    const { cache } = get()
    const now = Date.now()
    const newCache = new Map()
    
    cache.forEach((entry, key) => {
      if (now <= entry.expiry) {
        newCache.set(key, entry)
      }
    })
    
    set({ cache: newCache })
  },

  setSearchResults: (query: string, filters: any, results: any[], total: number) => {
    const cacheKey = `search:${query}:${JSON.stringify(filters)}`
    get().set(cacheKey, { results, total }, 2 * 60 * 1000) // 2 minutes for search results
  },

  getSearchResults: (query: string, filters: any) => {
    const cacheKey = `search:${query}:${JSON.stringify(filters)}`
    return get().get(cacheKey)
  }
}))

// Cleanup expired cache entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    useCacheStore.getState().cleanup()
  }, 5 * 60 * 1000)
}