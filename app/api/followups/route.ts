/**
 * Follow-Up Generation API Route
 *
 * Dedicated endpoint for generating follow-up suggestions in parallel
 * with the main AI response. Uses a fast, cheap model for efficiency.
 */

import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { generateFollowUpsParallel, generateFallbackFollowUps } from "@/lib/follow-up-generator"
import type { Message } from "@/types"

export const runtime = "edge"

interface FollowUpRequest {
  messages: Message[]
  model?: string // Optional custom model
  apiKey: string
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      )
    }

    // Parse request
    const body = await req.json() as FollowUpRequest
    const { messages, model, apiKey } = body

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 401 }
      )
    }

    console.log(`[FollowUpAPI] Generating follow-ups for conversation with ${messages.length} messages`)

    try {
      // Generate follow-ups using dedicated model
      const followUps = await generateFollowUpsParallel(messages, apiKey, model)

      return NextResponse.json({
        success: true,
        followUps,
        source: 'dedicated-model',
        model: model || 'google/gemini-2.5-flash-preview-09-2025'
      })

    } catch (modelError) {
      // Fallback to template-based suggestions if model fails
      console.warn('[FollowUpAPI] Dedicated model failed, using fallback:', modelError)

      const fallbackFollowUps = generateFallbackFollowUps(messages, messages.length)

      return NextResponse.json({
        success: true,
        followUps: fallbackFollowUps,
        source: 'fallback-templates',
        warning: 'Using fallback suggestions due to model error'
      })
    }

  } catch (error) {
    console.error('[FollowUpAPI] Error:', error)

    return NextResponse.json(
      {
        error: "Failed to generate follow-ups",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
