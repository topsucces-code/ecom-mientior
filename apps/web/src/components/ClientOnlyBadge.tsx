'use client'

import { useEffect, useState } from 'react'

interface ClientOnlyBadgeProps {
  count: number
  className?: string
}

export function ClientOnlyBadge({ count, className = '' }: ClientOnlyBadgeProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // Éviter l'hydratation côté serveur
  }

  if (count <= 0) {
    return null
  }

  return (
    <span className={`absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}