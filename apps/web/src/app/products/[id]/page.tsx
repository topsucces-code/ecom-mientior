'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '../../../components/Header'
import { ProductReviews } from '../../../components/ProductReviews'
import { StarRating } from '../../../components/StarRating'
import { WishlistButton } from '../../../components/WishlistButton'
import { ComparisonButton } from '../../../components/ComparisonButton'
import { Button, Badge } from '@ecommerce/ui'
import { useCartStore } from '../../../lib/cart-store'
import { useSupabaseProducts } from '../../../hooks/useSupabaseProducts'
import { useSupabaseReviews } from '../../../hooks/useSupabaseReviews'
import { supabase } from '../../../lib/supabase'
import type { Product } from '../../../lib/supabase'

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const { addItem } = useCartStore()
  
  // Use Supabase hooks for reviews
  const { 
    reviews, 
    averageRating, 
    totalReviews,
    loading: reviewsLoading 
  } = useSupabaseReviews(product?.id)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true)
        
        // Load single product from Supabase
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            categories (
              id,
              name,
              slug
            )
          `)
          .eq('id', params.id as string)
          .eq('status', 'active')
          .single()

        if (productError) throw productError
        if (!productData) throw new Error('Product not found')

        setProduct(productData)

        // Load related products from same category
        if (productData.category_id) {
          const { data: relatedData, error: relatedError } = await supabase
            .from('products')
            .select(`
              *,
              categories (
                id,
                name
              )
            `)
            .eq('category_id', productData.category_id)
            .eq('status', 'active')
            .neq('id', productData.id)
            .limit(4)

          if (!relatedError && relatedData) {
            setRelatedProducts(relatedData)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadProduct()
    }
  }, [params.id])

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addItem(product)
      }
    }
  }

  const handleBuyNow = () => {
    if (product) {
      addItem(product)
      window.location.href = '/checkout'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Product not found'}
            </h1>
            <Button onClick={() => window.location.href = '/products'}>
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const discountPercentage = product.compare_at_price 
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0

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
                <Link href="/products" className="text-gray-500 hover:text-gray-900 transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{product.name}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative bg-white rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 && product.images[selectedImageIndex] ? (
                <Image
                  src={product.images[selectedImageIndex]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              )}
              {product.featured && (
                <Badge
                  variant="secondary"
                  className="absolute top-4 left-4"
                >
                  Featured
                </Badge>
              )}
              {discountPercentage > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute top-4 right-4"
                >
                  -{discountPercentage}%
                </Badge>
              )}
            </div>
            
            {/* Image Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 relative rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index
                        ? 'border-primary-600'
                        : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              {product.brand && (
                <p className="text-lg text-gray-600 mb-4">by {product.brand}</p>
              )}
              
              {/* Product Rating */}
              <div className="mb-4">
                <StarRating 
                  rating={averageRating} 
                  size="lg" 
                  showCount 
                  count={totalReviews}
                />
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-3xl font-bold text-purple-600">
                  ${product.price.toFixed(2)}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-xl text-gray-500 line-through">
                    ${product.compare_at_price.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Badge
                  variant={product.inventory_quantity > 0 ? 'default' : 'destructive'}
                >
                  {product.inventory_quantity > 0 
                    ? `${product.inventory_quantity} in stock`
                    : 'Out of stock'
                  }
                </Badge>
                <span className="text-sm text-gray-500">SKU: {product.sku}</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Product Specifications */}
            {(product.weight || product.dimensions) && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Specifications</h3>
                <div className="space-y-2">
                  {product.weight && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weight:</span>
                      <span>{product.weight}kg</span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dimensions:</span>
                      <span>{product.dimensions}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add to Cart Section */}
            <div className="border-t pt-6">
              <div className="flex items-center space-x-4 mb-4">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Quantity:
                </label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1"
                  disabled={product.inventory_quantity === 0}
                >
                  {[...Array(Math.min(10, product.inventory_quantity))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mb-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.inventory_quantity === 0}
                  className="flex-1"
                >
                  Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  variant="outline"
                  disabled={product.inventory_quantity === 0}
                  className="flex-1"
                >
                  Buy Now
                </Button>
              </div>
              
              <div className="flex gap-3">
                <WishlistButton 
                  productId={product.id}
                  size="lg"
                  showText
                  className="flex-1"
                />
                <ComparisonButton 
                  product={product}
                  size="lg"
                  showText
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'description', name: 'Description' },
                { id: 'reviews', name: `Avis (${totalReviews || 0})` },
                { id: 'specifications', name: 'Specifications' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-4">Product Description</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {product.description}
                </p>
                
                {product.tags && product.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <ProductReviews 
                productId={product.id}
                productName={product.name}
              />
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Product Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-medium text-gray-600">Product ID:</span>
                      <span>{product.sku}</span>
                    </div>
                    {product.weight && (
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-600">Weight:</span>
                        <span>{product.weight}kg</span>
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-600">Dimensions:</span>
                        <span>{product.dimensions}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-medium text-gray-600">Availability:</span>
                      <span className={product.inventory_quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                        {product.inventory_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {product.brand && (
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-600">Brand:</span>
                        <span>{product.brand}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-medium text-gray-600">Featured:</span>
                      <span>{product.featured ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => window.location.href = `/products/${relatedProduct.id}`}
                >
                  <div className="aspect-square relative">
                    {relatedProduct.images && relatedProduct.images.length > 0 ? (
                      <Image
                        src={relatedProduct.images[0]}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-purple-600 font-bold">
                      ${relatedProduct.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}