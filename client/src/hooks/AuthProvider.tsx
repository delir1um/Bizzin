import React, { createContext, useContext, useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

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
        
        // Update last_login for existing session (user already logged in)
        try {
          await supabase
            .from('user_profiles')
            .update({ 
              last_login: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', data.session.user.id)
        } catch (error) {
          console.log('Could not update last_login for existing session:', error)
        }
      }
      setLoading(false)
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Update last_login when user signs in
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          await supabase
            .from('user_profiles')
            .update({ 
              last_login: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', session.user.id)
        } catch (error) {
          console.log('Could not update last_login:', error)
        }
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
