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
import { PrivacyPage } from "@/pages/PrivacyPage"
import { AuthProvider, useAuth } from "@/hooks/AuthProvider"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { PreviewOrProtected } from "@/components/PreviewOrProtected"
import { queryClient } from "@/lib/queryClient"
import { DashboardPage } from "@/pages/DashboardPage"
import PreLaunchPage from "@/pages/PreLaunchPage"
import { useEffect } from "react"

// Component to handle root route logic
function MainRouter() {
  const { user, loading } = useAuth()
  const [, setLocation] = useLocation()

  // Check if pre-launch mode is enabled (you can toggle this easily)
  const isPreLaunchMode = import.meta.env.VITE_PRE_LAUNCH_MODE === 'true'

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to dashboard
      setLocation("/dashboard")
    }
  }, [user, loading, setLocation])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show PreLaunchPage if pre-launch mode is enabled for unauthenticated users
  if (!user && isPreLaunchMode) {
    return <PreLaunchPage />
  }

  // Show HomePage for unauthenticated users (development mode)
  return user ? null : <HomePage />
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="bizzin-ui-theme">
          <TooltipProvider>
            <Router>
              {/* Pre-launch mode check */}
              {import.meta.env.VITE_PRE_LAUNCH_MODE === 'true' ? (
                // Pre-launch mode: Only show pre-launch page and auth
                <>
                  <Route path="/" component={() => <PreLaunchPage />} />
                  <Route path="/auth" component={AuthPage} />
                  <Route path="/dashboard" component={() => <ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/profile" component={() => <ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  {/* Add other protected routes for authenticated users */}
                  <Route path="/journal" component={() => <ProtectedRoute><JournalPage /></ProtectedRoute>} />
                  <Route path="/goals" component={() => <ProtectedRoute><GoalsPage /></ProtectedRoute>} />
                  <Route path="/training" component={() => <ProtectedRoute><PodcastPage /></ProtectedRoute>} />
                  <Route path="/training/series/:seriesSlug">
                    {(params) => <ProtectedRoute><SeriesPage seriesSlug={params.seriesSlug} /></ProtectedRoute>}
                  </Route>
                  <Route path="/bizbuilder" component={() => <ProtectedRoute><BizBuilderToolsPage /></ProtectedRoute>} />
                  <Route path="/docsafe" component={() => <ProtectedRoute><DocSafePage /></ProtectedRoute>} />
                  <Route path="/admin/videos" component={() => <ProtectedRoute><AdminVideoPage /></ProtectedRoute>} />
                  <Route path="/privacy" component={PrivacyPage} />
                </>
              ) : (
                // Development mode: Full platform with layout
                <Layout>
                  <Route path="/" component={() => <MainRouter />} />
                  <Route path="/auth" component={AuthPage} />
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
                  <Route path="/admin/videos" component={() => <ProtectedRoute><AdminVideoPage /></ProtectedRoute>} />
                  <Route path="/privacy" component={PrivacyPage} />
                </Layout>
              )}
            </Router>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
