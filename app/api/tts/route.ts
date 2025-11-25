import { NextRequest, NextResponse } from "next/server"

export const runtime = 'edge'

// OpenAI TTS voices
export const OPENAI_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const
export type OpenAIVoice = typeof OPENAI_VOICES[number]

export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'nova', speed = 1.0, apiKey } = await req.json()

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 400 })
    }

    // Limit text length to avoid huge API costs
    const truncatedText = text.slice(0, 4096)

    console.log('[TTS API] Generating speech:', {
      textLength: truncatedText.length,
      voice,
      speed
    })

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: truncatedText,
        voice: voice,
        speed: speed,
        response_format: 'mp3',
      }),
    })

    if (!response.ok) {
      let errorDetails = 'Unknown error'
      try {
        const errorData = await response.json()
        console.error('[TTS API] OpenAI error:', errorData)
        errorDetails = errorData.error?.message || JSON.stringify(errorData)
      } catch {
        errorDetails = await response.text()
      }
      return NextResponse.json(
        { error: 'Failed to generate speech', details: errorDetails },
        { status: response.status }
      )
    }

    // Return the audio as a blob
    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('[TTS API] Route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
