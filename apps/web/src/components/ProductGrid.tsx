'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { ProductCard, LoadingSpinner, Button } from '@ecommerce/ui'
import { ProductService } from '../lib/products'
import type { Product, ProductSearchParams } from '@ecommerce/shared'

interface ProductGridProps {
  initialProducts?: Product[]
  searchParams?: ProductSearchParams
  onAddToCart?: (productId: string, product?: Product) => void
}

export const ProductGrid = memo(function ProductGrid({ initialProducts = [], searchParams = {}, onAddToCart }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const loadProducts = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      const result = await ProductService.getProducts({
        ...searchParams,
        page,
      })

      if (append) {
        setProducts(prev => [...prev, ...result.products])
      } else {
        setProducts(result.products)
      }

      setCurrentPage(result.currentPage)
      setTotalPages(result.totalPages)
      setHasMore(result.currentPage < result.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    if (initialProducts.length === 0) {
      loadProducts(1, false)
    }
  }, [searchParams, initialProducts.length, loadProducts])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadProducts(currentPage + 1, true)
    }
  }

  const handleViewProduct = (productId: string) => {
    window.location.href = `/products/${productId}`
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => loadProducts(1, false)}>
          Try Again
        </Button>
      </div>
    )
  }

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No products found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            price={product.price}
            compareAtPrice={product.compare_at_price || undefined}
            image={product.images[0]}
            images={product.images}
            brand={product.brand || undefined}
            inStock={product.inventory_quantity > 0}
            featured={product.featured}
            onAddToCart={() => onAddToCart?.(product.id, product)}
            onViewProduct={handleViewProduct}
          />
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Products'}
          </Button>
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <div className="text-center mt-8">
          <p className="text-gray-500">
            Showing all {products.length} products
          </p>
        </div>
      )}
    </div>
  )
})