import { useAuth } from "@/hooks/AuthProvider"

export interface UserProfile {
  first_name?: string
  last_name?: string
  full_name?: string
  business_name?: string
  phone?: string
  location?: string
  bio?: string
  avatar_url?: string
}

export function useUserProfile(): UserProfile {
  const { user } = useAuth()
  
  if (!user?.user_metadata) {
    return {}
  }
  
  return {
    first_name: user.user_metadata.first_name,
    last_name: user.user_metadata.last_name,
    full_name: user.user_metadata.full_name,
    business_name: user.user_metadata.business_name,
    phone: user.user_metadata.phone,
    location: user.user_metadata.location,
    bio: user.user_metadata.bio,
    avatar_url: user.user_metadata.avatar_url,
  }
}

export function useBusinessName(): string {
  const profile = useUserProfile()
  return profile.business_name || profile.full_name || 'Your Business'
}