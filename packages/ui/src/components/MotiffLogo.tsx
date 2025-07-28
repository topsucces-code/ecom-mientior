import React from 'react'

interface MotiffLogoProps {
  size?: number
  className?: string
  animated?: boolean
}

export const MotiffLogo: React.FC<MotiffLogoProps> = ({ 
  size = 32, 
  className = "",
  animated = false 
}) => {
  return (
    <div className={`inline-flex items-center space-x-3 ${className}`}>
      {/* Geometric Logo */}
      <div className={`relative ${animated ? 'group' : ''}`}>
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={animated ? 'transition-transform duration-300 group-hover:scale-110' : ''}
        >
          {/* Red Square */}
          <rect 
            x="2" 
            y="2" 
            width="12" 
            height="12" 
            rx="2" 
            fill="#E43E2A"
            className={animated ? 'transition-all duration-500 group-hover:rotate-12' : ''}
          />
          
          {/* Yellow Circle */}
          <circle 
            cx="24" 
            cy="8" 
            r="6" 
            fill="#F0B500"
            className={animated ? 'transition-all duration-700 group-hover:scale-125' : ''}
          />
          
          {/* Green Triangle */}
          <path 
            d="M8 18 L20 18 L14 30 Z" 
            fill="#00C62D"
            className={animated ? 'transition-all duration-600 group-hover:-rotate-6' : ''}
          />
          
          {/* Blue Diamond */}
          <path 
            d="M24 16 L30 22 L24 28 L18 22 Z" 
            fill="#005BFF"
            className={animated ? 'transition-all duration-800 group-hover:rotate-45' : ''}
          />
        </svg>
        
        {/* Subtle glow effect */}
        {animated && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/20 via-yellow-500/20 via-green-500/20 to-blue-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
        )}
      </div>
      
      {/* Brand Text */}
      <div className="flex flex-col">
        <span className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          ECommerce
        </span>
        <span className="text-xs text-gray-500 font-medium -mt-1">
          Modern Platform
        </span>
      </div>
    </div>
  )
}

// Compact version for mobile
export const MotiffLogoCompact: React.FC<{ size?: number }> = ({ size = 24 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="transition-transform duration-300 hover:scale-110"
    >
      <rect x="4" y="4" width="10" height="10" rx="2" fill="#E43E2A" />
      <circle cx="22" cy="9" r="5" fill="#F0B500" />
      <path d="M9 18 L19 18 L14 28 Z" fill="#00C62D" />
      <path d="M22 16 L27 21 L22 26 L17 21 Z" fill="#005BFF" />
    </svg>
  )
}