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
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden">
      {/* Multi-layer animated gradient background - Chameleon colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-green-950/20 dark:to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.15),transparent_50%)]" />

      {/* Large animated blobs - Chameleon colors */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-green-400/40 to-emerald-500/40 dark:from-green-600/30 dark:to-emerald-700/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob opacity-70" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-blue-400/40 to-cyan-500/40 dark:from-blue-600/30 dark:to-cyan-700/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-2000 opacity-70" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-br from-purple-400/40 to-violet-500/40 dark:from-purple-600/30 dark:to-violet-700/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-4000 opacity-70" />

      {/* Smaller accent blobs */}
      <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 dark:from-cyan-600/20 dark:to-blue-700/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-2xl animate-blob animation-delay-1000 opacity-60" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-fuchsia-400/30 to-purple-500/30 dark:from-fuchsia-600/20 dark:to-purple-700/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-2xl animate-blob animation-delay-3000 opacity-60" />

      {/* Grid overlay for depth */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]" />

      {/* Vertical layout: Login form, then tagline, then features */}
      <div className="relative w-full max-w-2xl mx-auto px-6 py-8 md:px-10 z-10">
        <div className="flex flex-col gap-8 items-center justify-center min-h-[calc(100svh-4rem)]">

          {/* TOP: Login form */}
          <div className="w-full max-w-md flex-shrink-0">
            <div className="flex flex-col gap-6">
              {/* Logo & Brand with enhanced effects - Chameleon themed */}
              <div className="flex flex-col items-center gap-4 mb-2">
            <div className="relative group">
              {/* Glow effect - Chameleon colors */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />

              {/* Main icon container */}
              <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 border-2 border-green-500/20 shadow-2xl shadow-green-500/30 animate-float group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                <ChameleonLogo size={80} animated colorShift />
              </div>

              {/* Orbiting particles - Chameleon themed */}
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 animate-ping" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 animate-ping animation-delay-1000" />
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Welcome Back
              </h1>
              <p className="text-muted-foreground text-base">
                Chameleon AI is ready for you 🦎
              </p>
            </div>
          </div>

          {/* Enhanced glassmorphic card - Chameleon themed */}
          <Card className="relative border-2 border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/80 overflow-hidden group hover:shadow-green-500/20 hover:shadow-3xl transition-all duration-300">
            {/* Card glow effect - Chameleon colors */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Shine effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shine" />

            <CardHeader className="text-center space-y-3 relative">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Sign In
              </CardTitle>
              <CardDescription className="text-base">
                Access your AI chat experience
              </CardDescription>
            </CardHeader>

            <CardContent className="relative">
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                      📧 Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 border-2 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 bg-white/50 dark:bg-slate-800/50"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2">
                      🔒 Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 border-2 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 bg-white/50 dark:bg-slate-800/50"
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
                    className="relative w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 hover:from-green-700 hover:via-blue-700 hover:to-purple-700 shadow-lg shadow-green-500/40 hover:shadow-xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
                    disabled={isLoading}
                  >
                    {/* Button shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine" />

                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                    className="relative w-full h-12 text-base font-semibold border-2 border-green-500/30 hover:border-green-500/50 hover:bg-green-500/5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
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

                  <p className="text-xs text-center text-muted-foreground/70 px-2">
                    Guest mode uses local storage only. Add your API keys in settings to start chatting.
                  </p>
                </div>

                <div className="mt-6 text-center text-sm">
                  <span className="text-muted-foreground">Don't have an account?</span>{" "}
                  <Link
                    href="/auth/sign-up"
                    className="font-bold underline underline-offset-4 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-green-700 hover:via-blue-700 hover:to-purple-700 transition-all duration-200 hover:underline-offset-8"
                  >
                    Sign Up →
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
            </div>
          </div>

          {/* MIDDLE: Tagline */}
          <div className="w-full max-w-2xl text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Like a chameleon adapting to its environment
            </h2>
            <p className="text-sm md:text-base text-muted-foreground/80">
              AI chat platform that transforms to match your needs with unique personas, cost tracking, and 100+ AI models
            </p>
          </div>

          {/* BOTTOM: Features */}
          <div className="w-full max-w-2xl space-y-5">
            {/* Power Features */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider text-center">Power Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-lg">💸</span>
                  <div>
                    <div className="font-semibold text-foreground text-sm">Cost Tracker</div>
                    <div className="text-muted-foreground/80 leading-tight">Track spending, monthly projections</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-lg">💾</span>
                  <div>
                    <div className="font-semibold text-foreground text-sm">Export Training Data</div>
                    <div className="text-muted-foreground/80 leading-tight">JSONL, HTML, Markdown</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-lg">🎭</span>
                  <div>
                    <div className="font-semibold text-foreground text-sm">AI Debate Mode</div>
                    <div className="text-muted-foreground/80 leading-tight">Watch 2 AIs debate, vote winner</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-lg">🧠</span>
                  <div>
                    <div className="font-semibold text-foreground text-sm">Advanced Memory</div>
                    <div className="text-muted-foreground/80 leading-tight">Long-term context</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Features */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider text-center">Core Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-lg">🦎</span>
                  <div>
                    <div className="font-semibold text-foreground text-sm">18+ AI Personas</div>
                    <div className="text-muted-foreground/80 leading-tight">Nova, Cami, Dev, Mythos</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-lg">🤖</span>
                  <div>
                    <div className="font-semibold text-foreground text-sm">100+ AI Models</div>
                    <div className="text-muted-foreground/80 leading-tight">GPT-4, Claude, Gemini, Grok</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-lg">🔍</span>
                  <div>
                    <div className="font-semibold text-foreground text-sm">Dual Web Search</div>
                    <div className="text-muted-foreground/80 leading-tight">Tavily & Serper (Google)</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-lg">📱</span>
                  <div>
                    <div className="font-semibold text-foreground text-sm">Mobile-First UI</div>
                    <div className="text-muted-foreground/80 leading-tight">WhatsApp-style nav</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-lg">✨</span>
                  <div>
                    <div className="font-semibold text-foreground text-sm">Prompt Helper</div>
                    <div className="text-muted-foreground/80 leading-tight">AI-powered improvement</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-lg">⚡</span>
                  <div>
                    <div className="font-semibold text-foreground text-sm">Lightning Search</div>
                    <div className="text-muted-foreground/80 leading-tight">10-40x faster (1-5ms)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security & Multi-language */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/60 pt-2">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-green-500/70" />
                <span>Securely encrypted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground/80">🌍 DE • EN • ES</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Footer */}
      <div className="relative z-10">
        <LegalFooter />
      </div>
    </div>
  )
}
