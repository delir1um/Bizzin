import { useState, useRef, useCallback, useEffect } from 'react'

export type SpeechState = 'idle' | 'requesting-permission' | 'ready' | 'listening' | 'processing' | 'error'

export interface SpeechRecognitionResult {
  transcript: string
  isFinal: boolean
  confidence?: number
}

export interface SpeechRecognitionError {
  code: string
  message: string
  retryable: boolean
}

export interface UseSpeechRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  onResult?: (result: SpeechRecognitionResult) => void
  onError?: (error: SpeechRecognitionError) => void
  onStateChange?: (state: SpeechState) => void
  maxRetries?: number
  retryDelay?: number
}

export interface UseSpeechRecognitionReturn {
  state: SpeechState
  isListening: boolean
  isSupported: boolean
  transcript: string
  interimTranscript: string
  confidence: number | null
  error: SpeechRecognitionError | null
  startListening: () => Promise<void>
  stopListening: () => void
  resetTranscript: () => void
  retryCount: number
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const {
    continuous = true,
    interimResults = true,
    language = 'en-US',
    onResult,
    onError,
    onStateChange,
    maxRetries = 3,
    retryDelay = 1000
  } = options

  // State
  const [state, setState] = useState<SpeechState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [confidence, setConfidence] = useState<number | null>(null)
  const [error, setError] = useState<SpeechRecognitionError | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  // Refs
  const recognitionRef = useRef<any>(null)
  const retryTimeoutRef = useRef<number | null>(null)
  const isStartingRef = useRef(false)

  // Derived state
  const isListening = state === 'listening'

  // Update state and notify listeners
  const updateState = useCallback((newState: SpeechState) => {
    console.log('updateState called: -> ', newState)
    setState(newState)
    onStateChange?.(newState)
  }, [onStateChange])

  // Set error and update state
  const setErrorState = useCallback((errorCode: string, errorMessage: string, retryable: boolean = false) => {
    const errorObj: SpeechRecognitionError = {
      code: errorCode,
      message: errorMessage,
      retryable
    }
    setError(errorObj)
    updateState('error')
    onError?.(errorObj)
  }, [onError, updateState])

  // Check if speech recognition is available
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsSupported(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    // Check for HTTPS requirement
    const isHTTPS = window.location.protocol === 'https:'
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    if (!SpeechRecognition || (!isHTTPS && !isLocalhost)) {
      console.log('Speech recognition not supported: Missing API or HTTPS requirement')
      setIsSupported(false)
      setErrorState('not-supported', 'Speech recognition requires HTTPS or a modern browser')
      return
    }

    // Only check API presence and secure context - no permission tests on mount
    console.log('Speech recognition API available')
    setIsSupported(true)
    updateState('ready')
    initializeRecognition()
  }, [setErrorState, updateState])

  // Initialize the main recognition instance
  const initializeRecognition = useCallback(() => {
    if (typeof window === 'undefined' || recognitionRef.current) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = language
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('Speech recognition started - updating state to listening')
      isStartingRef.current = false
      setError(null)
      setConfidence(null) // Reset confidence on new session
      setRetryCount(0)
      updateState('listening')
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        const confidence = result[0].confidence

        if (result.isFinal) {
          finalTranscript += transcript
          setConfidence(confidence * 100)
          
          // Call result callback
          onResult?.({
            transcript: transcript.trim(),
            isFinal: true,
            confidence: confidence * 100
          })
        } else {
          interim += transcript
        }
      }

      if (finalTranscript) {
        setTranscript(prev => {
          const newTranscript = prev + (prev ? ' ' : '') + finalTranscript.trim()
          return newTranscript
        })
      }

      setInterimTranscript(interim)
      
      if (interim) {
        onResult?.({
          transcript: interim,
          isFinal: false
        })
      }
    }

    recognition.onerror = (event: any) => {
      console.log('Speech recognition error:', event.error)
      isStartingRef.current = false

      switch (event.error) {
        case 'not-allowed':
          setErrorState('permission-denied', 'Microphone permission denied. Please enable it in your browser settings.')
          break
        case 'no-speech':
          // Don't treat no-speech as an error in continuous mode - just restart
          if (continuous && state === 'listening') {
            console.log('No speech detected, continuing to listen...')
            // Auto-restart without changing state
            if (recognitionRef.current && !isStartingRef.current) {
              try {
                isStartingRef.current = true
                recognitionRef.current.start()
              } catch (e) {
                console.log('Auto-restart failed:', e)
                updateState('ready')
              }
            }
          } else {
            setErrorState('no-speech', 'No speech detected. Try speaking closer to your microphone.', true)
          }
          break
        case 'audio-capture':
          setErrorState('no-microphone', 'No microphone detected. Please connect a microphone.')
          break
        case 'network':
          setErrorState('network-error', 'Network error occurred. Check your internet connection.', true)
          break
        case 'aborted':
          if (state === 'listening') {
            setErrorState('aborted', 'Recording was interrupted. Trying again...', true)
          }
          break
        case 'language-not-supported':
          setErrorState('language-error', `Language ${language} is not supported.`)
          break
        default:
          setErrorState('unknown-error', `Speech recognition error: ${event.error}`, true)
      }
    }

    recognition.onend = () => {
      console.log('Speech recognition ended, current state:', state)
      isStartingRef.current = false
      setInterimTranscript('')
      
      // Only auto-restart if we're still in listening state and it's continuous mode and no critical errors
      if (state === 'listening' && continuous && retryCount < maxRetries && !error || error?.retryable) {
        console.log('Auto-restarting speech recognition...')
        setRetryCount(prev => prev + 1) // Increment retry count
        retryTimeoutRef.current = window.setTimeout(() => {
          if (state === 'listening' && recognitionRef.current && !isStartingRef.current) {
            try {
              isStartingRef.current = true
              recognitionRef.current.start()
            } catch (e) {
              console.log('Auto-restart failed:', e)
              updateState('ready')
            }
          }
        }, 100) // Shorter delay for better UX
      } else if (state === 'listening') {
        console.log('Ending listening state, returning to ready')
        updateState('ready')
      }
    }

    recognition.onnomatch = () => {
      console.log('No speech match found')
      onResult?.({
        transcript: '',
        isFinal: false
      })
    }

    recognitionRef.current = recognition
  }, [continuous, interimResults, language, onResult, state, retryCount, maxRetries, retryDelay, setErrorState, updateState])

  // Start listening
  const startListening = useCallback(async (): Promise<void> => {
    if (!isSupported || !recognitionRef.current || isStartingRef.current) {
      return
    }

    if (state === 'listening') {
      return
    }

    // Clear previous error
    setError(null)
    setRetryCount(0)

    try {
      updateState('requesting-permission')
      
      // Start recognition directly - let it handle permission requests
      isStartingRef.current = true
      recognitionRef.current.start()
      
    } catch (startError) {
      console.error('Speech recognition start error:', startError)
      isStartingRef.current = false
      setErrorState('start-failed', 'Failed to start voice input. Please try again.')
      updateState('ready')
    }
  }, [isSupported, state, setErrorState, updateState])

  // Stop listening
  const stopListening = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log('Error stopping recognition:', e)
      }
    }

    isStartingRef.current = false
    setInterimTranscript('')
    updateState('ready')
  }, [updateState])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setConfidence(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.log('Error stopping recognition on cleanup:', e)
        }
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  return {
    state,
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
    retryCount
  }
}