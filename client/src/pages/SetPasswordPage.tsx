import { useState, useEffect } from "react"
import { useLocation } from "wouter"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { apiRequest } from "@/lib/queryClient"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import brizzinLogoDark from "@/assets/brizzin-logo-dark-v2.webp"
import { Lock, Eye, EyeOff } from "lucide-react"

const schema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof schema>

export default function SetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  // Extract token from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tokenParam = urlParams.get('token')
    
    if (!tokenParam) {
      toast({
        title: "Invalid Link",
        description: "The verification link is invalid or missing.",
        variant: "destructive",
      })
      setLocation('/auth')
      return
    }
    
    setToken(tokenParam)
  }, [setLocation, toast])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast({
        title: "Error",
        description: "Verification token is missing",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await apiRequest('POST', '/api/auth/set-password', {
        token,
        password: data.password,
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success!",
          description: "Your password has been set successfully. You can now sign in.",
        })
        
        // Redirect to auth page with success message
        setLocation('/auth?message=password-set')
      } else {
        throw new Error(result.error || 'Failed to set password')
      }
    } catch (error: any) {
      console.error('Password setting error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to set password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-slate-50 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Verifying link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-slate-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <img 
              src={brizzinLogoDark} 
              alt="Bizzin" 
              className="h-12 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Set Your Password
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Complete your account setup by creating a secure password
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="pl-10 pr-10"
                          data-testid="input-confirm-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isLoading}
                data-testid="button-set-password"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting Password...
                  </>
                ) : (
                  "Set Password & Complete Signup"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <button
                onClick={() => setLocation('/auth')}
                className="text-orange-600 hover:text-orange-700 font-medium"
                data-testid="link-sign-in"
              >
                Sign in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}