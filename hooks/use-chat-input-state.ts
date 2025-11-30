'use client'

import { useReducer, useCallback } from 'react'
import type { FileAttachment } from '@/lib/file-handler'

/**
 * Chat input state managed with useReducer for predictable state transitions
 * @see https://kentcdodds.com/blog/should-i-usestate-or-usereducer
 */

export interface ChatInputState {
  input: string
  isLoading: boolean
  webSearchEnabled: boolean
  attachedFiles: FileAttachment[]
  isListening: boolean
  isSpeaking: boolean
  imageMode: boolean
  reasoningEnabled: boolean
  attachedCollectionId: string | null
  showCommandMenu: boolean
}

type ChatInputAction =
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_WEB_SEARCH' }
  | { type: 'SET_WEB_SEARCH'; payload: boolean }
  | { type: 'SET_FILES'; payload: FileAttachment[] }
  | { type: 'ADD_FILES'; payload: FileAttachment[] }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'CLEAR_FILES' }
  | { type: 'SET_LISTENING'; payload: boolean }
  | { type: 'SET_SPEAKING'; payload: boolean }
  | { type: 'TOGGLE_IMAGE_MODE' }
  | { type: 'SET_IMAGE_MODE'; payload: boolean }
  | { type: 'TOGGLE_REASONING' }
  | { type: 'SET_REASONING'; payload: boolean }
  | { type: 'SET_COLLECTION'; payload: string | null }
  | { type: 'SET_COMMAND_MENU'; payload: boolean }
  | { type: 'RESET' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' }

function chatInputReducer(state: ChatInputState, action: ChatInputAction): ChatInputState {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, input: action.payload }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'TOGGLE_WEB_SEARCH':
      return { ...state, webSearchEnabled: !state.webSearchEnabled }

    case 'SET_WEB_SEARCH':
      return { ...state, webSearchEnabled: action.payload }

    case 'SET_FILES':
      return { ...state, attachedFiles: action.payload }

    case 'ADD_FILES':
      return { ...state, attachedFiles: [...state.attachedFiles, ...action.payload] }

    case 'REMOVE_FILE':
      return {
        ...state,
        attachedFiles: state.attachedFiles.filter((f) => f.id !== action.payload),
      }

    case 'CLEAR_FILES':
      return { ...state, attachedFiles: [] }

    case 'SET_LISTENING':
      return { ...state, isListening: action.payload }

    case 'SET_SPEAKING':
      return { ...state, isSpeaking: action.payload }

    case 'TOGGLE_IMAGE_MODE':
      return { ...state, imageMode: !state.imageMode }

    case 'SET_IMAGE_MODE':
      return { ...state, imageMode: action.payload }

    case 'TOGGLE_REASONING':
      return { ...state, reasoningEnabled: !state.reasoningEnabled }

    case 'SET_REASONING':
      return { ...state, reasoningEnabled: action.payload }

    case 'SET_COLLECTION':
      return { ...state, attachedCollectionId: action.payload }

    case 'SET_COMMAND_MENU':
      return { ...state, showCommandMenu: action.payload }

    case 'RESET':
      return {
        ...state,
        input: '',
        attachedFiles: [],
        attachedCollectionId: null,
        showCommandMenu: false,
      }

    case 'SUBMIT_START':
      return { ...state, isLoading: true }

    case 'SUBMIT_END':
      return {
        ...state,
        isLoading: false,
        input: '',
        attachedFiles: [],
        attachedCollectionId: null,
      }

    default:
      return state
  }
}

const getInitialState = (): ChatInputState => {
  // Load reasoning state from localStorage
  let reasoningEnabled = false
  if (typeof window !== 'undefined') {
    reasoningEnabled = localStorage.getItem('chameleon-reasoning-enabled') === 'true'
  }

  return {
    input: '',
    isLoading: false,
    webSearchEnabled: false,
    attachedFiles: [],
    isListening: false,
    isSpeaking: false,
    imageMode: false,
    reasoningEnabled,
    attachedCollectionId: null,
    showCommandMenu: false,
  }
}

export function useChatInputState() {
  const [state, dispatch] = useReducer(chatInputReducer, undefined, getInitialState)

  // Memoized action creators
  const setInput = useCallback((value: string) => {
    dispatch({ type: 'SET_INPUT', payload: value })
  }, [])

  const setLoading = useCallback((value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: value })
  }, [])

  const toggleWebSearch = useCallback(() => {
    dispatch({ type: 'TOGGLE_WEB_SEARCH' })
  }, [])

  const setWebSearch = useCallback((value: boolean) => {
    dispatch({ type: 'SET_WEB_SEARCH', payload: value })
  }, [])

  const addFiles = useCallback((files: FileAttachment[]) => {
    dispatch({ type: 'ADD_FILES', payload: files })
  }, [])

  const removeFile = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_FILE', payload: id })
  }, [])

  const clearFiles = useCallback(() => {
    dispatch({ type: 'CLEAR_FILES' })
  }, [])

  const setListening = useCallback((value: boolean) => {
    dispatch({ type: 'SET_LISTENING', payload: value })
  }, [])

  const setSpeaking = useCallback((value: boolean) => {
    dispatch({ type: 'SET_SPEAKING', payload: value })
  }, [])

  const toggleImageMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_IMAGE_MODE' })
  }, [])

  const setImageMode = useCallback((value: boolean) => {
    dispatch({ type: 'SET_IMAGE_MODE', payload: value })
  }, [])

  const toggleReasoning = useCallback(() => {
    dispatch({ type: 'TOGGLE_REASONING' })
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      const newValue = !state.reasoningEnabled
      localStorage.setItem('chameleon-reasoning-enabled', String(newValue))
    }
  }, [state.reasoningEnabled])

  const setReasoning = useCallback((value: boolean) => {
    dispatch({ type: 'SET_REASONING', payload: value })
    if (typeof window !== 'undefined') {
      localStorage.setItem('chameleon-reasoning-enabled', String(value))
    }
  }, [])

  const setCollection = useCallback((id: string | null) => {
    dispatch({ type: 'SET_COLLECTION', payload: id })
  }, [])

  const setCommandMenu = useCallback((value: boolean) => {
    dispatch({ type: 'SET_COMMAND_MENU', payload: value })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const submitStart = useCallback(() => {
    dispatch({ type: 'SUBMIT_START' })
  }, [])

  const submitEnd = useCallback(() => {
    dispatch({ type: 'SUBMIT_END' })
  }, [])

  return {
    state,
    dispatch,
    // Action creators
    setInput,
    setLoading,
    toggleWebSearch,
    setWebSearch,
    addFiles,
    removeFile,
    clearFiles,
    setListening,
    setSpeaking,
    toggleImageMode,
    setImageMode,
    toggleReasoning,
    setReasoning,
    setCollection,
    setCommandMenu,
    reset,
    submitStart,
    submitEnd,
  }
}

export type { ChatInputAction }
