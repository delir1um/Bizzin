import React from 'react';

// This wrapper is no longer needed since we handle pre-launch logic directly in App.tsx
// Keeping it for compatibility but making it a simple passthrough
interface PreLaunchWrapperProps {
  children: React.ReactNode;
  bypassForAuth?: boolean;
}

export function PreLaunchWrapper({ children }: PreLaunchWrapperProps) {
  return <>{children}</>;
}