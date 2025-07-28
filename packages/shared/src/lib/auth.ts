import { auth, supabase, storage } from './supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { UserProfile, UserProfileInsert, UserProfileUpdate } from '../types/database-extended'

export interface AuthUser extends User {
  profile?: UserProfile
}

// Authentication state management
export interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, userData?: Partial<UserProfileInsert>) {
    try {
      const { data, error } = await auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      if (error) throw error

      // Create user profile if sign up was successful
      if (data.user && userData) {
        await this.createUserProfile(data.user.id, {
          id: data.user.id,
          email: data.user.email!,
          ...userData
        })
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as AuthError }
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as AuthError }
    }
  }

  // Sign in with OAuth provider
  static async signInWithProvider(provider: 'google' | 'facebook' | 'apple') {
    try {
      const { data, error } = await auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as AuthError }
    }
  }

  // Sign out
  static async signOut() {
    try {
      const { error } = await auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Reset password
  static async resetPassword(email: string) {
    try {
      const { data, error } = await auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as AuthError }
    }
  }

  // Update password
  static async updatePassword(newPassword: string) {
    try {
      const { data, error } = await auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as AuthError }
    }
  }

  // Get current session
  static async getSession() {
    try {
      const { data, error } = await auth.getSession()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as AuthError }
    }
  }

  // Get current user with profile
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await auth.getUser()
      
      if (!user) return null

      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      return {
        ...user,
        profile: profile || undefined
      }
    } catch (error) {
      return null
    }
  }

  // Create user profile
  static async createUserProfile(userId: string, profileData: UserProfileInsert) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Get user profile
  static async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: UserProfileUpdate) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Upload avatar
  static async uploadAvatar(userId: string, file: File) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar.${fileExt}`

      const { data: uploadData, error: uploadError } = await storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update user profile with new avatar URL
      const { data, error } = await this.updateUserProfile(userId, {
        avatar_url: urlData.publicUrl
      })

      if (error) throw error
      return { data: urlData.publicUrl, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Auth state change listener
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return auth.onAuthStateChange(callback)
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const { data } = await this.getSession()
    return !!data?.session
  }

  // Get user role (if using role-based access)
  static async getUserRole(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) throw error
      return (data as any)?.role || 'customer'
    } catch (error) {
      return null
    }
  }

  // Refresh session
  static async refreshSession() {
    try {
      const { data, error } = await auth.refreshSession()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as AuthError }
    }
  }

  // Legacy methods for backward compatibility
  static async updateProfile(updates: {
    first_name?: string
    last_name?: string
    phone?: string
    avatar_url?: string
  }) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    return this.updateUserProfile(user.id, updates)
  }
}

export default AuthService