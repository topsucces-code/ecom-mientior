'use client'

import { useEffect, ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { UserRole } from '../../lib/supabase/auth'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole
  requiredPermission?: string
  fallback?: ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  redirectTo = '/auth'
}: ProtectedRouteProps) {
  const { user, loading, hasPermission } = useAuth()

  useEffect(() => {
    const checkAccess = async () => {
      if (loading) return

      if (!user) {
        const currentPath = window.location.pathname
        window.location.href = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
        return
      }

      // Check role requirement
      if (requiredRole && user.role !== requiredRole) {
        window.location.href = '/unauthorized'
        return
      }

      // Check permission requirement
      if (requiredPermission) {
        const hasRequiredPermission = await hasPermission(requiredPermission)
        if (!hasRequiredPermission) {
          window.location.href = '/unauthorized'
          return
        }
      }
    }

    checkAccess()
  }, [user, loading, requiredRole, requiredPermission, redirectTo, hasPermission])

  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )
    )
  }

  if (!user) {
    return fallback || null
  }

  // Additional role/permission checks
  if (requiredRole && user.role !== requiredRole) {
    return fallback || null
  }

  return <>{children}</>
}

// Hook for conditional rendering based on permissions
export function usePermissions() {
  const { user, hasPermission } = useAuth()

  const checkRole = (role: UserRole) => {
    return user?.role === role
  }

  const checkPermission = async (permission: string) => {
    return await hasPermission(permission)
  }

  const isAdmin = () => checkRole('admin')
  const isVendor = () => checkRole('vendor')
  const isAgent = () => checkRole('agent')
  const isCustomer = () => checkRole('customer')

  return {
    user,
    checkRole,
    checkPermission,
    isAdmin,
    isVendor,
    isAgent,
    isCustomer,
  }
}