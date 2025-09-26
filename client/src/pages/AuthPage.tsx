import { useState, useEffect, useRef } from "react"
import { useLocation } from "wouter"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/lib/supabase"
import { ReferralService } from "@/lib/services/referrals"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { useTheme } from "@/lib/theme-provider"
import { FooterContentModal, type FooterContentType } from "@/components/footer/FooterContentModal"
import brizzinLogoDark from "@/assets/brizzin-logo-dark-v2.webp"

const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  referralCode: z.string().optional(),
})

const signUpSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  referralCode: z.string().optional(),
})

type SignInFormData = z.infer<typeof signInSchema>
type SignUpFormData = z.infer<typeof signUpSchema>
type FormData = SignInFormData | SignUpFormData

export default function AuthPage() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn")
  const [message, setMessage] = useState("")
  const [, setLocation] = useLocation()
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralValid, setReferralValid] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const [isFooterModalOpen, setIsFooterModalOpen] = useState(false)
  const [footerContentType, setFooterContentType] = useState<FooterContentType | null>(null)
  const { theme } = useTheme()
  
  // Prevent React StrictMode double-validation
  const didValidateRef = useRef(false)
  
  const currentLogo = brizzinLogoDark // Always use dark version

  const handleFooterLinkClick = (contentType: FooterContentType) => {
    setFooterContentType(contentType)
    setIsFooterModalOpen(true)
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ 
    resolver: zodResolver(mode === "signUp" ? signUpSchema : signInSchema) 
  })

  const emailValue = watch('email')

  // Check for referral code in URL and localStorage and validate it
  useEffect(() => {
    // Prevent React StrictMode double-run
    if (didValidateRef.current) return
    didValidateRef.current = true
    
    const urlParams = new URLSearchParams(window.location.search)
    const urlRefCode = urlParams.get('ref')
    
    // Check URL first
    if (urlRefCode) {
      console.log(`📋 Referral code found in URL: ${urlRefCode}`)
      setReferralCode(urlRefCode)
      // Store temporarily in case user needs to confirm email
      ReferralService.setTemporaryReferralCode(urlRefCode)
      
      // Validate referral code (now cached and deduplicated)
      ReferralService.validateReferralCode(urlRefCode).then(valid => {
        setReferralValid(valid)
        if (valid) {
          setMode("signUp") // Switch to signup mode for referrals
        }
      })
      return
    }
    
    // If no URL referral code, check localStorage for temporary one
    const tempRefCode = ReferralService.getTemporaryReferralCode()
    if (tempRefCode) {
      console.log(`📋 Referral code found in localStorage: ${tempRefCode}`)
      setReferralCode(tempRefCode)
      
      // Validate the stored referral code (now cached and deduplicated)
      ReferralService.validateReferralCode(tempRefCode).then(valid => {
        setReferralValid(valid)
        if (valid) {
          setMode("signUp") // Switch to signup mode for referrals
        }
      })
    }
  }, [])

  // Redirect away if already signed in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) setLocation("/dashboard")
    }
    checkSession()
  }, [setLocation])

  const handlePasswordReset = async (email: string) => {
    if (!email || email.trim() === '') {
      setMessage("Please enter your email address")
      return
    }

    setIsResettingPassword(true)
    setMessage("")
    
    try {
      const response = await fetch('/api/email/system/test-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage("Check your email for password reset instructions")
        setShowResetForm(false) // Hide reset form after successful send
      } else {
        setMessage(data.error || "Failed to send reset email")
      }
    } catch (error) {
      setMessage("Failed to send reset email. Please try again.")
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleForgotPasswordClick = () => {
    setShowResetForm(true)
    setMessage("")
    // Clear any previous form errors when switching to reset mode
  }

  const handleBackToSignIn = () => {
    setShowResetForm(false)
    setMessage("")
  }

  const onSubmit = async (data: FormData) => {
    setMessage("")
    const { email } = data
    const password = 'password' in data ? data.password : undefined

    if (mode === "signUp") {
      try {
        console.log('Starting server-side signup process for:', email)
        
        // Use server-side signup with beautiful email template (no password required)
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email,
            referralCode: referralCode || (data as any).referralCode
          })
        })

        const result = await response.json()
        console.log('Server signup response:', result)

        if (response.ok && result.success) {
          setMessage(result.message)
        } else {
          setMessage(result.error || "Signup failed. Please try again.")
        }
      } catch (signupError) {
        console.error('Error during signup process:', signupError)
        setMessage("Signup failed. Please try again or contact support if the problem persists.")
      }
    } else {
      // Sign in requires password
      if (!password) {
        setMessage("Password is required for sign in")
        return
      }
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        setMessage(error.message)
      } else if (signInData.user) {
        // Check if email is verified
        if (!signInData.user.email_confirmed_at) {
          setMessage("Please verify your email address before signing in. Check your inbox for a verification link.")
          // Sign out the user since they shouldn't have access without verification
          await supabase.auth.signOut()
          return
        }
        setLocation("/dashboard")
      }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:bg-[#0B0A1D]">
      <div className="w-full max-w-[420px]">
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <div className="h-10 flex items-center justify-center mx-auto mb-4">
            <img src={currentLogo} alt="Bizzin Logo" className="h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {showResetForm ? (
              "Reset Your Password"
            ) : mode === "signUp" ? (
              <>Join <span className="italic">Bizzin</span></>
            ) : (
              "Welcome Back"
            )}
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            {showResetForm 
              ? "Enter your email address and we'll send you a reset link"
              : mode === "signUp" 
              ? "Create your account to start building your business" 
              : "Sign in to continue your business journey"
            }
          </p>
        </div>

        {/* Referral Indicator */}
        {referralCode && referralValid && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300 font-medium">
                You've been referred to <span className="italic">Bizzin</span>!
              </span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Sign up to start earning benefits through our referral program
            </p>
          </div>
        )}

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-8 space-y-6">
            {showResetForm ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <Input 
                    placeholder="Enter your email address" 
                    {...register("email")}
                    className="h-12 border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:ring-orange-500"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span>⚠</span> {errors.email.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="button"
                  onClick={() => handlePasswordReset(emailValue)}
                  disabled={isResettingPassword}
                  className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                >
                  {isResettingPassword ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending Reset Email...
                    </div>
                  ) : (
                    "Send Reset Email"
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleBackToSignIn}
                    className="text-orange-600 hover:text-orange-700 font-medium transition-colors text-sm"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <Input 
                    placeholder="Enter your email" 
                    {...register("email")}
                    className="h-12 border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:ring-orange-500"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span>⚠</span> {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field - Only show for sign-in */}
                {mode === "signIn" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPasswordClick}
                        className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      {...register("password" as any)}
                      className="h-12 border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:ring-orange-500"
                    />
                    {(errors as any).password && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span>⚠</span> {(errors as any).password.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Referral Code Field - Only show for signup */}
                {mode === "signUp" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Referral Code {referralCode && referralValid ? "" : "(Optional)"}
                    </label>
                    <Input
                      placeholder="Enter referral code"
                      {...register("referralCode")}
                      defaultValue={referralCode || ""}
                      disabled={!!(referralCode && referralValid)}
                      className={`h-12 border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:ring-orange-500 ${
                        referralCode && referralValid ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 cursor-not-allowed' : ''
                      }`}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {referralCode && referralValid ? (
                        <span className="text-green-600 dark:text-green-400">
                          ✅ Referral code applied! You'll get <strong>30 days free</strong> when you upgrade to premium!
                        </span>
                      ) : (
                        <>Got a referral code? You'll get <strong>30 days free</strong> when you upgrade to premium!</>
                      )}
                    </p>
                  </div>
                )}

                <Button 
                  className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 mt-6" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {mode === "signUp" ? "Creating Account..." : "Signing In..."}
                    </div>
                  ) : (
                    mode === "signUp" ? "Create Account" : "Sign In"
                  )}
                </Button>
              </form>
            )}

            {!showResetForm && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-800 px-2 text-slate-500">
                      {mode === "signIn" ? (
                        <>New to <span className="italic">Bizzin</span>?</>
                      ) : (
                        "Already have an account?"
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
                    className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                  >
                    {mode === "signIn" ? "Create a free account" : "Sign in to your account"}
                  </button>
                </div>
              </>
            )}

            {message && (
              <div className={`p-3 rounded-lg text-sm text-center ${
                message.includes("error") || message.includes("Error")
                  ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                  : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              }`}>
                {message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terms */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          By continuing, you agree to our{" "}
          <button
            onClick={() => handleFooterLinkClick('terms')}
            className="text-orange-600 hover:text-orange-700 underline cursor-pointer"
            data-testid="link-terms"
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            onClick={() => handleFooterLinkClick('privacy')}
            className="text-orange-600 hover:text-orange-700 underline cursor-pointer"
            data-testid="link-privacy"
          >
            Privacy Policy
          </button>
        </p>
      </div>

      {/* Footer Content Modal */}
      <FooterContentModal
        isOpen={isFooterModalOpen}
        onClose={() => setIsFooterModalOpen(false)}
        contentType={footerContentType}
      />
    </div>
  )
}