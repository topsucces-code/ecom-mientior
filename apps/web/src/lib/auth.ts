import { supabase } from '@ecommerce/shared'
import type { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
}

export class AuthService {
  static async signUp(email: string, password: string, firstName?: string, lastName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: firstName && lastName ? `${firstName} ${lastName}` : '',
          first_name: firstName,
          last_name: lastName,
        }
      }
    })

    if (error) throw error
    return data
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user as AuthUser
  }

  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error
  }

  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  }

  static async updateProfile(updates: {
    first_name?: string
    last_name?: string
    phone?: string
    avatar_url?: string
  }) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('No user logged in')

    // Update auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        full_name: updates.first_name && updates.last_name 
          ? `${updates.first_name} ${updates.last_name}` 
          : user.user_metadata.full_name,
        first_name: updates.first_name,
        last_name: updates.last_name,
        avatar_url: updates.avatar_url,
      }
    })

    if (authError) throw authError

    // Update user profile in our database
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        first_name: updates.first_name,
        last_name: updates.last_name,
        phone: updates.phone,
        avatar_url: updates.avatar_url,
      })
      .eq('id', user.id)

    if (profileError) throw profileError
  }

  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user as AuthUser || null)
    })
  }
}