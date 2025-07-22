import { Router, Route, useLocation } from "wouter"
import { QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/lib/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { Layout } from "@/layout/Layout"
import { HomePage } from "@/pages/HomePage"
import { JournalPage } from "@/pages/JournalPage"
import { GoalsPage } from "@/pages/GoalsPage"
import { TrainingPage } from "@/pages/TrainingPage"
import { DocSafePage } from "@/pages/DocSafePage"
import AuthPage from "@/pages/AuthPage"
import { AuthProvider, useAuth } from "@/hooks/AuthProvider"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { queryClient } from "@/lib/queryClient"
import { DashboardPage } from "@/pages/DashboardPage"
import { useEffect } from "react"

// Component to handle root route logic
function MainRouter() {
  const { user, loading } = useAuth()
  const [, setLocation] = useLocation()

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

  // Show HomePage for unauthenticated users
  return user ? null : <HomePage />
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="bizzin-ui-theme">
          <TooltipProvider>
            <Router>
              {/* Public auth route */}
              <Route path="/auth" component={AuthPage} />

              {/* All other routes go through layout */}
              <Layout>
                <Route path="/" component={() => <MainRouter />} />
                <Route path="/dashboard" component={() => <ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/journal" component={() => <ProtectedRoute><JournalPage /></ProtectedRoute>} />
                <Route path="/goals" component={() => <ProtectedRoute><GoalsPage /></ProtectedRoute>} />
                <Route path="/training" component={() => <ProtectedRoute><TrainingPage /></ProtectedRoute>} />
                <Route path="/docsafe" component={() => <ProtectedRoute><DocSafePage /></ProtectedRoute>} />
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
