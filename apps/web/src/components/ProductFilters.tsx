'use client'

import { useState, useEffect } from 'react'
import { useSearchStore, useSearchFilters, useHasActiveFilters, useActiveFilterCount } from '../lib/search-store'

interface ProductFiltersProps {
  className?: string
  isMobile?: boolean
  onClose?: () => void
}

export function ProductFilters({ className = '', isMobile = false, onClose }: ProductFiltersProps) {
  const {
    filters,
    setFilter,
    clearFilters,
    categories,
    brands,
    priceRanges,
    loadFilterOptions
  } = useSearchStore()
  
  const hasActiveFilters = useHasActiveFilters()
  const activeFilterCount = useActiveFilterCount()
  
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    brand: true,
    price: true,
    rating: true,
    availability: true
  })

  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handlePriceRangeChange = (min: number, max: number) => {
    setFilter('minPrice', min)
    setFilter('maxPrice', max)
  }

  const FilterSection = ({ 
    title, 
    section, 
    children 
  }: { 
    title: string
    section: keyof typeof expandedSections
    children: React.ReactNode 
  }) => (
    <div className="border-b border-gray-200 pb-6">
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full py-3 text-left"
      >
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            expandedSections[section] ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {expandedSections[section] && (
        <div className="mt-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  )

  const StarRating = ({ rating, onClick }: { rating: number; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 text-sm transition-colors ${
        filters.rating === rating
          ? 'text-yellow-600 font-medium'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        ))}
      </div>
      <span>{rating} stars & up</span>
    </button>
  )

  return (
    <div className={`bg-white ${isMobile ? 'h-full' : 'sticky top-8'} ${className}`}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-6`}>
        {/* Filter Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {activeFilterCount}
              </span>
            )}
          </h2>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Category Filter */}
        <FilterSection title="Category" section="category">
          <div className="space-y-2">
            <button
              onClick={() => setFilter('category', '')}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                filters.category === ''
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter('category', category)}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  filters.category === category
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Brand Filter */}
        <FilterSection title="Brand" section="brand">
          <div className="space-y-2">
            <button
              onClick={() => setFilter('brand', '')}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                filters.brand === ''
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Brands
            </button>
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => setFilter('brand', brand)}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  filters.brand === brand
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Price Filter */}
        <FilterSection title="Price Range" section="price">
          <div className="space-y-3">
            {/* Custom Price Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Min Price
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={filters.minPrice}
                  onChange={(e) => setFilter('minPrice', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="$0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Max Price
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilter('maxPrice', Math.min(10000, parseInt(e.target.value) || 10000))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="$10000"
                />
              </div>
            </div>
            
            {/* Predefined Price Ranges */}
            <div className="space-y-2">
              {priceRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => handlePriceRangeChange(range.min, range.max)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    filters.minPrice === range.min && filters.maxPrice === range.max
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </FilterSection>

        {/* Rating Filter */}
        <FilterSection title="Customer Rating" section="rating">
          <div className="space-y-2">
            <button
              onClick={() => setFilter('rating', 0)}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                filters.rating === 0
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Ratings
            </button>
            {[4, 3, 2, 1].map((rating) => (
              <div key={rating} className="px-3 py-2">
                <StarRating
                  rating={rating}
                  onClick={() => setFilter('rating', rating)}
                />
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Availability Filter */}
        <FilterSection title="Availability" section="availability">
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => setFilter('inStock', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700">In Stock Only</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.onSale}
                onChange={(e) => setFilter('onSale', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700">On Sale</span>
            </label>
          </div>
        </FilterSection>
      </div>

      {/* Mobile Apply Button */}
      {isMobile && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Apply Filters
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </button>
        </div>
      )}
    </div>
  )
}