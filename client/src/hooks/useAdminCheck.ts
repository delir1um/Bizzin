import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/AuthProvider';

export function useAdminCheck() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-check', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      console.log('Checking admin access for user:', user.id, user.email);
      
      // Check admin_users table first
      try {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('is_admin')
          .eq('user_id', user.id)
          .maybeSingle();
        
        console.log('Admin data result:', { adminData, adminError });
        
        if (adminData?.is_admin) {
          console.log('User is admin via admin_users table');
          return true;
        }
      } catch (error) {
        console.log('Admin table check failed:', error);
      }
      
      // Check user_profiles table as backup
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .maybeSingle();
        
        console.log('Profile data result:', { profileData, profileError });
        
        if (profileData?.is_admin) {
          console.log('User is admin via user_profiles table');
          return true;
        }
      } catch (error) {
        console.log('Profile table check failed:', error);
      }
      
      console.log('User is not admin');
      return false;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}