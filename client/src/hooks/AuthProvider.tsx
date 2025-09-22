import React, { createContext, useContext, useEffect, useState } from "react"
import { Session, User as SupabaseUser } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { ReferralService } from "@/lib/services/referrals"

type AuthContextType = {
  user: SupabaseUser | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)  
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!isMounted) return

        if (!error && data.session) {
          setSession(data.session)
          setUser(data.session.user)
          
          // Update last_login for existing session (non-blocking)
          updateLastLogin(data.session.user.id)
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const updateLastLogin = async (userId: string) => {
      try {
        await supabase
          .from('user_profiles')
          .update({ 
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
      } catch (error) {
        // Could not update login time - this is non-critical
        console.log('Could not update last login:', error)
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      setSession(session)
      setUser(session?.user ?? null)
      
      // Handle user sign-in events  
      if (event === 'SIGNED_IN' && session?.user) {
        // First, ensure user profile exists (for new users)
        handleUserSignIn(session.user)
      }
    })

    const handleUserSignIn = async (user: SupabaseUser) => {
      try {
        // Check if user profile exists
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (!existingProfile && !profileCheckError) {
          // Profile doesn't exist, create it
          console.log('Creating user profile for new user:', user.id)
          const { error: createProfileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              email: user.email!,
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              full_name: user.user_metadata?.full_name || user.email!.split('@')[0],
              email_notifications: true,
              daily_email: false,
              daily_email_time: '08:00',
              timezone: 'Africa/Johannesburg',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (createProfileError) {
            console.error('Failed to create user profile:', createProfileError)
          } else {
            console.log('User profile created successfully')
          }
        }
        
        // Check if user plan exists
        const { data: existingPlan, error: planCheckError } = await supabase
          .from('user_plans')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (!existingPlan && !planCheckError) {
          // Plan doesn't exist, create it - server will automatically set 14-day trial dates
          console.log('Creating user plan for new user (server will set trial dates):', user.id)
          
          const { error: createPlanError } = await supabase
            .from('user_plans')
            .insert({
              user_id: user.id,
              plan_type: 'free',
              // started_at and expires_at will be set automatically by database trigger
            })
          
          if (createPlanError) {
            console.error('Failed to create user plan:', createPlanError)
          } else {
            console.log('User plan created successfully with server-controlled trial dates')
          }
        }
        
        // Now update last_login for existing or newly created profile
        await updateLastLogin(user.id)
        
        // Check if this user needs referral stats initialization
        // This happens on first login after signup
        try {
          const stats = await ReferralService.getReferralStats(user.id)
          if (!stats && user.email) {
            // User doesn't have referral stats yet, initialize them
            await ReferralService.initializeUserReferralStats(user.id, user.email)
          }
        } catch (error) {
          console.error('Failed to initialize referral stats:', error)
        }
        
      } catch (error) {
        console.error('Error during profile/plan creation:', error)
      }
    }

    getSession()

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}