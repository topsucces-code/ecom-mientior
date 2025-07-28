'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '../../components/Header'
import { ComparisonButton } from '../../components/ComparisonButton'
import { WishlistButton } from '../../components/WishlistButton'
import { StarRating } from '../../components/StarRating'
import { Button } from '@ecommerce/ui'
import { useComparisonStore } from '../../lib/comparison-store'
import { useCartStore } from '../../lib/cart-store'
import { useReviewsStore } from '../../lib/reviews-store'

export default function ComparePage() {
  const { items, clearComparison } = useComparisonStore()
  const { addItem } = useCartStore()
  const { getProductRating } = useReviewsStore()
  const [isClearing, setIsClearing] = useState(false)

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1
    })
  }

  const handleClearComparison = async () => {
    setIsClearing(true)
    setTimeout(() => {
      clearComparison()
      setIsClearing(false)
    }, 500)
  }

  // Sample specifications for demo
  const getSpecifications = (productId: string) => ({
    brand: items.find(item => item.id === productId)?.brand || 'N/A',
    weight: '1.2kg',
    dimensions: '10 x 15 x 20 cm',
    warranty: '2 years',
    color: 'Black',
    material: 'Premium Quality'
  })

  const features = [
    'Wireless Connectivity',
    'Fast Charging',
    'Water Resistant',
    'Long Battery Life',
    'Premium Build Quality',
    'Smart Features'
  ]

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
                <span className="text-gray-900 font-medium">Product Comparison</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Comparison</h1>
              <p className="text-gray-600">
                {items.length === 0 
                  ? "No products to compare yet" 
                  : `Comparing ${items.length} product${items.length === 1 ? '' : 's'}`
                }
              </p>
            </div>
            {items.length > 0 && (
              <div className="mt-4 md:mt-0 flex gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Add More Products
                </Link>
                <Button
                  variant="outline"
                  onClick={handleClearComparison}
                  disabled={isClearing}
                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                >
                  {isClearing ? 'Clearing...' : 'Clear All'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products to compare</h3>
              <p className="text-gray-600 mb-6">
                Start by adding products to your comparison from the product pages or catalog.
              </p>
              <Link 
                href="/products"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-4 font-semibold text-gray-900 bg-gray-50 min-w-[200px]">
                      Product
                    </th>
                    {items.map((item) => (
                      <th key={item.id} className="p-4 min-w-[250px]">
                        <div className="text-center">
                          <div className="relative mb-4">
                            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            </div>
                            <div className="absolute top-2 right-2">
                              <ComparisonButton 
                                product={{
                                  id: item.id,
                                  name: item.name,
                                  price: item.price,
                                  images: [item.image]
                                } as any}
                                size="sm"
                              />
                            </div>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2 text-sm line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="text-2xl font-bold text-gray-900 mb-3">
                            ${item.price}
                          </div>
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-2 px-3 rounded-md font-medium transition-colors text-sm"
                            >
                              Add to Cart
                            </button>
                            <WishlistButton 
                              product={{
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                images: [item.image]
                              } as any}
                              size="sm"
                            />
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Rating Row */}
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-medium text-gray-900 bg-gray-50">
                      Customer Rating
                    </td>
                    {items.map((item) => {
                      const { average, total } = getProductRating(item.id)
                      return (
                        <td key={item.id} className="p-4 text-center">
                          <div className="flex flex-col items-center">
                            <StarRating rating={average} size="sm" />
                            <span className="text-sm text-gray-600 mt-1">
                              {total > 0 ? `${average.toFixed(1)} (${total} reviews)` : 'No reviews'}
                            </span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>

                  {/* Brand Row */}
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-medium text-gray-900 bg-gray-50">
                      Brand
                    </td>
                    {items.map((item) => (
                      <td key={item.id} className="p-4 text-center">
                        {item.brand || 'N/A'}
                      </td>
                    ))}
                  </tr>

                  {/* Featured Row */}
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-medium text-gray-900 bg-gray-50">
                      Featured Product
                    </td>
                    {items.map((item) => (
                      <td key={item.id} className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.featured 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.featured ? 'Yes' : 'No'}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Specifications */}
                  {Object.entries(getSpecifications(items[0]?.id || '')).map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-900 bg-gray-50 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </td>
                      {items.map((item) => {
                        const specs = getSpecifications(item.id)
                        return (
                          <td key={item.id} className="p-4 text-center">
                            {specs[key as keyof typeof specs]}
                          </td>
                        )
                      })}
                    </tr>
                  ))}

                  {/* Features */}
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-medium text-gray-900 bg-gray-50">
                      Key Features
                    </td>
                    {items.map((item) => (
                      <td key={item.id} className="p-4">
                        <div className="space-y-2">
                          {features.slice(0, Math.floor(Math.random() * 3) + 3).map((feature, index) => (
                            <div key={index} className="flex items-center text-sm">
                              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {items.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => items.forEach(item => handleAddToCart(item))}
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
                </svg>
                Add All to Cart
              </button>
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add More Products
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}