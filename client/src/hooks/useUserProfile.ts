import { useAuth } from "@/hooks/AuthProvider"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { UserProfile as FullUserProfile } from "@shared/schema"

export interface UserProfile {
  first_name?: string
  last_name?: string
  full_name?: string
  business_name?: string
  phone?: string
  bio?: string
  avatar_url?: string
  email?: string
  business_type?: string
  business_size?: string
  is_admin?: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export function useUserProfile(): UserProfile {
  const { user } = useAuth()
  
  // Fetch user profile from database table (same source as admin page)
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (error) {
        console.error('Error fetching user profile:', error)
        // Fallback to auth metadata if database fetch fails
        return user.user_metadata as UserProfile
      }
      
      return data as FullUserProfile
    },
    enabled: !!user?.id
  })
  
  // Return empty object if no user or profile data
  if (!user || !profile) {
    return {}
  }
  
  return {
    first_name: profile.first_name,
    last_name: profile.last_name,
    full_name: profile.full_name,
    business_name: profile.business_name,
    phone: profile.phone,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    email: profile.email,
    business_type: profile.business_type,
    business_size: profile.business_size,
    is_admin: profile.is_admin,
    is_active: profile.is_active,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  }
}

export function useBusinessName(): string {
  const profile = useUserProfile()
  return profile.business_name || profile.full_name || 'Your Business'
}