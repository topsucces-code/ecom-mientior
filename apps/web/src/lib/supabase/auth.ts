'use client'

import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Auth types
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserRole = 'customer' | 'vendor' | 'agent' | 'admin'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  profile: UserProfile
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: UserRole
  vendorInfo?: {
    businessName: string
    businessType: string
    description: string
  }
}

export interface LoginData {
  email: string
  password: string
}

export class AuthService {
  // Sign up with email and password
  async signUp(data: RegisterData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role || 'customer',
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role || 'customer',
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (profileError) throw profileError

        // If registering as vendor, create vendor profile
        if (data.role === 'vendor' && data.vendorInfo) {
          const { error: vendorError } = await supabase
            .from('vendors')
            .insert({
              id: crypto.randomUUID(),
              user_id: authData.user.id,
              business_name: data.vendorInfo.businessName,
              business_type: data.vendorInfo.businessType as any,
              description: data.vendorInfo.description,
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          if (vendorError) throw vendorError
        }

        // If registering as agent, create agent profile
        if (data.role === 'agent') {
          const { error: agentError } = await supabase
            .from('chat_agents')
            .insert({
              id: crypto.randomUUID(),
              user_id: authData.user.id,
              name: `${data.firstName} ${data.lastName}`,
              email: data.email,
              status: 'offline',
              is_active: true,
              specialties: ['general'],
              max_concurrent_chats: 5,
              current_chat_count: 0,
              average_response_time: 0,
              customer_rating: 5.0,
              total_chats_handled: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          if (agentError) throw agentError
        }
      }

      return { user: authData.user, session: authData.session }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  // Sign in with email and password
  async signIn(data: LoginData) {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error

      return { user: authData.user, session: authData.session }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  // Get current user profile
  async getCurrentUserProfile(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return null

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      return {
        id: user.id,
        email: user.email!,
        role: profile.role as UserRole,
        profile
      }
    } catch (error) {
      console.error('Get user profile error:', error)
      return null
    }
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  // Change password
  async changePassword(newPassword: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    }
  }

  // Reset password
  async resetPassword(email: string) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  // Upload avatar
  async uploadAvatar(userId: string, file: File) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      await this.updateProfile(userId, { avatar_url: publicUrl })

      return publicUrl
    } catch (error) {
      console.error('Upload avatar error:', error)
      throw error
    }
  }

  // Check if user has permission
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (!profile) return false

      // Define role permissions
      const permissions = {
        admin: ['*'], // Admin has all permissions
        agent: ['chat_manage', 'customer_support', 'analytics_view'],
        vendor: ['vendor_dashboard', 'product_manage', 'order_manage', 'analytics_view'],
        customer: ['customer_dashboard', 'order_view', 'review_create']
      }

      const userPermissions = permissions[profile.role as UserRole] || []
      return userPermissions.includes('*') || userPermissions.includes(permission)
    } catch (error) {
      console.error('Check permission error:', error)
      return false
    }
  }

  // Get auth event listener
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()