import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/AuthProvider"

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()

  if (loading) return null
  return user ? children : <Navigate to="/auth" />
}
