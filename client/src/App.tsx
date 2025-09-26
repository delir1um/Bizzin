import { Router, Route, useLocation } from "wouter"
import { QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/lib/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { Layout } from "@/layout/Layout"
import { HomePage } from "@/pages/HomePage"
import { JournalPage } from "@/pages/JournalPage"
import { GoalsPage } from "@/pages/GoalsPage"
import { PodcastPage } from "@/pages/TrainingPage"
import { SeriesPage } from "@/pages/SeriesPage"
import { DocSafePage } from "@/pages/DocSafePage"
import { GoalsPreviewPage } from "@/pages/GoalsPreviewPage"
import { JournalPreviewPage } from "@/pages/JournalPreviewPage"
import { TrainingPreviewPage } from "@/pages/TrainingPreviewPage"
import { DocSafePreviewPage } from "@/pages/DocSafePreviewPage"
import { BizBuilderToolsPage } from "@/pages/BizBuilderToolsPage"
import { BizBuilderToolsPreviewPage } from "@/pages/BizBuilderToolsPreviewPage"
import { AdminVideoPage } from "@/pages/AdminVideoPage"
import AuthPage from "@/pages/AuthPage"
import ProfilePage from "@/pages/ProfilePage"
import ResetPasswordPage from "@/pages/ResetPasswordPage"
import SetPasswordPage from "@/pages/SetPasswordPage"
import { PrivacyPage } from "@/pages/PrivacyPage"
import NotificationSettings from "@/pages/NotificationSettings"
import { AuthProvider, useAuth } from "@/hooks/AuthProvider"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { PreviewOrProtected } from "@/components/PreviewOrProtected"
import { queryClient } from "@/lib/queryClient"
import { DashboardPage } from "@/pages/DashboardPage"
import PreLaunchPage from "@/pages/PreLaunchPage"
import AdminDashboardPage from "@/pages/AdminDashboardPage"
import { useEffect } from "react"
import { usePlatformSettings } from "@/hooks/usePlatformSettings"
import { ReferralService } from "@/lib/services/referrals"

// Component to handle root route logic
function MainRouter() {
  const { user, loading } = useAuth()
  const [, setLocation] = useLocation()

  // Capture referral codes from URL on home page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')
    
    if (refCode) {
      console.log(`📋 Referral code captured on home page: ${refCode}`)
      // Store temporarily for later use during signup
      ReferralService.setTemporaryReferralCode(refCode)
      
      // Remove ref parameter from URL to prevent re-triggers on navigation
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('ref')
      window.history.replaceState(null, '', newUrl.pathname + newUrl.search + newUrl.hash)
      
      // Don't validate here - let AuthPage handle validation to avoid duplicates
    }
  }, [])

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to dashboard
      setLocation("/dashboard")
    }
  }, [user, loading, setLocation])

  // Always show HomePage immediately for unauthenticated users (no loading gate)
  // The redirect effect handles authenticated users
  return user ? null : <HomePage />
}


// Component that wraps auth page with pre-launch logic
function AuthPageWrapper() {
  const { data: settings, isLoading } = usePlatformSettings();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If pre-launch mode is enabled and user is not authenticated, show pre-launch signup
  if (settings?.pre_launch_mode && !user) {
    return <PreLaunchPage />;
  }

  // Otherwise show the normal auth page
  return <AuthPage />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="bizzin-ui-theme">
          <TooltipProvider>
            <Router>
              <Layout>
                <Route path="/" component={() => <MainRouter />} />
                <Route path="/auth" component={AuthPageWrapper} />
                <Route path="/auth/set-password" component={SetPasswordPage} />
                <Route path="/reset-password" component={ResetPasswordPage} />
                <Route path="/admin-login" component={AuthPage} />
                <Route path="/profile" component={() => <ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/dashboard" component={() => <ProtectedRoute><DashboardPage /></ProtectedRoute>} />

                <Route path="/journal" component={() => <PreviewOrProtected protectedComponent={JournalPage} previewComponent={JournalPreviewPage} />} />
                <Route path="/goals" component={() => <PreviewOrProtected protectedComponent={GoalsPage} previewComponent={GoalsPreviewPage} />} />
                <Route path="/training" component={() => <PreviewOrProtected protectedComponent={PodcastPage} previewComponent={TrainingPreviewPage} />} />
                <Route path="/training/series/:seriesSlug">
                  {(params) => <ProtectedRoute><SeriesPage seriesSlug={params.seriesSlug} /></ProtectedRoute>}
                </Route>
                <Route path="/bizbuilder" component={() => <PreviewOrProtected protectedComponent={BizBuilderToolsPage} previewComponent={BizBuilderToolsPreviewPage} />} />
                <Route path="/docsafe" component={() => <PreviewOrProtected protectedComponent={DocSafePage} previewComponent={DocSafePreviewPage} />} />
                <Route path="/admin" component={() => <ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="/admin/videos" component={() => <ProtectedRoute><AdminVideoPage /></ProtectedRoute>} />
                <Route path="/settings/notifications" component={() => <ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
                <Route path="/privacy" component={PrivacyPage} />
              </Layout>
            </Router>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
