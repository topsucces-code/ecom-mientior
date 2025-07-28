'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '../components/Header'
import { PromoBanner } from '../components/PromoBanner'
import { SupabaseProductGrid } from '../components/SupabaseProductGrid'
import { useSupabaseProducts } from '../hooks/useSupabaseProducts'
import type { Product } from '../lib/supabase'

// Mock store for cart functionality
const useCartStore = () => ({
  addItem: (item: any) => {
    console.log('Added to cart:', item)
    // Show success notification
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50'
    notification.textContent = `${item.name} added to cart!`
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }
})

export default function HomePage() {
  const { addItem } = useCartStore()

  const handleAddToCart = async (productId: string, product?: Product) => {
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        quantity: 1
      })
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EAEDED' }}>
      <PromoBanner />
      <Header />
      
      {/* Amazon-style Hero Banner */}
      <section className="relative overflow-hidden bg-white">
        {/* Main Hero Carousel */}
        <div className="relative h-96 lg:h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/70 to-blue-900/70">
            <Image
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=80"
              alt="Hero Banner"
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Hero Content */}
          <div className="relative z-10 h-full flex items-center justify-center text-center">
            <div className="max-w-4xl mx-auto px-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                Shop smarter, not harder
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 mb-8">
                Discover millions of products with fast, free delivery
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-3 rounded-lg font-bold text-lg transition-colors">
                  Start Shopping
                </button>
                <button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black px-8 py-3 rounded-lg font-bold text-lg transition-colors">
                  Browse Deals
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Amazon-style Department Cards */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'Electronics', icon: '📱', link: '/category/electronics' },
              { name: 'Fashion', icon: '👕', link: '/category/clothing' },
              { name: 'Home & Garden', icon: '🏠', link: '/category/home' },
              { name: 'Sports', icon: '⚽', link: '/category/sports' },
              { name: 'Books', icon: '📚', link: '/category/books' },
              { name: 'Health', icon: '💊', link: '/category/health' }
            ].map((dept) => (
              <Link key={dept.name} href={dept.link}>
                <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center cursor-pointer">
                  <div className="text-3xl mb-2">{dept.icon}</div>
                  <h3 className="text-sm font-medium text-gray-900">{dept.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Today Deals Section */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Today&apos;s Deals</h2>
                <p className="text-gray-600">Don&apos;t miss out on these amazing offers</p>
              </div>
              <Link href="/deals" className="text-blue-600 hover:text-blue-800 font-medium">
                See all deals →
              </Link>
            </div>
            <SupabaseProductGrid 
              featured={true}
              limit={8}
              onAddToCart={handleAddToCart}
              className="!grid-cols-2 md:!grid-cols-4 lg:!grid-cols-4"
            />
          </div>
        </div>
      </section>

      {/* Electronics Section */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Electronics & Tech</h2>
                <p className="text-gray-600">Latest gadgets and technology</p>
              </div>
              <Link href="/category/electronics" className="text-blue-600 hover:text-blue-800 font-medium">
                Shop Electronics →
              </Link>
            </div>
            <SupabaseProductGrid 
              category="Electronics"
              limit={8}
              onAddToCart={handleAddToCart}
              className="!grid-cols-2 md:!grid-cols-4 lg:!grid-cols-4"
            />
          </div>
        </div>
      </section>

      {/* Fashion Section */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Fashion & Style</h2>
                <p className="text-gray-600">Trendy clothing and accessories</p>
              </div>
              <Link href="/category/clothing" className="text-blue-600 hover:text-blue-800 font-medium">
                Shop Fashion →
              </Link>
            </div>
            <SupabaseProductGrid 
              category="Clothing"
              limit={8}
              onAddToCart={handleAddToCart}
              className="!grid-cols-2 md:!grid-cols-4 lg:!grid-cols-4"
            />
          </div>
        </div>
      </section>

      {/* Home & Kitchen Section */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Home & Kitchen</h2>
                <p className="text-gray-600">Everything for your home</p>
              </div>
              <Link href="/category/home" className="text-blue-600 hover:text-blue-800 font-medium">
                Shop Home →
              </Link>
            </div>
            <SupabaseProductGrid 
              category="Home & Garden"
              limit={8}
              onAddToCart={handleAddToCart}
              className="!grid-cols-2 md:!grid-cols-4 lg:!grid-cols-4"
            />
          </div>
        </div>
      </section>

      {/* Recently Viewed Products */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Popular Products</h2>
                <p className="text-gray-600">Bestsellers in all categories</p>
              </div>
              <Link href="/products" className="text-blue-600 hover:text-blue-800 font-medium">
                View All →
              </Link>
            </div>
            <SupabaseProductGrid 
              limit={12}
              onAddToCart={handleAddToCart}
              className="!grid-cols-2 md:!grid-cols-4 lg:!grid-cols-6"
            />
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Stay in the loop</h2>
            <p className="text-gray-600 mb-6 text-lg">
              Get the latest deals, new products, and exclusive offers delivered straight to your inbox
            </p>
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              <button className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-bold text-lg transition-colors">
                Subscribe
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              By subscribing, you agree to our Privacy Policy and Terms of Service. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>

      {/* Amazon-style Footer */}
      <footer className="bg-gray-900 text-white">
        {/* Back to top */}
        <div 
          className="bg-gray-700 hover:bg-gray-600 py-4 text-center cursor-pointer text-white text-sm font-medium transition-colors"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Back to top
        </div>
        
        {/* Main footer content */}
        <div className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Get to Know Us */}
              <div>
                <h3 className="text-white font-bold mb-4">Get to Know Us</h3>
                <ul className="space-y-2">
                  <li><Link href="/about" className="text-gray-300 hover:text-white text-sm">About EcoMart</Link></li>
                  <li><Link href="/careers" className="text-gray-300 hover:text-white text-sm">Careers</Link></li>
                  <li><Link href="/press" className="text-gray-300 hover:text-white text-sm">Press Releases</Link></li>
                  <li><Link href="/sustainability" className="text-gray-300 hover:text-white text-sm">Sustainability</Link></li>
                  <li><Link href="/investor-relations" className="text-gray-300 hover:text-white text-sm">Investor Relations</Link></li>
                </ul>
              </div>

              {/* Make Money with Us */}
              <div>
                <h3 className="text-white font-bold mb-4">Make Money with Us</h3>
                <ul className="space-y-2">
                  <li><Link href="/sell" className="text-gray-300 hover:text-white text-sm">Sell products on EcoMart</Link></li>
                  <li><Link href="/business" className="text-gray-300 hover:text-white text-sm">Sell on EcoMart Business</Link></li>
                  <li><Link href="/associates" className="text-gray-300 hover:text-white text-sm">Become an Affiliate</Link></li>
                  <li><Link href="/advertise" className="text-gray-300 hover:text-white text-sm">Advertise Your Products</Link></li>
                  <li><Link href="/host-ecomart-hub" className="text-gray-300 hover:text-white text-sm">Host an EcoMart Hub</Link></li>
                </ul>
              </div>

              {/* EcoMart Payment Products */}
              <div>
                <h3 className="text-white font-bold mb-4">EcoMart Payment Products</h3>
                <ul className="space-y-2">
                  <li><Link href="/credit-card" className="text-gray-300 hover:text-white text-sm">EcoMart Rewards Visa</Link></li>
                  <li><Link href="/store-card" className="text-gray-300 hover:text-white text-sm">EcoMart Store Card</Link></li>
                  <li><Link href="/business-card" className="text-gray-300 hover:text-white text-sm">EcoMart Business Card</Link></li>
                  <li><Link href="/corporate-credit" className="text-gray-300 hover:text-white text-sm">Corporate Credit Line</Link></li>
                  <li><Link href="/currency-converter" className="text-gray-300 hover:text-white text-sm">Currency Converter</Link></li>
                </ul>
              </div>

              {/* Let Us Help You */}
              <div>
                <h3 className="text-white font-bold mb-4">Let Us Help You</h3>
                <ul className="space-y-2">
                  <li><Link href="/account" className="text-gray-300 hover:text-white text-sm">Your Account</Link></li>
                  <li><Link href="/orders" className="text-gray-300 hover:text-white text-sm">Your Orders</Link></li>
                  <li><Link href="/shipping" className="text-gray-300 hover:text-white text-sm">Shipping Rates & Policies</Link></li>
                  <li><Link href="/returns" className="text-gray-300 hover:text-white text-sm">Returns & Replacements</Link></li>
                  <li><Link href="/content-devices" className="text-gray-300 hover:text-white text-sm">Manage Your Content and Devices</Link></li>
                  <li><Link href="/help" className="text-gray-300 hover:text-white text-sm">EcoMart Assistant</Link></li>
                </ul>
              </div>
            </div>

            {/* Bottom section */}
            <div className="border-t border-gray-700 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="text-2xl font-bold text-yellow-400 mr-8">
                    EcoMart
                  </div>
                  <div className="flex space-x-6 text-sm">
                    <button className="text-gray-300 hover:text-white border border-gray-600 px-3 py-1 rounded">
                      🌐 English
                    </button>
                    <button className="text-gray-300 hover:text-white border border-gray-600 px-3 py-1 rounded">
                      $ USD
                    </button>
                    <button className="text-gray-300 hover:text-white border border-gray-600 px-3 py-1 rounded">
                      🇺🇸 United States
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start mt-6 space-x-6 text-xs text-gray-400">
                <Link href="/terms" className="hover:text-white">Conditions of Use</Link>
                <Link href="/privacy" className="hover:text-white">Privacy Notice</Link>
                <Link href="/interest-ads" className="hover:text-white">Interest-Based Ads</Link>
              </div>
              
              <div className="text-center md:text-left mt-4 text-xs text-gray-400">
                © 1996-2024, EcoMart.com, Inc. or its affiliates
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </div>
  )
}