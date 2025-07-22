import { BrowserRouter, Routes, Route } from "react-router-dom"
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="bizzin-ui-theme">
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                {/* Public route */}
                <Route path="/auth" element={<AuthPage />} />

                {/* Layout-wrapped routes */}
                <Route path="/" element={<Layout />}>
                  {/* Public landing page */}
                  <Route index element={<HomePage />} />
                
                {/* Protected routes */}
                  <Route
                    path="journal"
                    element={
                      <ProtectedRoute>
                        <JournalPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="goals"
                    element={
                      <ProtectedRoute>
                        <GoalsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="training"
                    element={
                      <ProtectedRoute>
                        <TrainingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="docsafe"
                    element={
                      <ProtectedRoute>
                        <DocSafePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
