import React from 'react'
import { cn } from '../lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circular' | 'rectangular' | 'text'
  width?: string | number
  height?: string | number
  animation?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'default',
  width,
  height,
  animation = true,
}) => {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-[length:200%_100%]'
  const animationClasses = animation ? 'animate-shimmer' : ''
  
  const variantClasses = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    text: 'rounded h-4',
  }

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses,
        className
      )}
      style={style}
    />
  )
}

interface SkeletonGroupProps {
  children: React.ReactNode
  className?: string
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  )
}

// Composants pré-construits pour les cas courants
export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
    <Skeleton variant="rectangular" height={200} className="rounded-xl" />
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="text" width="60%" />
    <div className="flex justify-between items-center">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="rectangular" width={80} height={32} className="rounded-lg" />
    </div>
  </div>
)

export const HeaderSkeleton: React.FC = () => (
  <div className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
    <div className="flex justify-between items-center">
      <Skeleton variant="rectangular" width={120} height={32} className="rounded-lg" />
      <div className="flex space-x-4">
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
    </div>
  </div>
)

export const PageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <HeaderSkeleton />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
)