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
    <div className="flex items-center justify-center py-24 px-4">
      <Card className="w-[400px]">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-center">
            {mode === "signUp" ? "Create Account" : "Sign In to Bizzin"}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Input placeholder="Email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}

            <Input
              type="password"
              placeholder="Password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}

            <Button className="w-full" disabled={isSubmitting}>
              {mode === "signUp" ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <div className="text-center text-sm">
            {mode === "signIn" ? (
              <>
                Don’t have an account?{" "}
                <button
                  onClick={() => setMode("signUp")}
                  className="underline"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("signIn")}
                  className="underline"
                >
                  Sign In
                </button>
              </>
            )}
          </div>

          {message && (
            <p className="text-center text-sm text-muted-foreground">
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
