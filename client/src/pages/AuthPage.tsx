import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { authService } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type FormData = z.infer<typeof schema>

export default function AuthPage() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn")
  const [message, setMessage] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setMessage("")
    const { email, password } = data

    const result =
      mode === "signUp"
        ? await authService.signUp(email, password)
        : await authService.signIn(email, password)

    setMessage(result.error || "Authentication successful!")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-center">
            {mode === "signUp" ? "Create Account" : "Sign In to Bizzin"}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Input placeholder="Email" {...register("email")} />
            <p className="text-sm text-red-500">{errors.email?.message}</p>

            <Input
              type="password"
              placeholder="Password"
              {...register("password")}
            />
            <p className="text-sm text-red-500">{errors.password?.message}</p>

            <Button className="w-full" disabled={isSubmitting}>
              {mode === "signUp" ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <div className="text-center text-sm">
            {mode === "signIn" ? (
              <>
                Don’t have an account?{" "}
                <button onClick={() => setMode("signUp")} className="underline">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("signIn")} className="underline">
                  Sign In
                </button>
              </>
            )}
          </div>

          {message && <p className="text-center text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
