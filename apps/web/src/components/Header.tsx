'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import { Button, MotiffLogo, MotiffLogoCompact } from '@ecommerce/ui'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { AuthModal } from './AuthModal'
import { Cart } from './Cart'
import { SearchBar } from './SearchBar'
import { useCartStore, useCartItemCount } from '../lib/cart-store'
import { useWishlistStore } from '../lib/wishlist-store'
import { useComparisonStore } from '../lib/comparison-store'
import { ClientOnlyBadge } from './ClientOnlyBadge'

export const Header = memo(function Header() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, loading, signOut } = useSupabaseAuth()
  const { toggleCart } = useCartStore()
  const itemCount = useCartItemCount()
  const { getItemCount: getWishlistCount } = useWishlistStore()
  const { getItemCount: getComparisonCount } = useComparisonStore()
  const wishlistCount = getWishlistCount()
  const comparisonCount = getComparisonCount()


  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <>
      <header className="bg-gray-900 text-white shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="block">
                <h1 className="text-2xl font-bold text-white">Ecomart</h1>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden lg:flex space-x-8">
              <Link
                href="/"
                className="text-white hover:text-yellow-400 font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                href="/offers"
                className="text-white hover:text-yellow-400 font-medium transition-colors"
              >
                Latest Offers
              </Link>
              <Link
                href="/brands"
                className="text-white hover:text-yellow-400 font-medium transition-colors"
              >
                Brands
              </Link>
              <Link
                href="/components"
                className="text-white hover:text-yellow-400 font-medium transition-colors"
              >
                Components
              </Link>
            </nav>

            {/* Search & Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="hidden md:block min-w-[300px]">
                <SearchBar 
                  placeholder="Search products..."
                  className="w-full"
                />
              </div>

              {/* User Account */}
              <Link href="/account" className="relative p-2 text-white hover:text-yellow-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>

              {/* Favorites/Wishlist */}
              <Link href="/wishlist" className="relative p-2 text-white hover:text-yellow-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <ClientOnlyBadge count={wishlistCount} />
              </Link>

              {/* Comparison */}
              <Link href="/compare" className="relative p-2 text-white hover:text-yellow-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <ClientOnlyBadge count={comparisonCount} />
              </Link>

              {/* Cart Icon */}
              <button 
                onClick={toggleCart}
                className="relative p-2 text-white hover:text-yellow-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
                </svg>
                <ClientOnlyBadge count={itemCount} />
              </button>

              {/* Mobile Menu Button */}
              <button className="lg:hidden p-2 text-white hover:text-yellow-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
      
      <Cart />
    </>
  )
})