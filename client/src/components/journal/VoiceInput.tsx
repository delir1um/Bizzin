import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Volume2, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useToast } from '@/hooks/use-toast'

interface VoiceInputProps {
  onTranscript: (transcript: string, isFinal: boolean) => void
  isDisabled?: boolean
  language?: string
  className?: string
  compact?: boolean
}

export function VoiceInput({ onTranscript, isDisabled = false, language = 'en-US', className = '', compact = false }: VoiceInputProps) {
  const { toast } = useToast()
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [showPermissionHelper, setShowPermissionHelper] = useState(false)

  const {
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
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    language,
    onResult: (result) => {
      onTranscript(result.transcript, result.isFinal)
    },
    onError: (error) => {
      if (error.code === 'permission-denied') {
        toast({
          title: "🎤 Microphone Permission Needed",
          description: "Please click the microphone icon in your browser's address bar and allow access to use voice input.",
          variant: "destructive",
          duration: 6000
        })
        setShowPermissionHelper(true)
      } else if (error.code === 'no-speech') {
        toast({
          title: "No speech detected",
          description: "Try speaking closer to your microphone and click the mic again.",
          className: "border-yellow-200 bg-yellow-50 text-yellow-800"
        })
      } else if (error.code === 'no-microphone') {
        toast({
          title: "No microphone found",
          description: "Please connect a microphone to use voice input.",
          variant: "destructive"
        })
      }
    },
    onStateChange: (newState) => {
      if (newState === 'listening') {
        setSessionStartTime(Date.now())
        toast({
          title: "🎤 Recording started",
          description: "Speak now - your words will appear in the text area",
          className: "border-green-200 bg-green-50 text-green-800"
        })
      } else if (newState === 'ready' && sessionStartTime) {
        const duration = Math.round((Date.now() - sessionStartTime) / 1000)
        setSessionStartTime(null)
        if (duration > 1) {
          toast({
            title: "⏹️ Recording stopped",
            description: `Recorded for ${duration} seconds`,
            className: "border-gray-200 bg-gray-50 text-gray-800"
          })
        }
      }
    }
  })

  // Calculate session duration
  const sessionDuration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0

  // Handle mic toggle
  const handleMicToggle = async () => {
    if (isListening) {
      stopListening()
    } else {
      await startListening()
    }
  }

  // Handle retry for recoverable errors
  const handleRetry = async () => {
    resetTranscript()
    await startListening()
  }


  // Get state-specific styling and content for full mode
  const getStateInfo = () => {
    switch (state) {
      case 'requesting-permission':
        return {
          color: 'bg-yellow-500 hover:bg-yellow-600 text-white',
          icon: Volume2,
          label: 'Requesting permission...',
          pulse: true
        }
      case 'listening':
        return {
          color: 'bg-red-500 hover:bg-red-600 text-white',
          icon: Mic,
          label: `Recording... ${sessionDuration}s`,
          pulse: true
        }
      case 'processing':
        return {
          color: 'bg-blue-500 hover:bg-blue-600 text-white',
          icon: Mic,
          label: 'Processing...',
          pulse: true
        }
      case 'error':
        return {
          color: 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300',
          icon: AlertCircle,
          label: 'Error',
          pulse: false
        }
      default:
        return {
          color: 'bg-white hover:bg-orange-50 text-orange-600 border-orange-200',
          icon: Mic,
          label: 'Start recording',
          pulse: false
        }
    }
  }

  const stateInfo = getStateInfo()
  const StateIcon = stateInfo.icon

  if (!isSupported) {
    if (compact) {
      return null // Don't show anything in compact mode if not supported
    }
    return (
      <div className={`text-center p-4 border rounded-lg bg-gray-50 ${className}`}>
        <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-2">Voice input not available</p>
        <p className="text-xs text-gray-500">
          {error?.code === 'not-supported' 
            ? 'Your browser doesn\'t support voice input. Try Chrome or Edge.'
            : 'Voice input requires HTTPS. Please use your keyboard mic button on mobile.'
          }
        </p>
      </div>
    )
  }

  // Compact mode - clean microphone button in bottom-right corner
  if (compact) {
    return (
      <div className={`${className} flex flex-col items-end`}>
        {/* Permission Helper */}
        {showPermissionHelper && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 max-w-48"
          >
            Click the microphone icon in your browser's address bar to allow access
          </motion.div>
        )}
        
        <Button
          type="button"
          onClick={handleMicToggle}
          disabled={isDisabled}
          className={`
            w-10 h-10 p-0 rounded-full transition-all duration-200 border-2 relative overflow-hidden
            ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-400 shadow-lg animate-pulse'
                : 'bg-gray-400 hover:bg-gray-500 text-white border-gray-300 shadow-md hover:shadow-lg'
            }
          `}
          style={{ zIndex: 1000 }}
          title={isListening ? 'Click to stop recording' : 'Click to start voice input'}
          data-testid="button-mic-compact"
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
          
          {/* Animated recording ring */}
          {isListening && (
            <div className="absolute -inset-1 border-2 border-red-300 rounded-full animate-ping opacity-75"></div>
          )}
        </Button>
        
        {/* Live transcript overlay */}
        <AnimatePresence>
          {interimTranscript && isListening && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-12 right-0 max-w-xs bg-white border border-gray-200 rounded-lg p-2 shadow-lg"
              style={{ zIndex: 1001 }}
              data-testid="overlay-interim"
            >
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0 mt-1.5"></div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  "{interimTranscript}"
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Full mode - existing implementation
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Voice Control */}
      <div className="flex items-center gap-3">
        {/* Primary Mic Button */}
        <div className="relative">
          <Button
            type="button"
            onClick={handleMicToggle}
            disabled={isDisabled || state === 'requesting-permission' || state === 'processing'}
            className={`
              w-12 h-12 p-0 rounded-full transition-all duration-300 relative overflow-hidden
              ${stateInfo.color}
              ${stateInfo.pulse ? 'animate-pulse' : ''}
              ${isListening ? 'shadow-lg shadow-red-300 dark:shadow-red-900/30' : ''}
            `}
            aria-pressed={isListening}
            aria-label={isListening ? 'Stop recording' : 'Start voice recording'}
            title={stateInfo.label}
            data-testid="button-mic-toggle"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={state}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center"
              >
                {isListening ? (
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing background */}
                    <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-1 bg-red-300 rounded-full animate-pulse"></div>
                    {/* Recording indicator */}
                    <div className="relative w-3 h-3 bg-white rounded-full z-10"></div>
                  </div>
                ) : (
                  <StateIcon className="w-5 h-5" />
                )}
              </motion.div>
            </AnimatePresence>
          </Button>

          {/* Confidence indicator */}
          {confidence && confidence > 80 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Status Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`
                text-xs whitespace-nowrap
                ${state === 'listening' ? 'border-red-200 bg-red-50 text-red-700' :
                  state === 'error' ? 'border-red-300 bg-red-100 text-red-700' :
                  state === 'requesting-permission' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                  'border-gray-200 bg-gray-50 text-gray-600'}
              `}
              aria-live="polite"
              role="status"
              data-testid="status-voice"
            >
              {stateInfo.label}
            </Badge>
            
            {retryCount > 0 && (
              <Badge variant="outline" className="text-xs border-orange-200 bg-orange-50 text-orange-700">
                Retry {retryCount}
              </Badge>
            )}
          </div>

          {/* Error with retry button */}
          {error && error.retryable && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-red-600 flex-1 min-w-0 truncate">{error.message}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                className="h-6 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                data-testid="button-retry-voice"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </div>
          )}

          {/* Non-retryable error */}
          {error && !error.retryable && (
            <p 
              className="text-xs text-red-600 mt-1" 
              role="alert"
            >
              {error.message}
            </p>
          )}
        </div>
      </div>

      {/* Live Interim Transcript */}
      <AnimatePresence>
        {interimTranscript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-3"
            aria-live="polite"
            role="status"
            data-testid="text-interim"
          >
            <div className="flex items-start gap-2">
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-600 font-medium">Listening</span>
              </div>
              <p className="text-sm text-blue-800 italic leading-relaxed">
                "{interimTranscript}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission Helper Modal */}
      <AnimatePresence>
        {showPermissionHelper && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800 mb-1">
                  Microphone Permission Needed
                </h4>
                <p className="text-sm text-yellow-700 mb-3">
                  To use voice input, click the microphone icon in your browser's address bar and allow access.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPermissionHelper(false)}
                    className="h-8 px-3 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    data-testid="button-permission-got-it"
                  >
                    Got it
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRetry}
                    className="h-8 px-3 text-xs bg-yellow-600 hover:bg-yellow-700 text-white"
                    data-testid="button-permission-retry"
                  >
                    Try again
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Input Instructions */}
      {!isListening && !error && state === 'ready' && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Tap the microphone to start voice input
          </p>
        </div>
      )}
    </div>
  )
}