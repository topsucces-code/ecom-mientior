'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

interface Category {
  id: string
  name: string
  description: string | null
  slug: string
  image_url: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
}

interface ShopByDepartmentProps {
  className?: string
  maxCategories?: number
}

// Icônes et couleurs par défaut pour les catégories
const categoryIcons: Record<string, { icon: string; color: string }> = {
  'electronics': {
    icon: 'M12 18h9m-9 0a9 9 0 01-9-9m9 9V9a9 9 0 119 9M3 9a9 9 0 019-9m-9 9h9m0 0V9m0 9v9',
    color: '#8A2BE2'
  },
  'clothing': {
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    color: '#A0522D'
  },
  'home-garden': {
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    color: '#8B4513'
  },
  'books': {
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    color: '#8A2BE2'
  },
  'sports': {
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    color: '#D2691E'
  },
  'health-beauty': {
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    color: '#9370DB'
  }
}

// Icône par défaut
const defaultIcon = {
  icon: 'M19 7l-.867-12.142A2 2 0 0016.138 3H7.862a2 2 0 00-1.995 1.858L5 17h14l-.867-12.142A2 2 0 0016.138 3H7.862a2 2 0 00-1.995 1.858L5 17h14z',
  color: '#6B7280'
}

export function ShopByDepartment({ className = '', maxCategories = 8 }: ShopByDepartmentProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .is('parent_id', null) // Récupérer seulement les catégories principales
          .limit(maxCategories)
          .order('name')

        if (error) {
          console.error('Error fetching categories:', error)
          setError('Failed to load categories')
          return
        }

        setCategories(data || [])
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [maxCategories])

  if (loading) {
    return (
      <section className={`py-12 bg-white ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Shop by Department</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-3"></div>
                  <div className="h-4 bg-gray-300 rounded mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={`py-12 bg-white ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Shop by Department</h2>
          <div className="text-center py-8">
            <p className="text-gray-600">Unable to load categories. Please try again later.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`py-12 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Shop by Department</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category) => {
            const iconData = categoryIcons[category.slug] || defaultIcon
            
            return (
              <Link 
                key={category.id} 
                href={`/category/${category.slug}`} 
                className="group"
              >
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-all duration-200 hover:border-gray-300">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: iconData.color }}
                  >
                    <svg 
                      className="w-8 h-8 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d={iconData.icon} 
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-purple-700 transition-colors">
                    {category.name}
                  </p>
                  {category.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}