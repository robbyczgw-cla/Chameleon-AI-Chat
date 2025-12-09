"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { memoryService } from "@/lib/memory-service"
import { personaMemoryService } from "@/lib/persona-memory-service"

interface AuthContextType {
  user: any | null
  isAuthLoading: boolean
  isGuestMode: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  onUserChange?: (user: any | null) => void
}

export function AuthProvider({ children, onUserChange }: AuthProviderProps) {
  const [user, setUser] = useState<any | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isGuestMode, setIsGuestMode] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const initAuth = async () => {
      // Check for guest mode
      const guestMode = typeof window !== "undefined" && localStorage.getItem("guest-mode") === "true"
      setIsGuestMode(guestMode)

      if (guestMode) {
        console.log("[AuthContext] Guest mode active")
        setUser(null)
        setIsAuthLoading(false)
        return
      }

      // Check Supabase auth
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        onUserChange?.(user)
      } catch (error) {
        console.error("[AuthContext] Auth check failed:", error)
      } finally {
        setIsAuthLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AuthContext] Auth state changed:", event)

      if (event === "SIGNED_IN") {
        setUser(session?.user ?? null)
        onUserChange?.(session?.user ?? null)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        onUserChange?.(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [onUserChange])

  const signOut = async () => {
    // SECURITY: Clear ALL memories on logout to prevent data leakage
    memoryService.clearOnLogout()
    personaMemoryService.clearOnLogout()

    if (isGuestMode) {
      localStorage.removeItem("guest-mode")
      document.cookie = "guest-mode=; path=/; max-age=0"
      setUser(null)
      setIsGuestMode(false)
      window.location.href = "/auth/login"
    } else {
      await supabase.auth.signOut()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthLoading,
        isGuestMode,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
