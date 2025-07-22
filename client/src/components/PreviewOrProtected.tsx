import { useAuth } from "@/hooks/AuthProvider"

interface PreviewOrProtectedProps {
  protectedComponent: React.ComponentType
  previewComponent: React.ComponentType
}

export function PreviewOrProtected({ 
  protectedComponent: ProtectedComponent, 
  previewComponent: PreviewComponent 
}: PreviewOrProtectedProps) {
  const { user, loading } = useAuth()

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
      </div>
    )
  }

  // Return the appropriate component based on authentication status
  return user ? <ProtectedComponent /> : <PreviewComponent />
}