"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Sparkles } from "lucide-react"
import { LegalFooter } from "@/components/legal-footer"

export default function Page() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwörter stimmen nicht überein")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein")
      setIsLoading(false)
      return
    }

    try {
      console.log("[v0] Starting signup for:", email)

      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        console.error("[v0] SignUp error:", signUpError)
        throw signUpError
      }

      if (!signUpData.user) {
        throw new Error("User creation failed - no user data returned")
      }

      console.log("[v0] User created:", signUpData.user.id)

      // Check if email confirmation is required
      if (signUpData.user.identities && signUpData.user.identities.length === 0) {
        setError("Bitte bestätige deine E-Mail Adresse. Wir haben dir einen Link geschickt.")
        return
      }

      // Try to sign in immediately
      console.log("[v0] Signing in...")
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error("[v0] SignIn error:", signInError)
        throw signInError
      }

      console.log("[v0] Signed in successfully")

      // Wait a moment for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500))

      // Verify profile exists, create if not
      console.log("[v0] Verifying profile...")
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", signUpData.user.id)
        .single()

      if (!existingProfile) {
        console.log("[v0] Profile doesn't exist, creating...")
        const { error: profileError } = await supabase.from("profiles").insert({
          id: signUpData.user.id,
          email: signUpData.user.email,
        })

        if (profileError) {
          console.error("[v0] Profile creation error:", profileError)
          throw new Error(`Profile creation failed: ${profileError.message}`)
        }
      }

      // Verify settings exist, create if not
      console.log("[v0] Verifying settings...")
      const { data: existingSettings } = await supabase
        .from("user_settings")
        .select("user_id")
        .eq("user_id", signUpData.user.id)
        .single()

      // Check if user is registering with team email for special access
      const isTeamEmail = email.toLowerCase().endsWith("@hifiteam.at")
      const accessTier = isTeamEmail ? "hifi" : "standard"

      if (isTeamEmail) {
        console.log("[v0] Team email detected, setting access tier to hifi")
      }

      if (!existingSettings) {
        console.log("[v0] Settings don't exist, creating...")
        const { error: settingsError } = await supabase.from("user_settings").insert({
          user_id: signUpData.user.id,
          // All users get Grok 4.1 Fast (best tool calling, $0.50/M output)
          selected_model: "x-ai/grok-4.1-fast",
          temperature: 0.7,
          max_tokens: 16000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          system_prompt:
            "You are a helpful, knowledgeable AI assistant. Provide comprehensive, detailed, and well-structured answers. When answering questions, be thorough and explain concepts fully. Use examples where appropriate. Don't cut answers short - complete your thoughts and provide meaningful, substantive responses.",
          tavily_search_depth: "basic",
          tavily_max_results: 5,
          tavily_include_images: true,
          tavily_include_answer: true,
          // Team access configuration
          access_tier: accessTier,
          simple_mode: !!isTeamEmail, // Team users always start in simple mode
        })

        if (settingsError) {
          console.error("[v0] Settings creation error:", settingsError)
          throw new Error(`Settings creation failed: ${settingsError.message}`)
        }
      }

      console.log("[v0] Signup complete, redirecting...")
      router.push("/")
    } catch (error: unknown) {
      console.error("[v0] Sign up error:", error)
      const errorMessage = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full flex-col bg-gradient-to-br from-background via-background to-orange-950/5">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10 pb-32 md:pb-24">
        <div className="w-full max-w-md min-w-[320px] mx-auto px-2 sm:px-0">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Logo */}
            <div className="flex justify-center mb-2 sm:mb-4">
              <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 shadow-lg shadow-orange-500/20">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>

            <Card className="border-border/50 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-xl sm:text-2xl">Registrieren</CardTitle>
                <CardDescription>Erstelle einen neuen Account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp}>
                  <div className="flex flex-col gap-4 sm:gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-Mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="deine@email.de"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Passwort</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="repeat-password">Passwort wiederholen</Label>
                      <Input
                        id="repeat-password"
                        type="password"
                        required
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                      />
                    </div>
                    {error && (
                      <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">{error}</div>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Registrieren..." : "Registrieren"}
                    </Button>
                  </div>
                  <div className="mt-4 text-center text-sm">
                    Bereits ein Account?{" "}
                    <Link
                      href="/auth/login"
                      className="underline underline-offset-4 text-orange-600 hover:text-orange-700"
                    >
                      Anmelden
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Legal Footer - Fixed but with proper spacing */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:relative md:mt-auto">
        <LegalFooter />
      </div>
    </div>
  )
}
