'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '../components/Header'
import { Button } from '@ecommerce/ui'

export default function SimplePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section - Simple */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold mb-8">
            <span className="text-green-400">S</span>
            <span className="text-red-400">A</span>
            <span className="text-purple-400">L</span>
            <span className="text-blue-400">E</span>
          </h1>
          <p className="text-xl mb-8">New Arrivals - Great Deals!</p>
          <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-4">
            Shop Now
          </Button>
        </div>
      </section>

      {/* Categories - Simple */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Categories</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-6">
            {[
              { name: 'Fashion', emoji: '👕', color: 'from-orange-400 to-orange-600' },
              { name: 'Electronics', emoji: '💻', color: 'from-blue-400 to-blue-600' },
              { name: 'Home', emoji: '🏠', color: 'from-green-400 to-green-600' },
              { name: 'Sports', emoji: '⚽', color: 'from-purple-400 to-purple-600' },
              { name: 'Books', emoji: '📚', color: 'from-pink-400 to-pink-600' },
              { name: 'Auto', emoji: '🚗', color: 'from-yellow-400 to-yellow-600' },
              { name: 'Gaming', emoji: '🎮', color: 'from-indigo-400 to-indigo-600' },
              { name: 'Gifts', emoji: '🎁', color: 'from-red-400 to-red-600' }
            ].map((category, index) => (
              <div key={index} className="flex flex-col items-center cursor-pointer">
                <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-full flex items-center justify-center mb-3 hover:scale-110 transition-transform`}>
                  <span className="text-2xl">{category.emoji}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products - Simple */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Trending Products</h2>
            <Link href="/products" className="text-blue-600 hover:text-blue-800">View All →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Headphones', price: '$49.99', emoji: '🎧', color: 'from-yellow-200 to-yellow-400' },
              { name: 'Smart Watch', price: '$199.99', emoji: '⌚', color: 'from-red-200 to-red-400' },
              { name: 'Desk Lamp', price: '$39.99', emoji: '💡', color: 'from-purple-200 to-purple-400' },
              { name: 'Coffee Mug', price: '$15.99', emoji: '☕', color: 'from-blue-200 to-blue-400' }
            ].map((product, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className={`h-48 bg-gradient-to-br ${product.color} flex items-center justify-center`}>
                  <span className="text-4xl">{product.emoji}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">{product.price}</span>
                    <Button size="sm" className="bg-gray-900 hover:bg-gray-800">
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale - Simple */}
      <section className="py-16 bg-gradient-to-r from-orange-400 to-yellow-500">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">FLASH SALE!</h2>
          <p className="text-xl text-white mb-8">Up to 70% off - Limited time!</p>
          <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4">
            Shop Now →
          </Button>
        </div>
      </section>

      {/* Footer - Simple */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Ecomart</h3>
              <p className="text-gray-300">Your trusted shopping destination.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2">
                <p><a href="#" className="text-gray-300 hover:text-white">About Us</a></p>
                <p><a href="#" className="text-gray-300 hover:text-white">Contact</a></p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <div className="space-y-2">
                <p><a href="#" className="text-gray-300 hover:text-white">New Arrivals</a></p>
                <p><a href="#" className="text-gray-300 hover:text-white">Sale</a></p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2">
                <p><a href="#" className="text-gray-300 hover:text-white">Help Center</a></p>
                <p><a href="#" className="text-gray-300 hover:text-white">Returns</a></p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8">
            <p className="text-center text-gray-400">&copy; 2024 Ecomart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}