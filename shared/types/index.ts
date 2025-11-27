/**
 * Shared TypeScript types between web and mobile
 * These are the core data structures used across platforms
 */

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  tokens?: {
    prompt: number
    completion: number
    total: number
    estimatedCost?: number
  }
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  model: string
  personaId?: string
  folderId?: string
  pinned?: boolean
}

export interface Persona {
  id: string
  name: string
  emoji: string
  description: string
  personality?: string
  color: string
  avatarUrl?: string
}

export interface AppSettings {
  language?: 'en' | 'de'
  apiKeys: {
    openRouter?: string
    openAI?: string
    tavily?: string
    serper?: string
  }
  selectedModel: string
  selectedPersona?: Persona
  systemPrompt: string
  modelParameters?: {
    temperature: number
    maxTokens: number
    topP: number
    frequencyPenalty: number
    presencePenalty: number
  }
  fontFamily?: 'inter' | 'roboto' | 'atkinson' | 'opendyslexic' | 'jetbrains' | 'system'
  fontSize?: 'small' | 'medium' | 'large'
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
