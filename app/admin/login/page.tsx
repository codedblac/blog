"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import Link from "next/link"
import { Spinner } from "@/components/ui/spinner"
import { Eye, EyeOff } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const supabase = createClient()

      // ✅ Step 1: Sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        toast.error(signInError.message)
        return
      }

      // ✅ Step 2: Wait for session to be fully ready
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast.error("Session not found")
        return
      }

      const user = session.user

      // ✅ Step 3: Fetch profile safely (NO .single crash)
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .limit(1)

      if (profileError) {
        console.error("PROFILE FETCH ERROR:", profileError)
        await supabase.auth.signOut()
        toast.error("Failed to load profile")
        return
      }

      const profile = profiles?.[0]

      if (!profile) {
        await supabase.auth.signOut()
        toast.error("Profile not found")
        return
      }

      // ✅ Step 4: Role check
      if (!["admin", "editor", "author"].includes(profile.role)) {
        await supabase.auth.signOut()
        toast.error("You do not have permission to access the admin panel")
        return
      }

      // ✅ SUCCESS
      toast.success("Welcome back!")
      router.push("/admin")
      router.refresh()
    } catch (err) {
      console.error("LOGIN ERROR:", err)
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <span className="font-serif text-3xl font-bold text-primary">
              Liz
            </span>
            <span className="ml-1 text-sm text-muted-foreground">Admin</span>
          </div>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your admin account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Sign In
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/admin/signup" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}