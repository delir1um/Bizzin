import { useState, useEffect } from "react"
import { useLocation } from "wouter"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/lib/supabase"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import brizzinLogoDark from "@/assets/brizzin-logo-dark-v2.webp"

const schema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("")
  const [, setLocation] = useLocation()
  const [isLoading, setIsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    // Check if user has a valid session from the reset link
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setMessage("Invalid or expired reset link. Please request a new password reset.")
        setTimeout(() => setLocation("/auth"), 3000)
      }
      setIsLoading(false)
    }
    checkSession()
  }, [setLocation])

  const onSubmit = async (data: FormData) => {
    setMessage("")
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })
      
      if (error) {
        setMessage(error.message)
      } else {
        setMessage("Password updated successfully! Redirecting to dashboard...")
        setTimeout(() => setLocation("/dashboard"), 2000)
      }
    } catch (error) {
      setMessage("Failed to update password. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:bg-[#0B0A1D]">
      <div className="w-full max-w-[420px]">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="h-10 flex items-center justify-center mx-auto mb-4">
            <img src={brizzinLogoDark} alt="Bizzin Logo" className="h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Reset Your Password
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Enter your new password below
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter your new password"
                  {...register("password")}
                  className="h-12 border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:ring-orange-500"
                />
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠</span> {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  placeholder="Confirm your new password"
                  {...register("confirmPassword")}
                  className="h-12 border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:ring-orange-500"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠</span> {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button 
                className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 mt-6" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating Password...
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>

            {message && (
              <div className={`p-3 rounded-lg text-sm text-center ${
                message.includes("error") || message.includes("Failed") || message.includes("Invalid")
                  ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                  : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
              }`}>
                {message}
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => setLocation("/auth")}
                className="text-orange-600 hover:text-orange-700 font-medium transition-colors text-sm"
              >
                Back to Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}