/**
 * API Route Authentication Utilities
 *
 * Provides authentication verification for API routes.
 * Supports both authenticated users and guest mode.
 * Works with both Edge and Node.js runtimes.
 */

import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

export interface AuthResult {
  user: { id: string; email?: string } | null
  isGuest: boolean
  error?: string
}

/**
 * Verify authentication for an API route (Edge-compatible)
 * Returns user info if authenticated, or guest status
 *
 * @param req - The Next.js request object
 * @returns AuthResult with user info or guest status
 */
export async function verifyAuth(req: NextRequest): Promise<AuthResult> {
  try {
    // Check for guest mode cookie
    const guestMode = req.cookies.get("guest-mode")?.value === "true"

    if (guestMode) {
      return { user: null, isGuest: true }
    }

    // Create Supabase client for edge runtime
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll() {
            // Edge routes can't set cookies directly
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      // No valid session - could be guest or expired
      // Don't block - many routes work with API keys from client
      return { user: null, isGuest: false }
    }

    return {
      user: { id: user.id, email: user.email },
      isGuest: false
    }
  } catch (err) {
    console.error("[API Auth] Error verifying auth:", err)
    return { user: null, isGuest: false, error: "Authentication error" }
  }
}

/**
 * Middleware wrapper that requires authentication
 * Returns 401 if not authenticated and not in guest mode
 *
 * @param handler - The API route handler function
 * @returns Wrapped handler that checks auth first
 */
export function requireAuth(
  handler: (req: NextRequest, auth: AuthResult) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const auth = await verifyAuth(req)

    // Allow if authenticated or in guest mode
    if (auth.user || auth.isGuest) {
      return handler(req, auth)
    }

    // Reject if no auth and not guest
    return NextResponse.json(
      { error: auth.error || "Unauthorized" },
      { status: 401 }
    )
  }
}

/**
 * Check if request has valid API key for a specific service
 * This is separate from user auth - some routes need API keys
 *
 * @param req - The request object
 * @param keyName - Name of the header to check (e.g., "x-openrouter-api-key")
 * @returns The API key if present, null otherwise
 */
export function getApiKeyFromRequest(req: NextRequest, keyName: string): string | null {
  return req.headers.get(keyName) || null
}

/**
 * Rate limiting check result
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

/**
 * Simple in-memory rate limiter for API routes
 * Note: This resets on server restart - use Redis for production
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  options: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs
    })
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetTime: now + options.windowMs
    }
  }

  if (record.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime
    }
  }

  record.count++
  return {
    allowed: true,
    remaining: options.limit - record.count,
    resetTime: record.resetTime
  }
}
