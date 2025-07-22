import { Router, Route } from "wouter"
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
import NotFound from "@/pages/not-found"
import AuthPage from "@/pages/AuthPage"
import { AuthProvider } from "@/hooks/AuthProvider"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { queryClient } from "@/lib/queryClient"
import { DashboardPage } from "@/pages/DashboardPage"


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="bizzin-ui-theme">
          <TooltipProvider>
            <Router>
              {/* Public route */}
              <Route path="/auth" component={AuthPage} />

              {/* Layout-wrapped routes */}
              <Layout>
                {/* Public landing page */}
                <Route path="/" component={HomePage} />
              
                {/* Protected routes */}
                <Route path="/dashboard">
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                </Route>

                <Route path="/journal">
                  <ProtectedRoute>
                    <JournalPage />
                  </ProtectedRoute>
                </Route>
                
                <Route path="/goals">
                  <ProtectedRoute>
                    <GoalsPage />
                  </ProtectedRoute>
                </Route>
                
                <Route path="/training">
                  <ProtectedRoute>
                    <TrainingPage />
                  </ProtectedRoute>
                </Route>
                
                <Route path="/docsafe">
                  <ProtectedRoute>
                    <DocSafePage />
                  </ProtectedRoute>
                </Route>
                
                <Route component={NotFound} />
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
