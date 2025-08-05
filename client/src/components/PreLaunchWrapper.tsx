import React from 'react';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { useAuth } from '@/hooks/AuthProvider';
import PreLaunchPage from '@/pages/PreLaunchPage';

interface PreLaunchWrapperProps {
  children: React.ReactNode;
  bypassForAuth?: boolean; // Allow auth page even in pre-launch mode
}

export function PreLaunchWrapper({ children, bypassForAuth = false }: PreLaunchWrapperProps) {
  const { data: settings, isLoading } = usePlatformSettings();
  const { user, loading: authLoading } = useAuth();

  // Show loading while checking settings and auth
  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If pre-launch mode is enabled and user is not authenticated
  if (settings?.pre_launch_mode && !user && !bypassForAuth) {
    return <PreLaunchPage />;
  }

  // If pre-launch mode is enabled but user is authenticated, they can access the platform
  // If pre-launch mode is disabled, show normal content
  return <>{children}</>;
}