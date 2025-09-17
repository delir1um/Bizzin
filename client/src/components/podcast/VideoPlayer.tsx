import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { convertToProxyUrl } from '@/lib/videoUtils'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  X,
  Maximize2,
  Minimize2,
  Settings
} from 'lucide-react'

interface VideoPlayerProps {
  videoUrl: string
  thumbnailUrl?: string
  title: string
  onTimeUpdate: (currentTime: number) => void
  onDurationUpdate?: (duration: number) => void
  onEnded: () => void
  startTime?: number
  maxProgressReached?: number // Maximum progress reached (for learning system)
  className?: string
  isCompleted?: boolean // Whether episode is completed (allows free navigation)
  autoPlay?: boolean // Whether to auto-start playback
}

export function VideoPlayer({ 
  videoUrl, 
  thumbnailUrl, 
  title, 
  onTimeUpdate, 
  onDurationUpdate,
  onEnded, 
  startTime = 0,
  maxProgressReached = 0,
  className = "",
  isCompleted = false,
  autoPlay = false
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentTime, setCurrentTime] = useState(startTime)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [bufferingProgress, setBufferingProgress] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const allowedForwardRef = useRef(0)
  
  // Convert URL once and memoize it
  const proxyVideoUrl = convertToProxyUrl(videoUrl)
  
  // Initialize monotonic allowed forward position
  useEffect(() => {
    allowedForwardRef.current = Math.max(allowedForwardRef.current, maxProgressReached, startTime)
  }, [maxProgressReached, startTime])

  // Initialize video with minimal event handling
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Simple initialization
    setHasError(false)
    // Don't reset isPlaying if autoPlay is enabled
    if (!autoPlay) {
      setIsPlaying(false)
    }
    
    const handleLoadedMetadata = () => {
      if (video.duration && video.duration > 0) {
        setDuration(video.duration)
        
        // Notify parent of duration
        if (onDurationUpdate) {
          onDurationUpdate(video.duration)
        }
        
        // Set start time if provided
        if (startTime > 0) {
          video.currentTime = startTime
          setCurrentTime(startTime)
        }
        
        // Auto-start playback if enabled
        if (autoPlay) {
          video.play().catch((error) => {
            console.error('Auto-play failed:', error)
            setIsPlaying(false)
          })
        }
      }
    }

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        const videoTime = video.currentTime
        setCurrentTime(videoTime)
        onTimeUpdate(videoTime)
        
        // Update monotonic allowed forward position
        allowedForwardRef.current = Math.max(allowedForwardRef.current, videoTime)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      onEnded()
    }

    const handleError = () => {
      setHasError(true)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      setIsBuffering(false)
    }
    
    const handlePause = () => setIsPlaying(false)
    
    const handleWaiting = () => {
      console.log('Video waiting for data...')
      setIsBuffering(true)
    }
    
    const handleStalled = () => {
      console.log('Video stalled - network issue')
      setIsBuffering(true)
    }
    
    const handleCanPlay = () => {
      console.log('Video can start playing')
      setIsBuffering(false)
    }
    
    const handleCanPlayThrough = () => {
      console.log('Video can play through without buffering')
      setIsBuffering(false)
    }
    
    const handleSeeking = () => {
      console.log('Video seeking')
      setIsBuffering(true)
    }
    
    const handleSeeked = () => {
      console.log('Video seek completed')
      setIsBuffering(false)
    }

    // Add comprehensive event listeners for better buffering feedback
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('stalled', handleStalled)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('canplaythrough', handleCanPlayThrough)
    video.addEventListener('seeking', handleSeeking)
    video.addEventListener('seeked', handleSeeked)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('stalled', handleStalled)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('canplaythrough', handleCanPlayThrough)
      video.removeEventListener('seeking', handleSeeking)
      video.removeEventListener('seeked', handleSeeked)
    }
  }, [proxyVideoUrl])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video || hasError || duration === 0) return

    // Simple toggle without promise complications
    if (isPlaying) {
      video.pause()
    } else {
      video.play().catch((error) => {
        console.error('Video play failed:', error)
        setHasError(true)
      })
    }
  }

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video || duration <= 0 || isSeeking) return

    const newTime = value[0]
    // If episode is completed, allow seeking anywhere
    // Otherwise, allow seeking up to the maximum progress reached (for review)
    // Use monotonic tracking to prevent rewind issues
    if (isCompleted || newTime <= allowedForwardRef.current + 2) {
      setIsSeeking(true)
      
      // Pause video during seeking to prevent conflicts
      const wasPlaying = isPlaying
      if (wasPlaying) {
        video.pause()
      }
      
      video.currentTime = newTime
      setCurrentTime(newTime)
      
      // Clear buffering state when seeking
      setIsBuffering(false)
      
      // Resume playback after a short delay if it was playing
      setTimeout(() => {
        setIsSeeking(false)
        if (wasPlaying) {
          video.play().catch(console.error)
        }
      }, 100)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = value[0]
    video.volume = newVolume / 100
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume / 100
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const changePlaybackSpeed = () => {
    const video = videoRef.current
    if (!video) return

    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    const currentIndex = speeds.indexOf(playbackSpeed)
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
    
    video.playbackRate = nextSpeed
    setPlaybackSpeed(nextSpeed)
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return

    // Only allow skipping backwards (negative seconds)
    if (seconds < 0) {
      const newTime = Math.max(0, currentTime + seconds)
      video.currentTime = newTime
      setCurrentTime(newTime)
    }
    // Skip forward is disabled for learning progression
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle mouse interactions for control visibility
  const handleMouseEnter = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
  }

  const handleMouseLeave = () => {
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 2000)
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        src={proxyVideoUrl}
        poster={thumbnailUrl}
        className="w-full h-full"
        onClick={togglePlay}
        crossOrigin="anonymous"
        preload="auto"
        playsInline
        muted={false}
        controls={false}
        style={{ backgroundColor: '#000' }}
      />
      
      {/* No loading overlay - video shows immediately */}
      
      {/* Buffering State - Show minimal indicator during playback buffering */}
      {isBuffering && duration > 0 && !hasError && (
        <div className="absolute top-4 right-4">
          <div className="bg-black/60 rounded-lg px-3 py-2 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white text-xs">Buffering...</span>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center space-y-4 text-center p-6">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <div className="space-y-2">
              <p className="text-white font-medium">Video unavailable</p>
              <p className="text-gray-300 text-sm">The video content is currently not accessible</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Video Controls Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <h3 className="text-white font-semibold truncate">{title}</h3>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>

        {/* Center Play Button */}
        {/* Center play button removed - using only bottom controls */}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="relative">
              <Slider
                value={[duration > 0 ? currentTime : 0]}
                max={duration > 0 ? duration : 100}
                step={1}
                onValueChange={handleSeek}
                className={`w-full ${duration === 0 ? 'opacity-30 pointer-events-none' : ''}`}
                disabled={duration === 0}
              />
              {/* Visual indicator for completed progress */}
              <div 
                className={`absolute top-0 left-0 h-2 rounded-full -z-10 ${
                  duration === 0 ? 'bg-gray-400/20' : 'bg-orange-200/30'
                }`}
                style={{ width: duration === 0 ? '0%' : `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <div className={`flex justify-between text-xs ${duration === 0 ? 'text-white/40' : 'text-white/80'}`}>
              <span>{duration === 0 ? '--:--' : formatTime(currentTime)}</span>
              <span>{duration === 0 ? '--:--' : formatTime(duration)}</span>
            </div>
            <p className="text-xs text-white/60 text-center">
              {isCompleted 
                ? "Episode completed! You can navigate freely through the content" 
                : "You can review any content you've already watched, but can't skip ahead"
              }
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => skip(-10)}
                title="Replay last 10 seconds"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              {/* Skip forward disabled for learning progression */}
              <div className="opacity-30">
                <SkipForward className="w-4 h-4 text-white/40" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={changePlaybackSpeed}
              >
                <Settings className="w-4 h-4" />
                <span className="ml-1 text-xs">{playbackSpeed}x</span>
              </Button>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                
                <div className="w-20">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}