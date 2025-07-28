'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { authService, AuthUser, RegisterData, LoginData } from '../lib/supabase/auth'

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signUp: (data: RegisterData) => Promise<void>
  signIn: (data: LoginData) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: any) => Promise<void>
  changePassword: (newPassword: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
  hasPermission: (permission: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const useAuthProvider = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const userProfile = await authService.getCurrentUserProfile()
        setUser(userProfile)
        setLoading(false)
      } catch (error) {
        console.error('Error getting initial session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        
        if (session?.user) {
          try {
            const userProfile = await authService.getCurrentUserProfile()
            setUser(userProfile)
          } catch (error) {
            console.error('Error getting user profile:', error)
            setUser(null)
          }
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (data: RegisterData) => {
    try {
      setLoading(true)
      setError(null)
      const result = await authService.signUp(data)
      
      if (result.user) {
        const userProfile = await authService.getCurrentUserProfile()
        setUser(userProfile)
      }
    } catch (error: any) {
      setError(error.message || 'Sign up failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (data: LoginData) => {
    try {
      setLoading(true)
      setError(null)
      const result = await authService.signIn(data)
      
      if (result.user) {
        const userProfile = await authService.getCurrentUserProfile()
        setUser(userProfile)
      }
    } catch (error: any) {
      setError(error.message || 'Sign in failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await authService.signOut()
      setUser(null)
      setSession(null)
    } catch (error: any) {
      setError(error.message || 'Sign out failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: any) => {
    try {
      if (!user) throw new Error('No user logged in')
      
      const updatedProfile = await authService.updateProfile(user.id, updates)
      setUser(prev => prev ? { ...prev, profile: updatedProfile } : null)
    } catch (error: any) {
      setError(error.message || 'Profile update failed')
      throw error
    }
  }

  const changePassword = async (newPassword: string) => {
    try {
      await authService.changePassword(newPassword)
    } catch (error: any) {
      setError(error.message || 'Password change failed')
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email)
    } catch (error: any) {
      setError(error.message || 'Password reset failed')
      throw error
    }
  }

  const uploadAvatar = async (file: File) => {
    try {
      if (!user) throw new Error('No user logged in')
      
      const avatarUrl = await authService.uploadAvatar(user.id, file)
      
      // Update user state with new avatar
      setUser(prev => prev ? {
        ...prev,
        profile: { ...prev.profile, avatar_url: avatarUrl }
      } : null)
      
      return avatarUrl
    } catch (error: any) {
      setError(error.message || 'Avatar upload failed')
      throw error
    }
  }

  const hasPermission = async (permission: string) => {
    try {
      if (!user) return false
      return await authService.hasPermission(user.id, permission)
    } catch (error) {
      console.error('Permission check failed:', error)
      return false
    }
  }

  return {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    changePassword,
    resetPassword,
    uploadAvatar,
    hasPermission,
  }
}

export { AuthContext }