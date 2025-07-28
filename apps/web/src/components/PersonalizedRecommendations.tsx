'use client'

import { useEffect, useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import { RecommendationCarousel } from './RecommendationCarousel'
import { useRecommendationStore } from '../lib/recommendation-store'
import { ProductService } from '../lib/products'
import type { Product, ProductRecommendation } from '@ecommerce/shared'

// Demo Recommendation Section Component
const DemoRecommendationSection = memo(function DemoRecommendationSection({ 
  title, 
  subtitle 
}: { 
  title: string 
  subtitle: string 
}) {
  // Demo products with realistic data
  const demoProducts = [
    {
      id: 'demo-1',
      name: 'Smartphone Pro Max 128GB',
      price: 899.99,
      compare_at_price: 999.99,
      brand: 'TechBrand',
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop'],
      inventory_quantity: 15,
      description: 'Le dernier smartphone avec des performances exceptionnelles'
    },
    {
      id: 'demo-2', 
      name: 'Casque Audio Sans Fil Premium',
      price: 249.99,
      compare_at_price: null,
      brand: 'AudioTech',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'],
      inventory_quantity: 8,
      description: 'Qualité sonore exceptionnelle avec réduction de bruit'
    },
    {
      id: 'demo-3',
      name: 'Montre Connectée Sport',
      price: 199.99,
      compare_at_price: 259.99,
      brand: 'SportTech',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'],
      inventory_quantity: 22,
      description: 'Suivi complet de votre activité physique et santé'
    },
    {
      id: 'demo-4',
      name: 'Ordinateur Portable Gaming',
      price: 1299.99,
      compare_at_price: 1499.99,
      brand: 'GameTech',
      images: ['https://images.unsplash.com/photo-1541807084-d2ee5474e035?w=400&h=400&fit=crop'],
      inventory_quantity: 5,
      description: 'Performance ultime pour les jeux et le travail créatif'
    },
    {
      id: 'demo-5',
      name: 'Appareil Photo Mirrorless',
      price: 1899.99,
      compare_at_price: null,
      brand: 'PhotoPro',
      images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop'],
      inventory_quantity: 12,
      description: 'Capturez des moments exceptionnels avec une qualité professionnelle'
    }
  ]

  // Create demo recommendations
  const demoRecommendations = demoProducts.map((product, index) => ({
    product_id: product.id,
    score: 0.85 - (index * 0.1),
    reason: [
      'Basé sur vos achats précédents',
      'Tendance dans votre catégorie',
      'Recommandé par des clients similaires',
      'Populaire cette semaine',
      'Nouveauté correspondant à vos intérêts'
    ][index],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Enhanced Header */}
      <div className="p-6 pb-4" style={{ 
        background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.05) 0%, rgba(160, 82, 45, 0.05) 100%)' 
      }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#8A2BE2' }}>{title}</h2>
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          </div>
          <button className="text-sm font-medium transition-colors" style={{ color: '#A0522D' }}>
            Voir tout →
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-6 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {demoProducts.slice(0, 5).map((product, index) => (
            <div key={product.id} className="group">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                {/* Product Image */}
                <div className="relative h-40 bg-gray-100 overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Recommendation Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#8A2BE2' }}>
                      {Math.round(demoRecommendations[index].score * 100)}% match
                    </span>
                  </div>

                  {/* Discount Badge */}
                  {product.compare_at_price && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="p-3">
                  <div className="mb-2">
                    <span className="text-xs font-medium" style={{ color: '#8A2BE2' }}>
                      {demoRecommendations[index].reason}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm line-clamp-2 hover:text-purple-700 transition-colors cursor-pointer">
                    {product.name}
                  </h3>
                  
                  {product.brand && (
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                      {product.brand}
                    </p>
                  )}
                  
                  {/* Price */}
                  <div className="mb-3">
                    <span className="text-lg font-bold" style={{ color: '#8A2BE2' }}>
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(product.price)}
                    </span>
                    {product.compare_at_price && (
                      <span className="text-sm text-gray-500 line-through ml-2">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(product.compare_at_price)}
                      </span>
                    )}
                  </div>
                  
                  {/* Add to Cart Button */}
                  <button
                    className="w-full flex items-center justify-center space-x-2 text-xs font-semibold py-2 px-3 rounded-lg transition-all duration-200 text-white shadow-sm hover:shadow-md transform hover:scale-105"
                    style={{ backgroundColor: '#A0522D' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#8B4513'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#A0522D'
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
                    </svg>
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

interface PersonalizedRecommendationsProps {
  userId: string
  className?: string
  maxSections?: number
}

interface RecommendationSection {
  id: string
  title: string
  subtitle: string
  recommendations: ProductRecommendation[]
  products: Product[]
  icon: string
}

export const PersonalizedRecommendations = memo(function PersonalizedRecommendations({
  userId,
  className = '',
  maxSections = 4
}: PersonalizedRecommendationsProps) {
  const router = useRouter()
  const [sections, setSections] = useState<RecommendationSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    personalizedRecommendations, 
    trendingProducts,
    getPersonalizedRecommendations,
    getTrendingProducts,
    loading: storeLoading,
    error: storeError
  } = useRecommendationStore()

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load personalized and trending recommendations
        await Promise.all([
          getPersonalizedRecommendations(userId),
          getTrendingProducts()
        ])

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des recommandations')
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [userId, getPersonalizedRecommendations, getTrendingProducts])

  useEffect(() => {
    const buildSections = async () => {
      if (!personalizedRecommendations && trendingProducts.length === 0) {
        return
      }

      const sectionsToBuild: RecommendationSection[] = []

      try {
        // Section 1: Pour vous (Personalized)
        if (personalizedRecommendations?.for_you.length > 0) {
          const productIds = personalizedRecommendations.for_you.map(r => r.product_id)
          const products = await ProductService.getProductsByIds(productIds)
          
          sectionsToBuild.push({
            id: 'for-you',
            title: 'Recommandé pour vous',
            subtitle: 'Basé sur votre historique d\'achat et de navigation',
            recommendations: personalizedRecommendations.for_you,
            products,
            icon: '🎯'
          })
        }

        // Section 2: Parce que vous avez consulté
        if (personalizedRecommendations?.because_you_viewed.length > 0) {
          const productIds = personalizedRecommendations.because_you_viewed.map(r => r.product_id)
          const products = await ProductService.getProductsByIds(productIds)
          
          sectionsToBuild.push({
            id: 'because-viewed',
            title: 'Parce que vous avez consulté',
            subtitle: 'Des produits similaires à ceux que vous avez récemment vus',
            recommendations: personalizedRecommendations.because_you_viewed,
            products,
            icon: '👀'
          })
        }

        // Section 3: Tendances dans vos catégories
        if (personalizedRecommendations?.trending_in_categories.length > 0) {
          const productIds = personalizedRecommendations.trending_in_categories.map(r => r.product_id)
          const products = await ProductService.getProductsByIds(productIds)
          
          sectionsToBuild.push({
            id: 'trending-categories',
            title: 'Tendances dans vos catégories',
            subtitle: 'Ce qui est populaire dans vos catégories préférées',
            recommendations: personalizedRecommendations.trending_in_categories,
            products,
            icon: '🔥'
          })
        }

        // Section 4: Produits tendance généraux
        if (trendingProducts.length > 0) {
          const productIds = trendingProducts.map(r => r.product_id)
          const products = await ProductService.getProductsByIds(productIds)
          
          sectionsToBuild.push({
            id: 'trending',
            title: 'Tendances du moment',
            subtitle: 'Les produits les plus populaires en ce moment',
            recommendations: trendingProducts,
            products,
            icon: '⚡'
          })
        }

        // Section 5: Similaire à votre panier (si applicable)
        if (personalizedRecommendations?.similar_to_cart.length > 0) {
          const productIds = personalizedRecommendations.similar_to_cart.map(r => r.product_id)
          const products = await ProductService.getProductsByIds(productIds)
          
          sectionsToBuild.push({
            id: 'similar-cart',
            title: 'Complétez votre panier',
            subtitle: 'Produits qui vont bien avec vos articles',
            recommendations: personalizedRecommendations.similar_to_cart,
            products,
            icon: '🛒'
          })
        }

        // Limiter le nombre de sections
        setSections(sectionsToBuild.slice(0, maxSections))

      } catch (err) {
        console.error('Erreur lors de la construction des sections:', err)
        setError('Erreur lors du chargement des produits')
      }
    }

    buildSections()
  }, [personalizedRecommendations, trendingProducts, maxSections])

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`)
  }

  if (loading || storeLoading) {
    return (
      <div className={`space-y-8 ${className}`}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="flex gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex-shrink-0">
                  <div className="w-48 h-64 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error || storeError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-red-800">{error || storeError}</p>
        </div>
      </div>
    )
  }

  // Create demo recommendations when no real data is available
  if (sections.length === 0) {
    const demoSections: RecommendationSection[] = [
      {
        id: 'trending-demo',
        title: 'Tendances du moment',
        subtitle: 'Les produits les plus populaires actuellement',
        recommendations: [],
        products: [],
        icon: '🔥'
      },
      {
        id: 'for-you-demo', 
        title: 'Recommandé pour vous',
        subtitle: 'Sélection personnalisée basée sur les tendances',
        recommendations: [],
        products: [],
        icon: '🎯'
      },
      {
        id: 'new-arrivals-demo',
        title: 'Nouveautés',
        subtitle: 'Découvrez nos derniers produits',
        recommendations: [],
        products: [],
        icon: '✨'
      }
    ]

    return (
      <div className={`space-y-8 ${className}`}>
        {demoSections.map((section) => (
          <DemoRecommendationSection
            key={section.id}
            title={`${section.icon} ${section.title}`}
            subtitle={section.subtitle}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {sections.map((section) => (
        <RecommendationCarousel
          key={section.id}
          title={`${section.icon} ${section.title}`}
          subtitle={section.subtitle}
          recommendations={section.recommendations}
          products={section.products}
          showReason={section.id === 'for-you'}
          itemsPerView={5}
          onProductClick={handleProductClick}
        />
      ))}
    </div>
  )
})