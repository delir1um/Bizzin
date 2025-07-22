import { useState, useEffect } from "react"
import { useLocation } from "wouter"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/lib/supabase"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const schema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

type FormData = z.infer<typeof schema>

export default function AuthPage() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn")
  const [message, setMessage] = useState("")
  const [, setLocation] = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // Redirect away if already signed in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) setLocation("/dashboard")
    }
    checkSession()
  }, [setLocation])

  const onSubmit = async (data: FormData) => {
    setMessage("")
    const { email, password } = data

    const { error } =
      mode === "signUp"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(error.message)
    } else {
      if (mode === "signUp") {
        setMessage("Check your email for confirmation.")
      } else {
        setLocation("/dashboard")
      }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-[420px]">
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {mode === "signUp" ? "Join Bizzin" : "Welcome Back"}
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            {mode === "signUp" 
              ? "Create your account to start building your business" 
              : "Sign in to continue your business journey"
            }
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-8 space-y-6">
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  {...register("password")}
                  className="h-12 border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:ring-orange-500"
                />
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠</span> {errors.password.message}
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
                    {mode === "signUp" ? "Creating Account..." : "Signing In..."}
                  </div>
                ) : (
                  mode === "signUp" ? "Create Account" : "Sign In"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-800 px-2 text-slate-500">
                  {mode === "signIn" ? "New to Bizzin?" : "Already have an account?"}
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
          <a href="#terms" className="text-orange-600 hover:text-orange-700 underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#privacy" className="text-orange-600 hover:text-orange-700 underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}