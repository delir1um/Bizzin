import { useState } from "react"
import { Mail, RefreshCw, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/AuthProvider"

export function EmailVerificationRequired() {
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const { user, signOut } = useAuth()

  const handleResendVerification = async () => {
    if (!user?.email) return

    setIsResending(true)
    setResendMessage("")

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })

      if (error) {
        setResendMessage(`Error: ${error.message}`)
      } else {
        setResendMessage("Verification email sent! Check your inbox and spam folder.")
      }
    } catch (error) {
      setResendMessage("Failed to resend verification email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:bg-[#0B0A1D]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Email Verification Required
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                Please verify your email address to access your account. Check your inbox for a verification link.
              </p>
            </div>

            {/* User Email */}
            {user?.email && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Verification email sent to:
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {user.email}
                </p>
              </div>
            )}

            {/* Message */}
            {resendMessage && (
              <div className={`p-4 rounded-lg ${
                resendMessage.startsWith('Error') 
                  ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' 
                  : 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
              }`}>
                <div className="flex items-center gap-2">
                  {resendMessage.startsWith('Error') ? (
                    <RefreshCw className="w-5 h-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                  <span className={`text-sm ${
                    resendMessage.startsWith('Error')
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-green-700 dark:text-green-300'
                  }`}>
                    {resendMessage}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full"
                data-testid="button-resend-verification"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>

              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="w-full"
                data-testid="button-sign-out"
              >
                Sign Out
              </Button>
            </div>

            {/* Instructions */}
            <div className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
              <p>Can't find the email? Check your spam folder.</p>
              <p>Still having trouble? Contact support for assistance.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}