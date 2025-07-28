'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchStore } from '../lib/search-store'
import { useRouter, useSearchParams } from 'next/navigation'

interface SearchFilters {
  category: string
  priceRange: [number, number]
  rating: number
  inStock: boolean
  brand: string
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular'
  tags: string[]
}

interface AdvancedSearchProps {
  className?: string
  onClose?: () => void
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ className = '', onClose }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const {
    query,
    filters,
    suggestions,
    recentSearches,
    results,
    loading,
    categories,
    brands,
    priceRange,
    setQuery,
    setFilters,
    search,
    clearFilters,
    addRecentSearch,
    fetchCategories,
    fetchBrands,
    fetchPriceRange
  } = useSearchStore()

  const [localFilters, setLocalFilters] = useState<SearchFilters>({
    category: '',
    priceRange: [0, 1000],
    rating: 0,
    inStock: false,
    brand: '',
    sortBy: 'relevance',
    tags: []
  })

  const [showFilters, setShowFilters] = useState(false)
  const [activeFilterCount, setActiveFilterCount] = useState(0)

  // Initialize from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    const urlCategory = searchParams.get('category') || ''
    const urlBrand = searchParams.get('brand') || ''
    const urlMinPrice = Number(searchParams.get('min_price')) || 0
    const urlMaxPrice = Number(searchParams.get('max_price')) || 1000
    const urlRating = Number(searchParams.get('rating')) || 0
    const urlInStock = searchParams.get('in_stock') === 'true'
    const urlSort = searchParams.get('sort') as SearchFilters['sortBy'] || 'relevance'

    setQuery(urlQuery)
    setLocalFilters({
      category: urlCategory,
      priceRange: [urlMinPrice, urlMaxPrice],
      rating: urlRating,
      inStock: urlInStock,
      brand: urlBrand,
      sortBy: urlSort,
      tags: []
    })

    // Load initial data
    fetchCategories()
    fetchBrands()
    fetchPriceRange()
  }, [searchParams, setQuery, fetchCategories, fetchBrands, fetchPriceRange])

  // Count active filters
  useEffect(() => {
    let count = 0
    if (localFilters.category) count++
    if (localFilters.brand) count++
    if (localFilters.rating > 0) count++
    if (localFilters.inStock) count++
    if (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 1000) count++
    if (localFilters.tags.length > 0) count++
    setActiveFilterCount(count)
  }, [localFilters])

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query
    
    if (!queryToSearch.trim()) return

    // Add to recent searches
    addRecentSearch(queryToSearch)

    // Apply filters
    setFilters(localFilters)

    // Perform search
    await search(queryToSearch)

    // Update URL
    const params = new URLSearchParams()
    params.set('q', queryToSearch)
    
    if (localFilters.category) params.set('category', localFilters.category)
    if (localFilters.brand) params.set('brand', localFilters.brand)
    if (localFilters.rating > 0) params.set('rating', localFilters.rating.toString())
    if (localFilters.inStock) params.set('in_stock', 'true')
    if (localFilters.priceRange[0] > 0) params.set('min_price', localFilters.priceRange[0].toString())
    if (localFilters.priceRange[1] < 1000) params.set('max_price', localFilters.priceRange[1].toString())
    if (localFilters.sortBy !== 'relevance') params.set('sort', localFilters.sortBy)

    router.push(`/search?${params.toString()}`)
    
    if (onClose) onClose()
  }, [query, localFilters, setFilters, search, addRecentSearch, router, onClose])

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setLocalFilters({
      category: '',
      priceRange: [0, 1000],
      rating: 0,
      inStock: false,
      brand: '',
      sortBy: 'relevance',
      tags: []
    })
    clearFilters()
  }

  const handleQuickSearch = (searchTerm: string) => {
    setQuery(searchTerm)
    handleSearch(searchTerm)
  }

  const ratingStars = [1, 2, 3, 4, 5]

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search products, brands, categories..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || loading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-lg font-medium text-sm transition-colors relative ${
              showFilters 
                ? 'border-purple-500 bg-purple-50 text-purple-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Quick Suggestions */}
      {query && suggestions.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h4>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 6).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleQuickSearch(suggestion)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h4>
          <div className="space-y-1">
            {recentSearches.slice(0, 5).map((search, index) => (
              <button
                key={index}
                onClick={() => handleQuickSearch(search)}
                className="flex items-center w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
              >
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Advanced Filters</h4>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={localFilters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <select
                value={localFilters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={localFilters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range: ${localFilters.priceRange[0]} - ${localFilters.priceRange[1]}
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={localFilters.priceRange[0]}
                  onChange={(e) => handleFilterChange('priceRange', [Number(e.target.value), localFilters.priceRange[1]])}
                  placeholder="Min"
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={localFilters.priceRange[0]}
                  onChange={(e) => handleFilterChange('priceRange', [Number(e.target.value), localFilters.priceRange[1]])}
                  className="flex-1"
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={localFilters.priceRange[1]}
                  onChange={(e) => handleFilterChange('priceRange', [localFilters.priceRange[0], Number(e.target.value)])}
                  className="flex-1"
                />
                <input
                  type="number"
                  value={localFilters.priceRange[1]}
                  onChange={(e) => handleFilterChange('priceRange', [localFilters.priceRange[0], Number(e.target.value)])}
                  placeholder="Max"
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
              <div className="flex items-center space-x-1">
                {ratingStars.map((star) => (
                  <button
                    key={star}
                    onClick={() => handleFilterChange('rating', star === localFilters.rating ? 0 : star)}
                    className={`w-6 h-6 ${
                      star <= localFilters.rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500">
                  {localFilters.rating > 0 ? `${localFilters.rating}+ stars` : 'Any rating'}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.inStock}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
              </label>
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleSearch()}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-medium text-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      {results.length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
            {activeFilterCount > 0 && (
              <p className="text-sm text-purple-600">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedSearch