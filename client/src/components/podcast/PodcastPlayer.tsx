import React, { useState, useRef, useEffect } from 'react'
import { useUpdateProgress, useEpisodeProgress } from '@/hooks/usePodcastProgress'
import { PodcastService, PodcastEpisode } from '@/lib/podcastService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { VideoPlayer } from './VideoPlayer'
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
  Video,
  Headphones,
  RotateCcw
} from 'lucide-react'

interface PodcastPlayerProps {
  episode: PodcastEpisode
  onClose: () => void
  autoPlay?: boolean
  startTime?: number // Continue from specific time
  preferVideo?: boolean // Whether to prefer video over audio if both available
}

export function PodcastPlayer({ episode, onClose, autoPlay = false, startTime = 0, preferVideo = true }: PodcastPlayerProps) {
  // Get existing progress to set max progress reached correctly
  const { data: existingProgress } = useEpisodeProgress(episode.id)
  
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentTime, setCurrentTime] = useState(startTime)
  const [actualDuration, setActualDuration] = useState(episode.duration) // Track actual media duration
  const [maxProgressReached, setMaxProgressReached] = useState(startTime) // Track highest progress point
  
  // Update max progress when existing progress loads
  useEffect(() => {
    if (existingProgress?.progress_seconds) {
      setMaxProgressReached(Math.max(startTime, existingProgress.progress_seconds))
    }
  }, [existingProgress, startTime])
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [currentMediaType, setCurrentMediaType] = useState<'audio' | 'video'>(
    preferVideo ? 'video' : 'audio'
  )
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  
  // Check what media types are available
  const hasAudio = Boolean(episode.audio_url)
  const hasVideo = Boolean(episode.has_video && episode.video_url)
  const hasBothFormats = hasAudio && hasVideo
  
  // Determine which format to use
  const isVideoEpisode = hasBothFormats 
    ? currentMediaType === 'video' 
    : Boolean(episode.has_video && episode.video_url)
    
  // Media type logic configured
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const updateProgress = useUpdateProgress()
  const lastSaveTime = useRef(startTime)

  // Save progress every 15 seconds and on pause/close to reduce API calls
  const saveProgress = (time: number) => {
    if (Math.abs(time - lastSaveTime.current) >= 15 || time >= actualDuration) {
      // Don't save if mutation is already pending to prevent spam
      if (updateProgress.isPending) return
      
      // Only save if we have meaningful progress (more than 3 seconds)
      if (time >= 3) {
        const mediaType = isVideoEpisode ? 'video' : 'audio';
        console.log('💾 [DATABASE SAVE] Attempting to save progress:', {
          episodeId: episode.id,
          progressSeconds: Math.floor(time),
          episodeDuration: Math.floor(actualDuration),
          mediaType,
          currentMediaType,
          isVideoEpisode,
          lastSaveTime: lastSaveTime.current,
          timeDifference: time - lastSaveTime.current
        });
        
        updateProgress.mutate({
          episodeId: episode.id,
          progressSeconds: Math.floor(time),
          episodeDuration: Math.floor(actualDuration), // Use actual media duration
          mediaType
        }, {
          onSuccess: (data) => {
            console.log('✅ [DATABASE SAVE] Progress saved successfully:', data);
          },
          onError: (error) => {
            console.error('❌ [DATABASE SAVE] Failed to save progress:', error);
          }
        })
        lastSaveTime.current = time
      }
    }
  }

  // Define event handlers outside useEffect to avoid scope issues
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const newTime = audioRef.current.currentTime
      setCurrentTime(newTime)
      
      // Track maximum progress reached
      if (newTime > maxProgressReached) {
        setMaxProgressReached(newTime)
      }
      
      // Auto-save progress every 10 seconds
      saveProgress(newTime)
    }
  }
  
  const handleEnded = () => {
    setIsPlaying(false)
    setMaxProgressReached(actualDuration)
    saveProgress(actualDuration)
  }

  // Handle audio playback for audio episodes
  useEffect(() => {
    if (!isVideoEpisode) {
      // Prefer dedicated audio URL for instant playback, fallback to video URL
      const originalAudioSource = episode.audio_url || episode.video_url
      
      // Setup audio with intelligent fallback routing
      const setupAudioElement = async () => {
        let audioSource = originalAudioSource
        
        // Route all R2 files through proxy with intelligent fallback
        if (audioSource && (audioSource.includes('.r2.dev') || audioSource.includes('.r2.cloudflarestorage.com'))) {
          const { createFallbackAudioSource } = await import('@/lib/videoUtils')
          audioSource = await createFallbackAudioSource(audioSource)
          console.log('🎵 Final audio source determined:', audioSource)
        }
        
        // Only proceed if we have a valid audio source
        if (audioSource && audioSource.trim() !== '') {
          // Create audio element if it doesn't exist
          if (!audioRef.current) {
            audioRef.current = new Audio()
            audioRef.current.preload = 'auto'
            audioRef.current.crossOrigin = 'anonymous'
            
            // Enable faster loading and buffering
            audioRef.current.setAttribute('webkit-playsinline', 'true')
            audioRef.current.setAttribute('playsinline', 'true')
            
            // Set up audio event listeners
            audioRef.current.addEventListener('loadstart', () => {
              setIsAudioLoading(true)
            })
            
            audioRef.current.addEventListener('canplay', () => {
              setIsAudioLoading(false)
            })
            
            audioRef.current.addEventListener('loadedmetadata', () => {
              if (audioRef.current) {
                setActualDuration(audioRef.current.duration)
                console.log('Audio metadata loaded, duration:', audioRef.current.duration)
              }
            })
            
            audioRef.current.addEventListener('loadeddata', () => {
              setIsAudioLoading(false)
              console.log('Audio data loaded - ready for playback')
            })
            
            audioRef.current.addEventListener('canplaythrough', () => {
              console.log('Audio can play through without buffering')
            })
            
            audioRef.current.addEventListener('progress', () => {
              if (audioRef.current) {
                const buffered = audioRef.current.buffered
                if (buffered.length > 0) {
                  const bufferedEnd = buffered.end(buffered.length - 1)
                  console.log('Audio buffered:', Math.round(bufferedEnd), 'seconds')
                }
              }
            })
            
            audioRef.current.addEventListener('error', (e) => {
              console.error('Audio loading error:', e, 'Source:', audioSource)
              // Try to provide more specific error information
              if (audioRef.current) {
                console.error('Audio error details:', {
                  networkState: audioRef.current.networkState,
                  readyState: audioRef.current.readyState,
                  error: audioRef.current.error
                })
              }
            })
            
            // Remove any existing listeners before adding new ones
            audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
            audioRef.current.removeEventListener('ended', handleEnded)
            
            // Add fresh event listeners
            audioRef.current.addEventListener('timeupdate', handleTimeUpdate)
            audioRef.current.addEventListener('ended', handleEnded)
          }
          
          // Set the source - ensure it's a full URL for audio element
          const fullAudioSource = audioSource.startsWith('/') ? `${window.location.origin}${audioSource}` : audioSource
          if (audioRef.current.src !== fullAudioSource) {
            console.log('Setting final audio source:', fullAudioSource)
            audioRef.current.src = fullAudioSource
            
            // Force immediate loading for faster start
            audioRef.current.load()
            
            // Pre-buffer some content
            setTimeout(() => {
              if (audioRef.current && audioRef.current.readyState >= 2) {
                console.log('Audio ready for playback')
              }
            }, 100)
          }
          
          // Set audio properties after source is set
          if (audioRef.current) {
            // Only set position if this is the initial load or switching media types
            // Avoid resetting position during normal playback
            if (Math.abs(audioRef.current.currentTime - currentTime) > 1) {
              audioRef.current.currentTime = currentTime
            }
            audioRef.current.volume = (isMuted ? 0 : volume) / 100
            audioRef.current.playbackRate = playbackSpeed
          }
        }
      }
      
      // Execute async setup
      setupAudioElement().catch(console.error)
    }
    
    return () => {
      // Clean up event listeners and audio element when switching or unmounting
      if (audioRef.current) {
        // Remove all event listeners to prevent conflicts
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
        audioRef.current.removeEventListener('ended', handleEnded)
        audioRef.current.removeEventListener('loadstart', () => {})
        audioRef.current.removeEventListener('canplay', () => {})
        audioRef.current.removeEventListener('loadedmetadata', () => {})
        audioRef.current.removeEventListener('error', () => {})
        
        if (isVideoEpisode) {
          audioRef.current.pause()
          audioRef.current = null
        }
      }
    }
  }, [isVideoEpisode, episode.audio_url, episode.video_url])

  // Handle play/pause for audio
  useEffect(() => {
    if (!isVideoEpisode && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error)
      } else {
        audioRef.current.pause()
        saveProgress(currentTime)
      }
    }
  }, [isPlaying, isVideoEpisode])

  // Update audio properties when they change
  useEffect(() => {
    if (!isVideoEpisode && audioRef.current) {
      audioRef.current.volume = (isMuted ? 0 : volume) / 100
      audioRef.current.playbackRate = playbackSpeed
    }
  }, [volume, isMuted, playbackSpeed, isVideoEpisode])

  // Save progress when component unmounts (player closed)
  useEffect(() => {
    return () => {
      if (currentTime > 0) {
        console.log('🔚 [UNMOUNT SAVE] Saving progress on unmount:', {
          episodeId: episode.id,
          currentTime,
          actualDuration,
          isVideoEpisode,
          mediaType: isVideoEpisode ? 'video' : 'audio'
        });
        updateProgress.mutate({
          episodeId: episode.id,
          progressSeconds: Math.floor(currentTime),
          episodeDuration: Math.floor(actualDuration),
          mediaType: isVideoEpisode ? 'video' : 'audio'
        })
      }
    }
  }, [episode.id]) // Only depend on episode.id to avoid infinite loops

  // Handle close with progress save
  const handleClose = () => {
    // Stop and cleanup audio playback immediately
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    
    // Clear any running intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Stop video playback if playing
    setIsPlaying(false)
    
    // Save final progress before closing
    if (currentTime > 0) {
      console.log('🚪 [CLOSE SAVE] Saving progress on close:', {
        episodeId: episode.id,
        currentTime,
        actualDuration,
        isVideoEpisode,
        mediaType: isVideoEpisode ? 'video' : 'audio'
      });
      updateProgress.mutate({
        episodeId: episode.id,
        progressSeconds: Math.floor(currentTime),
        episodeDuration: Math.floor(actualDuration),
        mediaType: isVideoEpisode ? 'video' : 'audio'
      })
    }
    
    onClose()
  }


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  // Seeking capability - allow navigation up to maximum progress reached (learning system)
  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    // If episode is completed (95%+), allow seeking anywhere
    // Otherwise, allow seeking up to the maximum progress reached (for review)
    if (isCompleted || newTime <= maxProgressReached) {
      setCurrentTime(newTime)
      
      // Update audio element position for audio episodes
      if (!isVideoEpisode && audioRef.current) {
        audioRef.current.currentTime = newTime
      }
      
      saveProgress(newTime)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    setIsMuted(false)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  // Remove skip forward - users should not skip ahead in learning content
  const skipForward = () => {
    // Disabled to prevent skipping ahead
    return
  }

  const skipBackward = () => {
    const newTime = Math.max(currentTime - 15, 0)
    setCurrentTime(newTime)
    
    // Update audio element position for audio episodes
    if (!isVideoEpisode && audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const cyclePlaybackSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2]
    const currentIndex = speeds.indexOf(playbackSpeed)
    const nextIndex = (currentIndex + 1) % speeds.length
    setPlaybackSpeed(speeds[nextIndex])
  }

  const currentProgress = Math.min(PodcastService.getCompletionPercentage(currentTime, actualDuration), 100)
  const maxProgress = Math.min(PodcastService.getCompletionPercentage(maxProgressReached, actualDuration), 100)
  const isCompleted = PodcastService.isEpisodeCompleted(maxProgressReached, actualDuration)
  
  // Display progress should show the maximum reached, not current position for completed episodes
  const displayProgress = isCompleted ? Math.max(maxProgress, 95) : currentProgress

  // No longer needed - episodes are either audio or video, not both

  const handleVideoTimeUpdate = (time: number) => {
    // Only update time if this is a video episode to prevent conflicts with audio timer
    if (isVideoEpisode) {
      setCurrentTime(time)
      
      // Track maximum progress reached
      if (time > maxProgressReached) {
        setMaxProgressReached(time)
      }
      
      saveProgress(time)
    }
  }

  const handleVideoDurationUpdate = (duration: number) => {
    // Update actual duration when video loads its metadata
    console.log('Video duration updated:', duration, 'Episode duration:', episode.duration)
    setActualDuration(duration)
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
    saveProgress(actualDuration)
  }

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 ${isVideoEpisode ? 'flex items-center justify-center p-4' : 'flex items-end'}`}>
      <Card className={`${isVideoEpisode ? 'max-w-6xl mx-auto h-[90vh] w-full' : 'w-full h-auto'} ${isVideoEpisode ? 'bg-white dark:bg-slate-900' : 'bg-gradient-to-t from-black/90 via-black/70 to-black/50'} ${isVideoEpisode ? 'rounded-xl' : 'rounded-t-xl'} border-0 transition-all duration-300 overflow-hidden`}>
        <CardContent className={`${isVideoEpisode ? 'p-0 h-full flex flex-col' : 'p-6'}`}>
          {/* Header */}
          <div className={`flex items-center justify-between ${isVideoEpisode ? 'p-4 pb-2' : 'mb-4'}`}>
            <div className="flex items-center space-x-3">
              <Badge 
                variant="secondary" 
                className={episode.series_color}
              >
                {episode.series}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              {/* Media type controls - show toggle if both formats available */}
              {hasBothFormats ? (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-md p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log('🔍 [CLICK LOG] PodcastPlayer - Video toggle clicked:', {
                        episodeId: episode.id,
                        title: episode.title,
                        previousMediaType: currentMediaType,
                        newMediaType: 'video',
                        currentTime,
                        hasAudio,
                        hasVideo,
                        hasBothFormats
                      });
                      setCurrentMediaType('video')
                      // Pause audio when switching to video
                      if (audioRef.current) {
                        audioRef.current.pause()
                      }
                    }}
                    className={`px-2 py-1 text-xs rounded ${
                      currentMediaType === 'video' 
                        ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Video className="w-3 h-3 mr-1" />
                    Video
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log('🔍 [CLICK LOG] PodcastPlayer - Audio toggle clicked:', {
                        episodeId: episode.id,
                        title: episode.title,
                        previousMediaType: currentMediaType,
                        newMediaType: 'audio',
                        currentTime,
                        hasAudio,
                        hasVideo,
                        hasBothFormats
                      });
                      const wasPlaying = isPlaying
                      setCurrentMediaType('audio')
                      // Continue with the same progress when switching to audio
                      // Auto-start audio playback when user explicitly switches to audio mode
                      if (!wasPlaying) {
                        setIsPlaying(true) // Start audio automatically when user clicks audio toggle
                      }
                    }}
                    className={`px-2 py-1 text-xs rounded ${
                      currentMediaType === 'audio'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Headphones className="w-3 h-3 mr-1" />
                    Audio
                  </Button>
                </div>
              ) : (
                <div className="flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                  {isVideoEpisode ? (
                    <>
                      <Video className="w-4 h-4 mr-1 text-orange-600" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">Video</span>
                    </>
                  ) : (
                    <>
                      <Headphones className="w-4 h-4 mr-1 text-blue-600" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">Audio</span>
                    </>
                  )}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Episode Info - Enhanced header for audio */}
          {!isVideoEpisode && (
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">
                {episode.title}
              </h3>
              {episode.description && (
                <p className="text-sm text-white/80 leading-relaxed max-w-2xl mx-auto">
                  {episode.description}
                </p>
              )}
            </div>
          )}
          
          {/* Episode Info - Enhanced header for video */}
          {isVideoEpisode && (
            <div className="px-4 pb-3">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {episode.title}
              </h3>
              {episode.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {episode.description}
                </p>
              )}
            </div>
          )}

          {/* Video Player (for video episodes) */}
          {isVideoEpisode && (
            <div className="flex-1 flex flex-col">
              <VideoPlayer
                videoUrl={episode.video_url || ''}
                thumbnailUrl={episode.video_thumbnail}
                title={episode.title}
                onTimeUpdate={handleVideoTimeUpdate}
                onDurationUpdate={handleVideoDurationUpdate}
                onEnded={handleVideoEnded}
                startTime={startTime}
                maxProgressReached={maxProgressReached}
                className="flex-1 min-h-0"
                isCompleted={isCompleted}
                autoPlay={autoPlay && isVideoEpisode}
              />
              {/* Video Progress Display */}
              <div className="p-4 pt-2 flex justify-between items-center text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900">
                <span>{formatTime(currentTime)} / {formatTime(actualDuration)}</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-orange-600">{Math.round(displayProgress)}% Complete</span>
                  {isCompleted && (
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                      ✓ Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar - Only show for audio episodes */}
          {!isVideoEpisode && (
            <div className="space-y-2 mb-6">
              <div className="relative">
                <Slider
                  value={[currentTime]}
                  max={actualDuration}
                  step={1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
                {/* Visual indicator for completed progress */}
                <div 
                  className="absolute top-0 left-0 h-2 bg-orange-200/30 rounded-full -z-10"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/80">
                <span>{formatTime(currentTime)}</span>
                <span className="text-orange-400 font-medium">
                  {Math.round((currentTime / actualDuration) * 100)}%
                </span>
                <span>{formatTime(actualDuration)}</span>
              </div>
              <p className="text-xs text-white/60 text-center">
                {isCompleted 
                  ? "Episode completed! You can navigate freely through the content" 
                  : "You can only replay content you've already completed"
                }
              </p>
            </div>
          )}

          {/* Controls - Only show for audio episodes */}
          {!isVideoEpisode && (
            <div className="relative flex items-center justify-between mb-6">
              {/* Left side controls */}
              <div className="flex items-center space-x-2">
                {/* Replay last 10 seconds */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (audioRef.current) {
                      const newTime = Math.max(0, currentTime - 10)
                      audioRef.current.currentTime = newTime
                      setCurrentTime(newTime)
                    }
                  }}
                  className="text-white hover:bg-white/20"
                  title="Replay last 10 seconds"
                >
                  <div className="flex items-center space-x-1">
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-[10px] font-bold leading-none">10s</span>
                  </div>
                </Button>

                {/* Skip back 15 seconds */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipBackward}
                  className="text-white hover:bg-white/20"
                  title="Skip back 15 seconds"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Center play/pause button - absolutely centered */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Button
                  onClick={handlePlayPause}
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-full w-14 h-14 disabled:opacity-50"
                  disabled={isAudioLoading}
                  data-testid="button-play-pause-audio"
                >
                  {isAudioLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </Button>
              </div>
              
              {/* Right side controls */}
              <div className="flex items-center space-x-2">
                {/* Skip forward 15 seconds - learning-friendly */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (audioRef.current) {
                      const newTime = Math.min(maxProgressReached, currentTime + 15)
                      audioRef.current.currentTime = newTime
                      setCurrentTime(newTime)
                    }
                  }}
                  className="text-white hover:bg-white/20"
                  title="Skip forward 15 seconds (up to your progress)"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
                
                {/* Speed control */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cyclePlaybackSpeed}
                  className="text-white hover:bg-white/20"
                  title="Change playback speed"
                >
                  <span className="text-xs font-mono">{playbackSpeed}x</span>
                </Button>
              </div>
            </div>
          )}

          {/* Volume Control - Only show for audio episodes */}
          {!isVideoEpisode && (
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="flex-1 max-w-24"
              />
              <span className="text-xs text-white/80 w-8">
                {isMuted ? 0 : volume}%
              </span>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}