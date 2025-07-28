'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '../../../components/Header'
import { SupabaseProductService, type ProductWithCategory, type Category } from '@ecommerce/shared/src/services/supabaseProductService'
import { useCartStore } from '../../../lib/cart-store'
import { useRecommendationTracking } from '../../../hooks/useRecommendationTracking'
import { useProductDeal } from '../../../hooks/useDeals'

interface CategoryPageProps {
  category: Category | null
  products: ProductWithCategory[]
  loading: boolean
  error: string | null
}

interface ProductCardProps {
  product: ProductWithCategory
  onAddToCart: (product: ProductWithCategory) => void
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { trackAddToCart, navigateToProduct } = useRecommendationTracking()
  const { deal } = useProductDeal(product.id)

  const handleAddToCart = async () => {
    onAddToCart(product)
    await trackAddToCart(product.id, 1, {
      source: 'category_page',
      section: 'product_grid',
      category: product.category?.name || 'unknown'
    })
  }

  const handleProductClick = async () => {
    await navigateToProduct(product.id, {
      source: 'category_page',
      section: 'product_grid'
    })
  }

  const displayPrice = deal?.deal_price || product.price
  const originalPrice = deal?.original_price || product.compare_at_price

  const getBadge = () => {
    if (deal) return { text: `${deal.discount_percentage}% OFF`, color: 'bg-red-600' }
    if (product.featured) return { text: 'FEATURED', color: 'bg-purple-600' }
    
    const createdAt = new Date(product.created_at)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    if (createdAt > weekAgo) return { text: 'NEW', color: 'bg-green-600' }
    
    return null
  }

  const badge = getBadge()

  return (
    <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 relative">
      {badge && (
        <div className={`absolute top-2 left-2 z-10 px-2 py-1 rounded text-xs font-bold text-white ${badge.color}`}>
          {badge.text}
        </div>
      )}
      
      <div 
        className="relative h-64 bg-gray-50 overflow-hidden cursor-pointer"
        onClick={handleProductClick}
      >
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            width={300}
            height={256}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-purple-700 transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>
        
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className={`w-4 h-4 ${i < 4 ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-500">(4.0)</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xl font-bold ${deal ? 'text-red-600' : 'text-gray-900'}`}>
            ${displayPrice.toFixed(2)}
          </span>
          {originalPrice && originalPrice > displayPrice && (
            <span className="text-lg text-gray-500 line-through">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock indicator */}
        {product.inventory_quantity !== undefined && product.inventory_quantity <= 5 && product.inventory_quantity > 0 && (
          <p className="text-sm text-orange-600 mb-3">
            Only {product.inventory_quantity} left in stock!
          </p>
        )}
        {product.inventory_quantity === 0 && (
          <p className="text-sm text-red-600 mb-3">Out of Stock</p>
        )}

        <button 
          onClick={handleAddToCart}
          disabled={product.inventory_quantity === 0 || product.status !== 'active'}
          className="w-full text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: (product.inventory_quantity === 0 || product.status !== 'active') ? '#6B7280' : '#A0522D', 
            color: 'white'
          }}
          onMouseEnter={(e) => {
            if (product.inventory_quantity > 0 && product.status === 'active') {
              e.currentTarget.style.backgroundColor = '#8B4513'
            }
          }}
          onMouseLeave={(e) => {
            if (product.inventory_quantity > 0 && product.status === 'active') {
              e.currentTarget.style.backgroundColor = '#A0522D'
            }
          }}
        >
          {product.inventory_quantity === 0 ? 'Out of Stock' : product.status !== 'active' ? 'Unavailable' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}

function CategoryPageContent({ category, products, loading, error }: CategoryPageProps) {
  const { addItem } = useCartStore()
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'created_at'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filteredProducts, setFilteredProducts] = useState<ProductWithCategory[]>(products)

  const handleAddToCart = (product: ProductWithCategory) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      quantity: 1
    })
  }

  useEffect(() => {
    let sorted = [...products]
    
    sorted.sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]
      
      if (sortBy === 'name') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    setFilteredProducts(sorted)
  }, [products, sortBy, sortDirection])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{category?.name || 'Category'}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{category?.name}</h1>
          {category?.description && (
            <p className="text-gray-600 text-lg">{category.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select 
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-')
                setSortBy(field as 'name' | 'price' | 'created_at')
                setSortDirection(direction as 'asc' | 'desc')
              }}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price Low to High</option>
              <option value="price-desc">Price High to Low</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500">
            Showing {filteredProducts.length} results
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              We don't have any products in this category yet. Check back later!
            </p>
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategoryData() {
      if (!slug) return

      try {
        setLoading(true)
        setError(null)

        // Get all categories to find the one with matching slug
        const { data: categories, error: catError } = await SupabaseProductService.getCategories()
        
        if (catError) {
          setError('Failed to load categories')
          return
        }

        const foundCategory = categories.find(cat => 
          cat.slug.toLowerCase() === slug.toLowerCase()
        )

        if (!foundCategory) {
          setError(`Category "${slug}" not found`)
          return
        }

        setCategory(foundCategory)

        // Get products for this category
        const { data: categoryProducts, error: prodError } = await SupabaseProductService.getProductsByCategory(foundCategory.id)
        
        if (prodError) {
          setError('Failed to load products')
          return
        }

        setProducts(categoryProducts)

      } catch (err) {
        setError('An unexpected error occurred')
        console.error('Category page error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryData()
  }, [slug])

  return (
    <CategoryPageContent 
      category={category}
      products={products}
      loading={loading}
      error={error}
    />
  )
}