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
  isCompleted = false
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(startTime)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isBuffering, setIsBuffering] = useState(false)
  const [bufferingProgress, setBufferingProgress] = useState(0)
  const [canPlayThrough, setCanPlayThrough] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Convert URL once and memoize it
  const proxyVideoUrl = convertToProxyUrl(videoUrl)

  // Initialize video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Reset states on video source change
    setIsLoading(true)
    setCanPlayThrough(false)
    setIsBuffering(false)
    setHasError(false)
    setCurrentTime(startTime)
    setDuration(0)
    setIsPlaying(false)
    setIsVideoReady(false)
    setIsSeeking(false)

    // Optimize video loading for better streaming
    video.setAttribute('preload', 'auto')
    video.setAttribute('buffered', 'true')
    
    const handleLoadStart = () => {
      setIsLoading(true)
      setHasError(false)
      setCanPlayThrough(false)
      setIsBuffering(false)
    }
    
    const handleLoadedData = () => {
      // This fires when enough data is loaded to start playback
      console.log('Video data loaded - ready for playback')
      // Don't immediately hide loading - wait for canplay event
    }

    const handleLoadedMetadata = () => {
      const videoDuration = video.duration
      setDuration(videoDuration)
      console.log('Video duration updated:', videoDuration, 'Episode duration:', Math.floor(videoDuration))
      
      // Video metadata is loaded - we can hide loading now and make it ready
      setIsLoading(false)
      setIsVideoReady(true)
      
      // Notify parent component of actual duration
      if (onDurationUpdate) {
        onDurationUpdate(videoDuration)
      }
      
      // Set initial time - prevent jumping by ensuring currentTime is set properly
      const initialTime = Math.max(0, startTime)
      if (initialTime > 0 && initialTime < videoDuration) {
        video.currentTime = initialTime
        setCurrentTime(initialTime)
      } else {
        setCurrentTime(0)
      }
    }
    
    const handleCanPlayThrough = () => {
      // Video has buffered enough to play without interruption
      console.log('Video can play through without buffering')
      setCanPlayThrough(true)
      setIsLoading(false)
      setIsBuffering(false)
      // Don't auto-play immediately, let user control playback
      // Auto-play is handled by the parent component
    }

    const handleTimeUpdate = () => {
      // Don't update time during seeking to prevent conflicts
      if (isSeeking) return
      
      const time = video.currentTime
      
      // Only update if time has changed significantly (prevent rapid updates)
      if (Math.abs(time - currentTime) > 0.2) {
        setCurrentTime(time)
        // Update parent with current time
        onTimeUpdate(time)
      }
      
      // Also update duration if it changed (important for video files)
      if (video.duration && video.duration !== duration && video.duration > 0) {
        setDuration(video.duration)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      onEnded()
    }

    const handleError = () => {
      console.error('Video loading failed for:', proxyVideoUrl)
      setHasError(true)
      setIsLoading(false)
    }

    const handleCanPlay = () => {
      // Video can start playing - ensure loading is hidden
      if (duration > 0) {
        setIsLoading(false)
        setIsBuffering(false)
      }
      setHasError(false)
      setCanPlayThrough(true)
      console.log('Video ready to play')
    }
    
    const handleProgress = () => {
      if (video.buffered.length > 0 && duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const bufferPercent = (bufferedEnd / duration) * 100
        
        // Only update if buffer progress changed significantly
        if (Math.abs(bufferPercent - bufferingProgress) > 5) {
          setBufferingProgress(bufferPercent)
          console.log(`Video buffered: ${Math.round(bufferPercent)}%`)
        }
      }
    }
    
    const handleWaiting = () => {
      // Only log buffering if we're actually playing
      if (isPlaying) {
        console.log('Video buffering during playback')
        setIsBuffering(true)
      }
    }
    
    const handlePlaying = () => {
      setIsLoading(false)
      setIsBuffering(false)
      console.log('Video playing smoothly')
    }

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('canplaythrough', handleCanPlayThrough)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)
    
    // Add play/pause event listeners to sync state
    const handlePlayEvent = () => {
      setIsPlaying(true)
      setIsLoading(false)
      setIsBuffering(false)
    }
    const handlePauseEvent = () => {
      setIsPlaying(false)
      setIsBuffering(false)
    }
    video.addEventListener('play', handlePlayEvent)
    video.addEventListener('pause', handlePauseEvent)
    
    // Preload the video immediately
    video.load()

    return () => {
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('canplaythrough', handleCanPlayThrough)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('play', handlePlayEvent)
      video.removeEventListener('pause', handlePauseEvent)
    }
  }, [startTime, onTimeUpdate, onEnded, proxyVideoUrl])

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
    if (isCompleted || newTime <= Math.max(maxProgressReached, currentTime)) {
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
      
      {/* Loading State - Only show when video duration is not available */}
      {duration <= 0 && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-sm font-medium">Loading video...</p>
          </div>
        </div>
      )}
      
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