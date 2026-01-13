import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { getOpenRouterHeaders } from '@/lib/utils'

export const runtime = 'edge'

// Default image generation models (can be overridden via request body)
export const DEFAULT_IMAGE_MODEL_NORMAL = 'google/gemini-2.5-flash-image'
export const DEFAULT_IMAGE_MODEL_HIGH = 'google/gemini-3-pro-image-preview'

/**
 * Generate images using Gemini 2.5 Flash Image
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting: Get client identifier (IP or forwarded IP)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = checkRateLimit(`image:${clientIp}`, { limit: 20, windowMs: 60000 }) // 20 image requests per minute

    if (rateLimitResult.limited) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many image generation requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    const { prompt, apiKey, inputImages, quality, customModel } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Select model - use custom model if provided, otherwise select based on quality
    let IMAGE_MODEL: string
    if (customModel) {
      IMAGE_MODEL = customModel
    } else {
      IMAGE_MODEL = quality === 'high' ? DEFAULT_IMAGE_MODEL_HIGH : DEFAULT_IMAGE_MODEL_NORMAL
    }
    console.log(`[Image Gen] Using model: ${IMAGE_MODEL} (quality: ${quality || 'normal'}, custom: ${!!customModel})`)

    // Build message content - include input images for image-to-image if provided
    let messageContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }> = prompt

    if (inputImages && Array.isArray(inputImages) && inputImages.length > 0) {
      // Image-to-image: include input images + text prompt
      messageContent = [
        ...inputImages.map((base64Url: string) => ({
          type: 'image_url' as const,
          image_url: { url: base64Url }
        })),
        {
          type: 'text' as const,
          text: prompt
        }
      ]
      console.log(`[Image Gen] Image-to-image mode with ${inputImages.length} input image(s)`)
    }

    // Call OpenRouter with Gemini image model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...getOpenRouterHeaders("Image Generation"),
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        modalities: ['image', 'text'],
        messages: [
          {
            role: 'user',
            content: messageContent
          }
        ],
      }),
    })

    if (!response.ok) {
      let error
      try {
        error = await response.json()
      } catch (e) {
        const text = await response.text()
        console.error('OpenRouter image error (non-JSON):', text)
        return NextResponse.json(
          { error: `Image generation failed: ${text}` },
          { status: response.status }
        )
      }
      console.error('OpenRouter image error:', error)
      return NextResponse.json(
        {
          error: error.error?.message || `Image generation failed`,
          details: error
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[Image Gen] Full Response:', JSON.stringify(data, null, 2))

    // Parse response - try multiple formats
    if (data.choices && data.choices[0]?.message) {
      const message = data.choices[0].message

      // Format 1: message.images[] array (OpenRouter standard)
      if (message.images && Array.isArray(message.images) && message.images.length > 0) {
        const firstImage = message.images[0]
        // Check various image URL locations
        const imageUrl = firstImage?.image_url?.url || firstImage?.url || firstImage?.b64_json
        if (imageUrl) {
          console.log('[Image Gen] ✅ Found image in message.images[]')
          const url = firstImage?.b64_json ? `data:image/png;base64,${firstImage.b64_json}` : imageUrl
          return NextResponse.json({ url, model: IMAGE_MODEL, prompt })
        }
      }

      // Format 2: content array with image parts
      if (Array.isArray(message.content)) {
        for (const item of message.content) {
          // Check for image_url type
          if (item.type === 'image_url' && item.image_url?.url) {
            console.log('[Image Gen] ✅ Found image in content[] as image_url')
            return NextResponse.json({ url: item.image_url.url, model: IMAGE_MODEL, prompt })
          }
          // Check for image type with data
          if (item.type === 'image' && (item.data || item.source?.data)) {
            const b64 = item.data || item.source?.data
            console.log('[Image Gen] ✅ Found image in content[] as base64 data')
            return NextResponse.json({ url: `data:image/png;base64,${b64}`, model: IMAGE_MODEL, prompt })
          }
          // Check for inline_data (Google format)
          if (item.inline_data?.data) {
            const mime = item.inline_data.mime_type || 'image/png'
            console.log('[Image Gen] ✅ Found image in content[] as inline_data')
            return NextResponse.json({ url: `data:${mime};base64,${item.inline_data.data}`, model: IMAGE_MODEL, prompt })
          }
        }
      }

      // Format 3: Check for base64 in text content
      if (typeof message.content === 'string') {
        // Check for data URL
        const dataUrlMatch = message.content.match(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/)
        if (dataUrlMatch) {
          console.log('[Image Gen] ✅ Found data URL in text content')
          return NextResponse.json({ url: dataUrlMatch[1], model: IMAGE_MODEL, prompt })
        }
        // Check for http URL
        const urlMatch = message.content.match(/(https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|webp|gif))/i)
        if (urlMatch) {
          console.log('[Image Gen] ✅ Found http URL in text content')
          return NextResponse.json({ url: urlMatch[1], model: IMAGE_MODEL, prompt })
        }
      }
    }

    // Log the full response for debugging
    console.error('[Image Gen] Could not extract image URL. Full response:', JSON.stringify(data, null, 2))

    // Return the FULL raw response so user can see what's happening
    return NextResponse.json(
      {
        error: `No image found in response. RAW RESPONSE: ${JSON.stringify(data, null, 2)}`,
        debugInfo: {
          model: IMAGE_MODEL,
          hasImages: !!data.choices?.[0]?.message?.images,
          hasContent: !!data.choices?.[0]?.message?.content,
          contentType: typeof data.choices?.[0]?.message?.content,
          keys: Object.keys(data.choices?.[0]?.message || {})
        }
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
