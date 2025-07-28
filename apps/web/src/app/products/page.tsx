'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Header } from '../../components/Header'
import { SearchBar } from '../../components/SearchBar'
import { ProductFilters } from '../../components/ProductFilters'
import { ProductCard } from '../../components/ProductCard'
import { VirtualizedProductGrid } from '../../components/VirtualizedProductGrid'
import { useSearchStore, useSearchResults, useSearchLoading, useSearchFilters, useHasActiveFilters } from '../../lib/search-store'
import { useCartStore } from '../../lib/cart-store'
import type { Product } from '@ecommerce/shared'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const { 
    search, 
    setFilter, 
    filters: searchFilters, 
    results, 
    loading, 
    totalResults, 
    currentPage, 
    resultsPerPage,
    setPage
  } = useSearchStore()
  
  const { addItem } = useCartStore()
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [useVirtualization, setUseVirtualization] = useState(false)
  const hasActiveFilters = useHasActiveFilters()

  // Initialize search from URL parameters
  useEffect(() => {
    const searchQuery = searchParams.get('search')
    if (searchQuery) {
      setFilter('query', searchQuery)
      search(searchQuery)
    } else {
      search()
    }
  }, [searchParams, setFilter, search])

  // Enable virtualization for large result sets
  useEffect(() => {
    setUseVirtualization(results.length > 50)
  }, [results.length])

  const handleAddToCart = (product: Product) => {
    addItem(product)
  }

  const handleSortChange = (sortBy: typeof searchFilters.sortBy) => {
    setFilter('sortBy', sortBy)
  }

  const totalPages = Math.ceil(totalResults / resultsPerPage)
  const startResult = (currentPage - 1) * resultsPerPage + 1
  const endResult = Math.min(currentPage * resultsPerPage, totalResults)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <Header />
      
      {/* Enhanced Hero Section with Background Image */}
      <section className="relative overflow-hidden" style={{
        backgroundImage: 'linear-gradient(rgba(138, 43, 226, 0.8), rgba(160, 82, 45, 0.8)), url("https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 animate-bounce text-white/20">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <div className="absolute top-20 right-20 animate-pulse text-white/15">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </div>
          <div className="absolute bottom-10 left-1/4 animate-spin text-white/20" style={{animationDuration: '4s'}}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        </div>

        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Breadcrumb */}
            <nav className="flex mb-8" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <Link href="/" className="text-white/80 hover:text-white transition-colors flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                    </svg>
                    Home
                  </Link>
                </li>
                <li>
                  <svg className="w-5 h-5 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li>
                  <span className="text-white font-medium">Products</span>
                </li>
              </ol>
            </nav>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up">
                Discover Amazing Products
              </h1>
              
              {searchFilters.query ? (
                <p className="text-xl text-white/90 mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                  Search results for &ldquo;<span className="font-semibold text-yellow-300">{searchFilters.query}</span>&rdquo;
                </p>
              ) : (
                <p className="text-xl text-white/90 mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                  Find exactly what you're looking for from thousands of products
                </p>
              )}
              
              {/* Enhanced Search Bar */}
              <div className="max-w-2xl mx-auto animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <SearchBar placeholder="Search products, brands, categories..." />
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-center space-x-8 mt-8 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{totalResults.toLocaleString()}</div>
                  <div className="text-sm text-white/80">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">50+</div>
                  <div className="text-sm text-white/80">Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">4.8★</div>
                  <div className="text-sm text-white/80">Avg Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-from-right {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
          }
          50% {
            box-shadow: 0 0 30px rgba(168, 85, 247, 0.6);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slide-in-from-right 0.6s ease-out forwards;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .gradient-border {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2px;
          border-radius: 16px;
        }
        
        .gradient-border-inner {
          background: white;
          border-radius: 14px;
          height: 100%;
          width: 100%;
        }
      `}</style>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Desktop Filters Sidebar */}
          <aside className="hidden lg:block lg:w-80">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-8">
              <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, #8A2BE2 0%, #A0522D 100%)' }}>
                <div className="flex items-center text-white">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <h3 className="text-lg font-semibold">Filtres</h3>
                </div>
                {hasActiveFilters && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                      <span className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: '#8B4513' }}></span>
                      Filtres Actifs
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <ProductFilters />
              </div>
            </div>
          </aside>

          {/* Enhanced Main Content */}
          <main className="flex-1">
            {/* Modern Results Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                      <p className="text-lg font-semibold text-gray-900">
                        {loading ? 'Searching...' : `${totalResults.toLocaleString()} Products Found`}
                      </p>
                    </div>
                  </div>
                  {!loading && (
                    <p className="text-sm text-gray-500 mt-1">
                      Showing {startResult}-{endResult} of {totalResults} results
                    </p>
                  )}
                  {hasActiveFilters && (
                    <div className="flex items-center mt-2">
                      <svg className="w-4 h-4 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-blue-600 font-medium">Filters Applied</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  {/* Enhanced Mobile Filter Button */}
                  <button
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden flex items-center px-6 py-3 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #8A2BE2 0%, #A0522D 100%)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #8B4513 0%, #8A2BE2 100%)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #8A2BE2 0%, #A0522D 100%)'
                    }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filtres
                    {hasActiveFilters && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#8B4513' }}>
                        Actif
                      </span>
                    )}
                  </button>

                  {/* Enhanced Sort Dropdown */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                    <select
                      value={searchFilters.sortBy}
                      onChange={(e) => handleSortChange(e.target.value as typeof searchFilters.sortBy)}
                      className="pl-10 pr-8 py-3 border border-gray-200 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="relevance">Most Relevant</option>
                      <option value="newest">Newest First</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                      <option value="popular">Most Popular</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Products Grid Section */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="group">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-pulse hover:shadow-xl transition-all duration-300">
                      <div className="relative">
                        <div className="w-full h-56 bg-gradient-to-br from-gray-200 to-gray-300"></div>
                        <div className="absolute top-3 right-3 w-8 h-8 bg-gray-300 rounded-full"></div>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded-lg w-1/2"></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="h-6 bg-gray-200 rounded-lg w-1/3"></div>
                          <div className="h-8 bg-gray-200 rounded-lg w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No products found</h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      {searchFilters.query 
                        ? `We couldn't find any products matching "${searchFilters.query}". Try adjusting your search or filters.`
                        : 'No products match your current filters. Try adjusting your criteria to see more results.'
                      }
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setFilter('query', '')
                          search('')
                        }}
                        className="inline-flex items-center px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #8A2BE2 0%, #A0522D 100%)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #8B4513 0%, #8A2BE2 100%)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #8A2BE2 0%, #A0522D 100%)'
                        }}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Effacer tous les Filtres
                      </button>
                      <div className="text-sm text-gray-500">
                        or <a href="/" className="text-purple-600 hover:text-purple-700 font-medium">return to homepage</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Performance Toggle */}
                {results.length > 20 && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">Performance Mode</h4>
                          <p className="text-xs text-gray-600">Currently using: <span className="font-medium">{useVirtualization ? 'Virtualized Grid' : 'Standard Grid'}</span></p>
                        </div>
                      </div>
                      <button
                        onClick={() => setUseVirtualization(!useVirtualization)}
                        className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Switch to {useVirtualization ? 'Standard' : 'Virtualized'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Enhanced Product Grid */}
                {useVirtualization ? (
                  <VirtualizedProductGrid
                    products={results}
                    onAddToCart={handleAddToCart}
                    containerHeight={800}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {results.map((product, index) => (
                      <div 
                        key={product.id} 
                        className="group animate-fade-in-up h-full"
                        style={{ animationDelay: `${(index % 12) * 50}ms` }}
                      >
                        <ProductCard
                          product={product}
                          onAddToCart={handleAddToCart}
                          className="h-full"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Enhanced Pagination */}
                {totalPages > 1 && !useVirtualization && (
                  <div className="mt-12 flex flex-col items-center space-y-4">
                    <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
                      Page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                    </div>
                    <nav className="flex items-center space-x-1">
                      <button
                        onClick={() => setPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="group flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Précédent
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          const page = i + 1
                          return (
                            <button
                              key={page}
                              onClick={() => setPage(page)}
                              className={`w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 ${
                                currentPage === page
                                  ? 'text-white shadow-lg transform scale-105'
                                  : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md'
                              }`}
                              style={currentPage === page ? { background: 'linear-gradient(135deg, #8A2BE2 0%, #A0522D 100%)' } : {}}
                            >
                              {page}
                            </button>
                          )
                        })}
                      </div>
                      
                      <button
                        onClick={() => setPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="group flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        Suivant
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Enhanced Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowMobileFilters(false)} 
          />
          
          {/* Modal */}
          <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl transform transition-transform">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #8A2BE2 0%, #A0522D 100%)' }}>
              <div className="flex items-center text-white">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <h3 className="text-lg font-semibold">Filtres</h3>
              </div>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <ProductFilters 
                isMobile={true} 
                onClose={() => setShowMobileFilters(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}