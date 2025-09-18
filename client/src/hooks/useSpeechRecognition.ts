import { useState, useRef, useCallback, useEffect } from 'react'

export type SpeechState = 'idle' | 'requesting-permission' | 'ready' | 'listening' | 'processing' | 'auto-paused' | 'session-ended' | 'error'

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
  onAutoStop?: (reason: 'silence' | 'session-limit', duration: number) => void
  onSessionWarning?: (remainingSeconds: number) => void
  maxRetries?: number
  retryDelay?: number
  silenceTimeoutMs?: number
  maxSessionMs?: number
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
  resumeListening: () => Promise<void>
  resetTranscript: () => void
  retryCount: number
  sessionDuration: number
  autoStopReason: 'silence' | 'session-limit' | null
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const {
    continuous = true,
    interimResults = true,
    language = 'en-US',
    onResult,
    onError,
    onStateChange,
    onAutoStop,
    onSessionWarning,
    maxRetries = 3,
    retryDelay = 1000,
    silenceTimeoutMs = 8000, // 8 seconds
    maxSessionMs = 180000 // 3 minutes
  } = options

  // State
  const [state, setState] = useState<SpeechState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [confidence, setConfidence] = useState<number | null>(null)
  const [error, setError] = useState<SpeechRecognitionError | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [autoStopReason, setAutoStopReason] = useState<'silence' | 'session-limit' | null>(null)

  // Refs
  const recognitionRef = useRef<any>(null)
  const retryTimeoutRef = useRef<number | null>(null)
  const isStartingRef = useRef(false)
  const shouldStopRef = useRef(false)
  const lastSpeechAtRef = useRef<number | null>(null)
  const silenceTimeoutRef = useRef<number | null>(null)
  const sessionTimeoutRef = useRef<number | null>(null)
  const sessionWarningTimeoutRef = useRef<number | null>(null)
  const sessionWarningShownRef = useRef(false)
  const stateRef = useRef<SpeechState>('idle')

  // Derived state
  const isListening = state === 'listening'
  const sessionDuration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0

  // Update state and notify listeners
  const updateState = useCallback((newState: SpeechState) => {
    console.log('updateState called: -> ', newState)
    setState(newState)
    stateRef.current = newState
    onStateChange?.(newState)
  }, [onStateChange])

  // Clear silence timeout only
  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
  }, [])

  // Clear session timeout only  
  const clearSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
      sessionTimeoutRef.current = null
    }
    if (sessionWarningTimeoutRef.current) {
      clearTimeout(sessionWarningTimeoutRef.current)
      sessionWarningTimeoutRef.current = null
    }
  }, [])

  // Clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    clearSilenceTimeout()
    clearSessionTimeout()
  }, [clearSilenceTimeout, clearSessionTimeout])

  // Auto-stop due to silence
  const handleSilenceTimeout = useCallback(() => {
    console.log('Auto-stopping due to silence timeout')
    setAutoStopReason('silence')
    shouldStopRef.current = true
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log('Error stopping recognition on silence timeout:', e)
      }
    }
    updateState('auto-paused')
    // For silence timeout, duration is the configured silence timeout duration
    const silenceDuration = Math.round(silenceTimeoutMs / 1000)
    onAutoStop?.('silence', silenceDuration)
  }, [onAutoStop, updateState, silenceTimeoutMs])

  // Auto-stop due to session limit
  const handleSessionTimeout = useCallback(() => {
    console.log('Auto-stopping due to session limit')
    setAutoStopReason('session-limit')
    shouldStopRef.current = true
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log('Error stopping recognition on session timeout:', e)
      }
    }
    updateState('session-ended')
    const duration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0
    onAutoStop?.('session-limit', duration)
  }, [onAutoStop, updateState, sessionStartTime])

  // Start silence timeout
  const startSilenceTimeout = useCallback(() => {
    clearSilenceTimeout()
    silenceTimeoutRef.current = window.setTimeout(handleSilenceTimeout, silenceTimeoutMs)
  }, [clearSilenceTimeout, handleSilenceTimeout, silenceTimeoutMs])

  // Reset silence timeout on speech
  const resetSilenceTimeout = useCallback(() => {
    lastSpeechAtRef.current = Date.now()
    startSilenceTimeout()
  }, [startSilenceTimeout])

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

  // Check if speech recognition is available - run only once on mount
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
      const errorObj: SpeechRecognitionError = {
        code: 'not-supported',
        message: 'Speech recognition requires HTTPS or a modern browser',
        retryable: false
      }
      setError(errorObj)
      updateState('error')
      onError?.(errorObj)
      return
    }

    // Only check API presence and secure context - no permission tests on mount
    console.log('Speech recognition API available')
    setIsSupported(true)
    // Only set to ready on initial mount, don't override other states
    if (state === 'idle') {
      updateState('ready')
    }
    initializeRecognition()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependencies - only run once on mount

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
      setAutoStopReason(null)
      sessionWarningShownRef.current = false
      
      // Start session timing
      if (!sessionStartTime) {
        setSessionStartTime(Date.now())
      }
      
      // Calculate remaining session time
      const currentTime = Date.now()
      const sessionElapsed = sessionStartTime ? currentTime - sessionStartTime : 0
      const remainingSessionTime = Math.max(0, maxSessionMs - sessionElapsed)
      
      // Clear existing session timers
      clearSessionTimeout()
      
      // If session already exceeded, stop immediately
      if (remainingSessionTime <= 0) {
        setTimeout(() => handleSessionTimeout(), 0)
        return
      }
      
      // Schedule session timeout for remaining time
      sessionTimeoutRef.current = window.setTimeout(handleSessionTimeout, remainingSessionTime)
      
      // Schedule session warning at 15 seconds before limit (if not already shown)
      const warningTime = Math.max(0, remainingSessionTime - 15000)
      if (!sessionWarningShownRef.current && warningTime > 0 && onSessionWarning) {
        sessionWarningTimeoutRef.current = window.setTimeout(() => {
          if (stateRef.current === 'listening' && !sessionWarningShownRef.current) {
            sessionWarningShownRef.current = true
            onSessionWarning(15)
          }
        }, warningTime)
      }
      
      // Start silence timeout
      startSilenceTimeout()
      
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
          
          // Call result callback with ONLY the new final transcript
          onResult?.({
            transcript: transcript.trim(),
            isFinal: true,
            confidence: confidence * 100
          })
        } else {
          interim += transcript
        }
      }

      // Reset silence timeout on any speech activity
      if (finalTranscript || interim) {
        resetSilenceTimeout()
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
      console.log('Speech recognition error:', event.error, 'Current state:', stateRef.current, 'shouldStop:', shouldStopRef.current)
      isStartingRef.current = false

      switch (event.error) {
        case 'not-allowed':
          setErrorState('permission-denied', 'Microphone permission denied. Click the microphone icon in your browser address bar to allow access.')
          break
        case 'no-speech':
          // Don't treat no-speech as an error - it's normal and expected
          console.log('No speech detected (normal browser behavior)')
          return // Don't update state or show error for no-speech
        case 'audio-capture':
          setErrorState('no-microphone', 'No microphone detected. Please connect a microphone and try again.')
          break
        case 'network':
          setErrorState('network-error', 'Network error occurred. Check your internet connection.', true)
          break
        case 'aborted':
          // Don't treat aborted as an error - user likely stopped manually
          console.log('Speech recognition aborted')
          // Preserve auto-stop states (auto-paused/session-ended)
          if (stateRef.current === 'auto-paused' || stateRef.current === 'session-ended') {
            console.log('Preserving auto-stop state:', stateRef.current)
            return
          }
          updateState('ready')
          return
        case 'language-not-supported':
          setErrorState('language-error', `Language ${language} is not supported.`)
          break
        default:
          console.log('Speech recognition error (ignored):', event.error)
          updateState('ready')
          return
      }
    }

    recognition.onend = () => {
      console.log('Speech recognition ended, current state:', state, 'shouldStop:', shouldStopRef.current)
      isStartingRef.current = false
      setInterimTranscript('')
      clearSilenceTimeout()
      
      // Don't auto-restart if manually stopped or auto-stopped
      if (shouldStopRef.current || stateRef.current === 'auto-paused' || stateRef.current === 'session-ended') {
        console.log('Recognition ended - manual stop or auto-stop')
        // State already set by auto-stop handlers
        return
      }
      
      // If continuous mode and still listening, restart recognition
      if (continuous && stateRef.current === 'listening') {
        console.log('Auto-restarting speech recognition for continuous mode')
        setTimeout(() => {
          try {
            if (recognitionRef.current && !shouldStopRef.current && stateRef.current === 'listening') {
              isStartingRef.current = true
              recognitionRef.current.start()
            }
          } catch (e) {
            console.log('Error restarting recognition:', e)
            updateState('ready')
          }
        }, 100) // Small delay to prevent rapid restart issues
      } else {
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
      
      // Set flag to indicate this is a user-initiated start
      shouldStopRef.current = false
      
      // Check if recognition is already running and stop it first
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore stop errors
      }
      
      // Small delay to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Start recognition directly - let it handle permission requests
      isStartingRef.current = true
      recognitionRef.current.start()
      
    } catch (startError) {
      console.error('Speech recognition start error:', startError)
      isStartingRef.current = false
      setErrorState('start-failed', 'Failed to start voice input. Please check microphone permissions.')
      updateState('ready')
    }
  }, [isSupported, state, setErrorState, updateState])

  // Stop listening
  const stopListening = useCallback(() => {
    // Set flag to indicate this is a manual stop
    shouldStopRef.current = true
    setAutoStopReason(null)
    
    // Clear all timeouts
    clearAllTimeouts()
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
    setSessionStartTime(null)
    updateState('ready')
  }, [updateState, clearAllTimeouts])

  // Resume listening (for auto-paused state)
  const resumeListening = useCallback(async (): Promise<void> => {
    if (state === 'auto-paused') {
      // Reset auto-stop reason and restart (keep existing session)
      setAutoStopReason(null)
      shouldStopRef.current = false
      await startListening()
    } else if (state === 'session-ended') {
      // Start completely new session
      setAutoStopReason(null)
      shouldStopRef.current = false
      setSessionStartTime(null) // Reset for new session
      sessionWarningShownRef.current = false // Reset warning
      await startListening()
    } else {
      // Just call startListening normally
      await startListening()
    }
  }, [state, startListening])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setConfidence(null)
  }, [])

  // Auto-stop on tab hide for privacy
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isListening) {
        console.log('Tab hidden, stopping voice input for privacy')
        stopListening()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isListening, stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts()
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
  }, [clearAllTimeouts])

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
    resumeListening,
    resetTranscript,
    retryCount,
    sessionDuration,
    autoStopReason
  }
}