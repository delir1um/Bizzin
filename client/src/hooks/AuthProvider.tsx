import React, { createContext, useContext, useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { ReferralService } from "@/lib/services/referrals"

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!error && data.session) {
        setSession(data.session)
        setUser(data.session.user)
        
        // Update last_login for existing session (non-blocking)
        const updatePromise = supabase
          .from('user_profiles')
          .update({ 
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', data.session.user.id)
          
        updatePromise.then(() => {
          // Login time updated
        }).catch((error: any) => {
          // Could not update login time
        })
      }
      setLoading(false)
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Handle user sign-in events  
      if (event === 'SIGNED_IN' && session?.user) {
        // Update last_login (non-blocking)
        const loginUpdatePromise = supabase
          .from('user_profiles')
          .update({ 
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id)
          
        loginUpdatePromise.then(() => {
          // Login time updated on sign in
        }).catch((error: any) => {
          // Could not update login time
        })
          
        // Check if this user needs referral stats initialization
        // This happens on first login after signup
        const initializePromise = ReferralService.getReferralStats(session.user.id)
        initializePromise.then((stats) => {
          if (!stats && session.user?.email) {
            // User doesn't have referral stats yet, initialize them
            return ReferralService.initializeUserReferralStats(session.user.id, session.user.email)
          }
        }).catch((error: any) => {
          console.error('Failed to initialize referral stats:', error)
        })
      }
    })

    getSession()

    return () => {
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
