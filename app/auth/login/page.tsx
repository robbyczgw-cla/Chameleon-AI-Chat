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
import { Sparkles, Shield, Lock } from "lucide-react"
import { ChameleonLogo } from "@/components/chameleon-logo"
import { LegalFooter } from "@/components/legal-footer"

export default function Page() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh w-full flex-col">
      <div className="relative flex flex-1 w-full items-center justify-center overflow-hidden">
        {/* Multi-layer animated gradient background - Chameleon colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-green-950/20 dark:to-slate-900 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.15),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none" />

        {/* Static color gradients - no animations for GPU performance */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-green-400/20 to-emerald-500/20 dark:from-green-600/15 dark:to-emerald-700/15 rounded-full mix-blend-multiply dark:mix-blend-soft-light opacity-50 pointer-events-none" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 dark:from-blue-600/15 dark:to-cyan-700/15 rounded-full mix-blend-multiply dark:mix-blend-soft-light opacity-50 pointer-events-none" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-violet-500/20 dark:from-purple-600/15 dark:to-violet-700/15 rounded-full mix-blend-multiply dark:mix-blend-soft-light opacity-50 pointer-events-none" />

        {/* Grid overlay for depth */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)] pointer-events-none" />

        {/* Single column centered layout */}
        <div className="relative w-full max-w-md min-w-[320px] mx-auto px-6 py-6 z-10 shrink-0">
          <div className="flex flex-col gap-6">

            {/* Logo & Brand - Compact */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 opacity-40" />
                <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 border border-green-500/20 shadow-lg">
                  <ChameleonLogo size={48} />
                </div>
              </div>

              <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome Back
                </h1>
                <p className="text-muted-foreground text-sm">
                  Chameleon AI 🦎
                </p>
              </div>
            </div>

            {/* Login Card */}
            <Card className="relative border-2 border-white/20 dark:border-white/10 shadow-xl bg-white/95 dark:bg-slate-900/95">
              <CardHeader className="text-center space-y-2 py-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Sign In
                </CardTitle>
                <CardDescription className="text-sm">
                  Access your AI chat
                </CardDescription>
              </CardHeader>

              <CardContent className="py-4">
                <form onSubmit={handleLogin}>
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-1.5">
                        📧 Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10 border-2 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 bg-white/50 dark:bg-slate-800/50"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-1.5">
                        🔒 Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 border-2 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 bg-white/50 dark:bg-slate-800/50"
                      />
                    </div>

                    {error && (
                      <div className="text-sm text-red-600 dark:text-red-400 bg-red-50/90 dark:bg-red-950/50 p-4 rounded-xl border-2 border-red-200 dark:border-red-900 backdrop-blur-sm animate-shake">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">⚠️</span>
                          <span>{error}</span>
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="relative w-full h-10 text-sm font-semibold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 hover:from-green-700 hover:via-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                      disabled={isLoading}
                    >
                      <span className="relative flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Signing in...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Sign In
                          </>
                        )}
                      </span>
                    </Button>

                    {/* Guest Mode Button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="relative w-full h-10 text-sm font-semibold border-2 border-green-500/30 hover:border-green-500/50 hover:bg-green-500/5 transition-all duration-300"
                      onClick={() => {
                        // SECURITY: Clear any existing API keys before entering guest mode
                        const settingsFromStorage = localStorage.getItem("settings")
                        if (settingsFromStorage) {
                          try {
                            const parsed = JSON.parse(settingsFromStorage)
                            parsed.apiKeys = {
                              openRouter: "",
                              tavily: "",
                              serper: "",
                            }
                            localStorage.setItem("settings", JSON.stringify(parsed))
                          } catch (e) {
                            console.error("Failed to clear API keys:", e)
                          }
                        }

                        // Set both localStorage and cookie for guest mode
                        localStorage.setItem("guest-mode", "true")
                        // Set cookie with 30 day expiry
                        document.cookie = "guest-mode=true; path=/; max-age=2592000; SameSite=Lax"
                        router.push("/")
                      }}
                    >
                      <span className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                        <Sparkles className="w-4 h-4 text-green-600" />
                        Try Without Login
                      </span>
                    </Button>

                    <p className="text-xs text-center text-muted-foreground/70">
                      Guest mode uses localStorage. Add API keys in settings.
                    </p>
                  </div>

                  <div className="mt-4 text-center text-sm">
                    <span className="text-muted-foreground">Don't have an account?</span>{" "}
                    <Link
                      href="/auth/sign-up"
                      className="font-bold underline underline-offset-2 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent hover:underline-offset-4 transition-all"
                    >
                      Sign Up →
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Features - Single column */}
            <div className="space-y-3">
              <p className="text-xs text-center font-medium bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Like a chameleon adapting to its environment
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10">
                  <span className="text-sm">🦎</span>
                  <span className="font-semibold text-foreground text-[11px]">31 Personas</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10">
                  <span className="text-sm">🤖</span>
                  <span className="font-semibold text-foreground text-[11px]">100+ Models</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10">
                  <span className="text-sm">💸</span>
                  <span className="font-semibold text-foreground text-[11px]">Cost Tracking</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10">
                  <span className="text-sm">🎭</span>
                  <span className="font-semibold text-foreground text-[11px]">AI Debates</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10">
                  <span className="text-sm">🔍</span>
                  <span className="font-semibold text-foreground text-[11px]">Web Search</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10">
                  <span className="text-sm">🧠</span>
                  <span className="font-semibold text-foreground text-[11px]">Memory</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground/60">
                <div className="flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-green-500/70" />
                  <span>Secure</span>
                </div>
                <span>•</span>
                <span>🌍 DE • EN • ES</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Footer - Outside background container */}
      <LegalFooter />
    </div>
  )
}
