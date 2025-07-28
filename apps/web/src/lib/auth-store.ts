'use client'

import { create } from 'zustand'
import { AuthService, type AuthUser } from '@ecommerce/shared'
import type { Session } from '@supabase/supabase-js'

interface AuthStore {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: { first_name?: string, last_name?: string }) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: { first_name?: string, last_name?: string, phone?: string, avatar_url?: string }) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    try {
      await AuthService.signIn(email, password)
      // User and session will be updated via the auth state change listener
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signUp: async (email: string, password: string, metadata?) => {
    set({ loading: true })
    try {
      await AuthService.signUp(email, password, metadata)
      // User will be updated via the auth state change listener
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      await AuthService.signOut()
      set({ user: null, session: null })
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateProfile: async (updates) => {
    set({ loading: true })
    try {
      await AuthService.updateProfile(updates)
      // Refresh user data
      const user = await AuthService.getCurrentUser()
      set({ user })
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true })
    try {
      await AuthService.resetPassword(email)
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  initialize: async () => {
    if (get().initialized) return

    try {
      // Get initial session
      const session = await AuthService.getSession()
      let user = null

      if (session?.user) {
        user = await AuthService.getCurrentUser()
      }

      set({ session, user, initialized: true })

      // Listen for auth changes
      AuthService.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = await AuthService.getCurrentUser()
          set({ session, user })
        } else if (event === 'SIGNED_OUT') {
          set({ session: null, user: null })
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ initialized: true })
    }
  }
}))