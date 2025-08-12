import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/AuthProvider';

export function useAdminCheck() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-check', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      // Check admin_users table first
      try {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('is_admin')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (adminData?.is_admin) {
          return true;
        }
      } catch (error) {
        // Admin table check failed, try backup
      }
      
      // Check user_profiles table as backup
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profileData?.is_admin) {
          return true;
        }
      } catch (error) {
        // Profile table check failed
      }
      return false;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}