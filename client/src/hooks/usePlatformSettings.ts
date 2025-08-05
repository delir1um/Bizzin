import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface PlatformSettings {
  id: string;
  pre_launch_mode: boolean;
  launch_message: string;
  maintenance_mode: boolean;
  maintenance_message: string;
}

export function usePlatformSettings() {
  return useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code === 'PGRST116') {
        // No settings found, return default
        return {
          id: '',
          pre_launch_mode: false,
          launch_message: "We're putting the finishing touches on *Bizzin*! Sign up to be notified when we launch.",
          maintenance_mode: false,
          maintenance_message: "We're currently performing maintenance. Please check back soon."
        } as PlatformSettings;
      }

      if (error) throw error;
      return data as PlatformSettings;
    }
  });
}