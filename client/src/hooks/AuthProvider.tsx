import React, { createContext, useContext, useEffect, useState } from "react"
import { Session, User as SupabaseUser } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { ReferralService } from "@/lib/services/referrals"
import { PlansService } from "@/lib/services/plans"
import { TrialExpiredModal } from "@/components/plans/TrialExpiredModal"
import { queryClient } from "@/lib/queryClient"
import { clientLogger } from "@/lib/clientLogger"

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
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState<boolean>(false)
  const [trialEndDate, setTrialEndDate] = useState<string | undefined>(undefined)

  useEffect(() => {
    let isMounted = true

    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!isMounted) return

        if (!error && data.session) {
          // Check if email is verified
          if (!data.session.user.email_confirmed_at) {
            clientLogger.warn('AuthProvider', 'User email not verified, clearing session')
            await supabase.auth.signOut()
            setSession(null)
            setUser(null)
            return
          }
          
          setSession(data.session)
          setUser(data.session.user)
          
          // Update last_login for existing session (non-blocking)
          updateLastLogin(data.session.user.id)
        }
      } catch (error) {
        clientLogger.error('AuthProvider', 'Error getting session', error)
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
        clientLogger.warn('AuthProvider', 'Could not update last login', error)
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      // Clear React Query cache on auth state changes to ensure fresh data
      if (event === 'SIGNED_OUT' || (!session && event === 'TOKEN_REFRESHED')) {
        clientLogger.debug('AuthProvider', 'Clearing React Query cache on auth state change', { event })
        queryClient.clear()
      } else if (event === 'SIGNED_IN' && session?.user) {
        clientLogger.debug('AuthProvider', 'Invalidating cache for new user session', { userId: session.user.id })
        // Invalidate user-specific caches to get fresh data
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
        queryClient.invalidateQueries({ queryKey: ['goals'] })
        queryClient.invalidateQueries({ queryKey: ['documents'] })
        queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      }

      // Check email verification for any session
      if (session?.user && !session.user.email_confirmed_at) {
        clientLogger.warn('AuthProvider', 'User email not verified in auth state change, clearing session')
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
        return
      }

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
          // Profile should have been created by server during signup
          // If it doesn't exist, there might be a server-side issue
          clientLogger.warn('AuthProvider', 'User profile not found after signup - this should have been created server-side')
        }
        
        // Check if user plan exists
        const { data: existingPlan, error: planCheckError } = await supabase
          .from('user_plans')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (!existingPlan && !planCheckError) {
          // Plan doesn't exist, create it using secure server-side function
          clientLogger.info('AuthProvider', 'Initializing trial plan for new user', { userId: user.id })
          
          const { error: createPlanError } = await supabase
            .rpc('initialize_user_trial', {
              user_id_param: user.id
            })
          
          if (createPlanError) {
            clientLogger.error('AuthProvider', 'Failed to create user plan', createPlanError)
          } else {
            clientLogger.info('AuthProvider', 'Trial plan initialized successfully')
          }
        }
        
        // Now update last_login for existing or newly created profile
        await updateLastLogin(user.id)
        
        // Check if this user needs referral stats initialization
        // This happens on first login after signup
        try {
          const stats = await ReferralService.getReferralStats(user.id)
          if (!stats && user.email) {
            // Get the referral code from user_profiles to ensure consistency
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('referral_code')
              .eq('user_id', user.id)
              .single()
            
            const referralCode = profileData?.referral_code || ReferralService.generateReferralCode(user.email)
            
            // User doesn't have referral stats yet, initialize them with the same code
            await ReferralService.initializeUserReferralStatsWithCode(user.id, user.email, referralCode)
          }
        } catch (error) {
          clientLogger.error('AuthProvider', 'Failed to initialize referral stats', error)
        }

        // Check for trial expiry after all setup is complete
        try {
          // Get all user plans to check for expired trials (getUserPlan returns null for expired)
          const { data: allPlans, error: plansError } = await supabase
            .from('user_plans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          console.log('🔍 Checking trial status for user:', user.id, { allPlans, plansError })
          
          if (!plansError && allPlans && allPlans.length > 0) {
            const now = new Date()
            
            // Check for expired trials (using same logic as PlansService)
            for (const plan of allPlans) {
              const isActive = !plan.expires_at || new Date(plan.expires_at) > now
              const isExpiredTrial = plan.plan_type === 'free' && plan.expires_at && !isActive
              const isPremium = plan.plan_type === 'premium'
              
              console.log('📅 Trial check for plan:', {
                id: plan.id,
                planType: plan.plan_type,
                expiresAt: plan.expires_at,
                isActive,
                isExpiredTrial,
                isPremium
              })

              if (isExpiredTrial) {
                console.log('🚨 Trial expired, showing modal')
                setTrialEndDate(plan.expires_at)
                setShowTrialExpiredModal(true)
                break // Only show modal once
              }
              
              // If user has premium, don't show expired trial modal
              if (isPremium && isActive) {
                console.log('✅ User has active premium plan, no trial modal needed')
                break
              }
            }
          }
        } catch (error) {
          console.error('Failed to check trial status:', error)
        }
        
      } catch (error) {
        clientLogger.error('AuthProvider', 'Error during profile/plan creation', error)
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
    // Clear trial expiry modal when signing out
    setShowTrialExpiredModal(false)
    setTrialEndDate(undefined)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
      <TrialExpiredModal 
        isOpen={showTrialExpiredModal} 
        trialEndDate={trialEndDate}
      />
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