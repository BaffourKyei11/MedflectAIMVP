import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js'
import { User, AuthState } from '../types'

// Supabase client configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:3001'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

interface AuthContextType extends AuthState {
  signIn: (email: string, password?: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  sendOTP: (email: string) => Promise<{ error: string | null }>
  verifyOTP: (email: string, token: string) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updateProfile: (updates: Partial<User>) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  // Convert Supabase user to our User type
  const mapSupabaseUser = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    if (!supabaseUser) return null

    try {
      // Fetch additional user profile data
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        role: profile?.role || 'clinician',
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        organization: profile?.organization,
        createdAt: supabaseUser.created_at,
        updatedAt: profile?.updated_at || supabaseUser.created_at
      }
    } catch (error) {
      console.error('Error mapping user:', error)
      return null
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setState(prev => ({ ...prev, loading: false, error: error.message }))
          return
        }

        if (session?.user) {
          const user = await mapSupabaseUser(session.user)
          setState(prev => ({ ...prev, user, loading: false }))
        } else {
          setState(prev => ({ ...prev, loading: false }))
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              const user = await mapSupabaseUser(session.user)
              setState(prev => ({ ...prev, user, error: null }))
            } else if (event === 'SIGNED_OUT') {
              setState(prev => ({ ...prev, user: null, error: null }))
            }
          }
        )

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Auth initialization error:', error)
        setState(prev => ({ ...prev, loading: false, error: 'Failed to initialize authentication' }))
      }
    }

    initializeAuth()
  }, [])

  // Sign in with email/password or OTP
  const signIn = async (email: string, password?: string): Promise<{ error: string | null }> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      if (password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setState(prev => ({ ...prev, error: error.message }))
          return { error: error.message }
        }
      } else {
        // OTP sign in
        const { error } = await supabase.auth.signInWithOtp({ email })
        if (error) {
          setState(prev => ({ ...prev, error: error.message }))
          return { error: error.message }
        }
      }

      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { error: errorMessage }
    }
  }

  // Sign up new user
  const signUp = async (email: string, password: string, userData: Partial<User>): Promise<{ error: string | null }> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role || 'clinician',
            organization: userData.organization
          }
        }
      })

      if (error) {
        setState(prev => ({ ...prev, error: error.message }))
        return { error: error.message }
      }

      // Create user profile in users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role || 'clinician',
            organization: userData.organization
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
        }
      }

      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { error: errorMessage }
    }
  }

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      await supabase.auth.signOut()
      setState(prev => ({ ...prev, user: null, loading: false }))
    } catch (error) {
      console.error('Sign out error:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // Send OTP
  const sendOTP = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      return { error: error?.message || null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      return { error: errorMessage }
    }
  }

  // Verify OTP
  const verifyOTP = async (email: string, token: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      })
      return { error: error?.message || null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      return { error: errorMessage }
    }
  }

  // Reset password
  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error: error?.message || null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      return { error: errorMessage }
    }
  }

  // Update profile
  const updateProfile = async (updates: Partial<User>): Promise<{ error: string | null }> => {
    try {
      if (!state.user) {
        return { error: 'No user logged in' }
      }

      const { error } = await supabase
        .from('users')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          organization: updates.organization,
          updated_at: new Date().toISOString()
        })
        .eq('id', state.user.id)

      if (error) {
        return { error: error.message }
      }

      // Update local state
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null
      }))

      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      return { error: errorMessage }
    }
  }

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    sendOTP,
    verifyOTP,
    resetPassword,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 