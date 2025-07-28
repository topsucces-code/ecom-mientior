'use client'

import { memo, useMemo, useCallback } from 'react'
import { FixedSizeGrid as Grid } from 'react-window'
import { ProductCard } from './ProductCard'
import type { Product } from '@ecommerce/shared'

interface VirtualizedProductGridProps {
  products: Product[]
  onAddToCart: (product: Product) => void
  containerHeight?: number
  itemWidth?: number
  itemHeight?: number
  gap?: number
}

interface GridItemProps {
  columnIndex: number
  rowIndex: number
  style: React.CSSProperties
  data: {
    products: Product[]
    onAddToCart: (product: Product) => void
    columnsPerRow: number
    gap: number
  }
}

const GridItem = memo(function GridItem({ 
  columnIndex, 
  rowIndex, 
  style, 
  data 
}: GridItemProps) {
  const { products, onAddToCart, columnsPerRow, gap } = data
  const productIndex = rowIndex * columnsPerRow + columnIndex
  const product = products[productIndex]

  if (!product) {
    return null
  }

  return (
    <div 
      style={{
        ...style,
        left: Number(style.left) + gap / 2,
        top: Number(style.top) + gap / 2,
        width: Number(style.width) - gap,
        height: Number(style.height) - gap,
      }}
    >
      <ProductCard
        product={product}
        onAddToCart={onAddToCart}
        className="h-full"
      />
    </div>
  )
})

export const VirtualizedProductGrid = memo(function VirtualizedProductGrid({
  products,
  onAddToCart,
  containerHeight = 600,
  itemWidth = 280,
  itemHeight = 400,
  gap = 24
}: VirtualizedProductGridProps) {
  // Calculate how many columns can fit in the container
  const columnsPerRow = useMemo(() => {
    if (typeof window === 'undefined') return 4 // SSR fallback
    const containerWidth = Math.min(window.innerWidth - 64, 1280) // max-width with padding
    return Math.max(1, Math.floor(containerWidth / (itemWidth + gap)))
  }, [itemWidth, gap])

  const rowCount = Math.ceil(products.length / columnsPerRow)

  const itemData = useMemo(() => ({
    products,
    onAddToCart,
    columnsPerRow,
    gap
  }), [products, onAddToCart, columnsPerRow, gap])

  const handleAddToCart = useCallback((product: Product) => {
    onAddToCart(product)
  }, [onAddToCart])

  // For small lists, render normally without virtualization
  if (products.length <= 20) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    )
  }

  // Calculate container width
  const containerWidth = useMemo(() => {
    if (typeof window === 'undefined') return 1200 // SSR fallback
    return Math.min(window.innerWidth - 64, 1280)
  }, [])

  return (
    <div className="w-full">
      <Grid
        columnCount={columnsPerRow}
        columnWidth={itemWidth + gap}
        height={containerHeight}
        rowCount={rowCount}
        rowHeight={itemHeight + gap}
        width={containerWidth}
        itemData={itemData}
        overscanRowCount={2}
        overscanColumnCount={1}
      >
        {GridItem}
      </Grid>
    </div>
  )
})

// Display name for debugging
VirtualizedProductGrid.displayName = 'VirtualizedProductGrid'