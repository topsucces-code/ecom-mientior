'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchStore, useSearchSuggestions, useRecentSearches } from '../lib/search-store'

interface SearchBarProps {
  className?: string
  placeholder?: string
  autoFocus?: boolean
}

export function SearchBar({ 
  className = '', 
  placeholder = 'Search products...', 
  autoFocus = false 
}: SearchBarProps) {
  const router = useRouter()
  const { filters, setFilter, search, loadSuggestions, addRecentSearch } = useSearchStore()
  const suggestions = useSearchSuggestions()
  const recentSearches = useRecentSearches()
  
  const [query, setQuery] = useState(filters.query)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Debounced suggestion loading
  const debouncedLoadSuggestions = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        loadSuggestions(searchQuery)
      }
    }, 300)
  }, [loadSuggestions])

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    setSelectedIndex(-1)
    
    if (newQuery.trim()) {
      debouncedLoadSuggestions(newQuery)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
  }

  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    setFilter('query', searchQuery.trim())
    addRecentSearch(searchQuery.trim())
    setShowSuggestions(false)
    
    // Navigate to products page with search
    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  const handleSuggestionClick = (suggestion: string, type?: string) => {
    setQuery(suggestion)
    performSearch(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    const suggestionsList = getSuggestionsList()
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestionsList.length - 1 ? prev + 1 : 0
        )
        break
        
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestionsList.length - 1
        )
        break
        
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestionsList.length) {
          const selectedSuggestion = suggestionsList[selectedIndex]
          handleSuggestionClick(selectedSuggestion.text)
        } else {
          performSearch(query)
        }
        break
        
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const getSuggestionsList = () => {
    const items: Array<{ text: string; type: string; isRecent?: boolean }> = []
    
    // Add recent searches if no current suggestions and input is focused
    if (suggestions.length === 0 && isFocused && !query.trim()) {
      items.push(...recentSearches.slice(0, 5).map(search => ({
        text: search,
        type: 'recent',
        isRecent: true
      })))
    } else {
      // Add current suggestions
      items.push(...suggestions.map(s => ({
        text: s.text,
        type: s.type
      })))
    }
    
    return items
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )
      case 'category':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      case 'brand':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        )
      case 'recent':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )
    }
  }

  const suggestionsList = getSuggestionsList()

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true)
              if (!query.trim() && recentSearches.length > 0) {
                setShowSuggestions(true)
              }
            }}
            onBlur={() => {
              setIsFocused(false)
              // Delay hiding suggestions to allow clicks
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            placeholder={placeholder}
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setShowSuggestions(false)
                inputRef.current?.focus()
              }}
              className="absolute inset-y-0 right-10 flex items-center pr-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <button
          type="submit"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestionsList.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {!query.trim() && recentSearches.length > 0 && (
            <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
              Recent searches
            </div>
          )}
          
          {suggestionsList.map((item, index) => (
            <button
              key={`${item.type}_${item.text}_${index}`}
              onClick={() => handleSuggestionClick(item.text, item.type)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="mr-3">
                {getSuggestionIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {item.text}
                </div>
                {item.type !== 'recent' && (
                  <div className="text-xs text-gray-500 capitalize">
                    in {item.type === 'product' ? 'products' : `${item.type}s`}
                  </div>
                )}
              </div>
              {item.isRecent && (
                <div className="text-xs text-gray-400">
                  Recent
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}