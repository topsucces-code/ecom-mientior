'use client'

import { useState, useEffect, memo } from 'react'
import { CategoryService } from '../lib/products'
import type { Category } from '@ecommerce/shared'

interface CategoryFilterProps {
  selectedCategory?: string
  onCategoryChange: (categoryId: string | undefined) => void
}

export const CategoryFilter = memo(function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await CategoryService.getCategories()
        setCategories(data)
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  if (loading) {
    return (
      <div className="mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded w-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
      <div className="space-y-2">
        <button
          onClick={() => onCategoryChange(undefined)}
          className={`block text-sm ${
            !selectedCategory
              ? 'text-primary-600 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Categories
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`block text-sm ${
              selectedCategory === category.id
                ? 'text-primary-600 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
})