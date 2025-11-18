import { NextRequest, NextResponse } from "next/server"

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as Blob
    const apiKey = formData.get('apiKey') as string

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 400 })
    }

    // Prepare the form data for OpenAI Whisper API
    const whisperFormData = new FormData()
    whisperFormData.append('file', audioFile, 'audio.webm')
    whisperFormData.append('model', 'whisper-1')
    whisperFormData.append('language', 'de') // German by default, but Whisper auto-detects

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: whisperFormData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Whisper API error:', error)
      return NextResponse.json(
        { error: 'Failed to transcribe audio', details: error },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ text: data.text })
  } catch (error) {
    console.error('Whisper API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
