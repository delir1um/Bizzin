import React, { useState, useRef, useEffect } from 'react'
import { useUpdateProgress } from '@/hooks/usePodcastProgress'
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
  Headphones
} from 'lucide-react'

export interface Episode {
  id: string
  title: string
  description: string
  duration: number // in seconds
  series: string
  seriesColor: string
  audioUrl?: string // For demo, we'll simulate audio
  videoUrl?: string // Video URL from Cloudflare R2
  videoThumbnail?: string // Video thumbnail URL
  hasVideo?: boolean // Whether episode has video content
  transcript?: string
  episodeNumber?: number
  keyTakeaways?: string[]
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
}

interface PodcastPlayerProps {
  episode: Episode
  onClose: () => void
  autoPlay?: boolean
  startTime?: number // Continue from specific time
  preferVideo?: boolean // Whether to prefer video over audio if both available
}

export function PodcastPlayer({ episode, onClose, autoPlay = false, startTime = 0, preferVideo = true }: PodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentTime, setCurrentTime] = useState(startTime)
  const [actualDuration, setActualDuration] = useState(episode.duration) // Track actual media duration
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)
  // Episodes are either audio or video, not both - no toggle needed
  const isVideoEpisode = Boolean(episode.hasVideo && episode.videoUrl)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const updateProgress = useUpdateProgress()
  const lastSaveTime = useRef(startTime)

  // Save progress every 10 seconds and on pause/close
  const saveProgress = (time: number) => {
    if (Math.abs(time - lastSaveTime.current) >= 10 || time >= actualDuration) {
      // Don't save if mutation is already pending to prevent spam
      if (updateProgress.isPending) return
      
      // Only save if we have meaningful progress (more than 5 seconds)
      if (time >= 5) {
        updateProgress.mutate({
          episodeId: episode.id,
          progressSeconds: Math.floor(time),
          episodeDuration: Math.floor(actualDuration) // Use actual media duration
        })
        lastSaveTime.current = time
      }
    }
  }

  // Simulate audio playback with progress tracking
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + playbackSpeed
          
          if (newTime >= actualDuration) {
            setIsPlaying(false)
            saveProgress(actualDuration) // Save completion
            return actualDuration
          }
          
          // Auto-save progress every 10 seconds while playing
          saveProgress(newTime)
          return newTime
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      // Save progress when paused
      if (currentTime > 0) {
        saveProgress(currentTime)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, playbackSpeed, episode.duration, episode.id])

  // Save progress when component unmounts (player closed)
  useEffect(() => {
    return () => {
      if (currentTime > 0) {
        updateProgress.mutate({
          episodeId: episode.id,
          progressSeconds: Math.floor(currentTime),
          episodeDuration: Math.floor(actualDuration)
        })
      }
    }
  }, []) // Empty dependency array to only run on unmount

  // Handle close with progress save
  const handleClose = () => {
    if (currentTime > 0) {
      updateProgress.mutate({
        episodeId: episode.id,
        progressSeconds: Math.floor(currentTime),
        episodeDuration: Math.floor(actualDuration)
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

  // Remove seeking capability - users should not skip ahead
  const handleSeek = (value: number[]) => {
    // Only allow seeking backwards to prevent skipping ahead
    const newTime = value[0]
    if (newTime <= currentTime) {
      setCurrentTime(newTime)
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
    setCurrentTime(prev => Math.max(prev - 15, 0))
  }

  const cyclePlaybackSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2]
    const currentIndex = speeds.indexOf(playbackSpeed)
    const nextIndex = (currentIndex + 1) % speeds.length
    setPlaybackSpeed(speeds[nextIndex])
  }

  const progress = (currentTime / actualDuration) * 100

  // No longer needed - episodes are either audio or video, not both

  const handleVideoTimeUpdate = (time: number) => {
    setCurrentTime(time)
    saveProgress(time)
  }

  const handleVideoDurationUpdate = (duration: number) => {
    // Update actual duration when video loads its metadata
    setActualDuration(duration)
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
    saveProgress(actualDuration)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <Card className={`w-full ${isExpanded ? 'h-full' : 'h-auto'} bg-white dark:bg-slate-900 rounded-t-xl border-0 transition-all duration-300`}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Badge 
                variant="secondary" 
                className={`${episode.seriesColor} text-white`}
              >
                {episode.series}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={cyclePlaybackSpeed}
                className="text-xs font-mono"
              >
                {playbackSpeed}x
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              {/* Content type indicator (no toggle needed) */}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Episode Info */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {episode.title}
            </h3>
            {isExpanded && (
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {episode.description}
              </p>
            )}
          </div>

          {/* Video Player (for video episodes) */}
          {isVideoEpisode && (
            <div className="mb-6">
              <VideoPlayer
                videoUrl={episode.videoUrl || ''}
                thumbnailUrl={episode.videoThumbnail}
                title={episode.title}
                onTimeUpdate={handleVideoTimeUpdate}
                onDurationUpdate={handleVideoDurationUpdate}
                onEnded={handleVideoEnded}
                startTime={startTime}
                className="w-full h-64 md:h-96"
              />
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
                  className="absolute top-0 left-0 h-2 bg-orange-200 dark:bg-orange-800 rounded-full -z-10"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(actualDuration)}</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                You can only replay content you've already completed
              </p>
            </div>
          )}

          {/* Controls - Only show for audio episodes */}
          {!isVideoEpisode && (
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={skipBackward}
                className="text-slate-600 dark:text-slate-400"
                title="Replay last 15 seconds"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              
              <Button
                onClick={handlePlayPause}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-full w-14 h-14"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </Button>
              
              {/* Skip forward removed - users should not skip ahead in learning content */}
              <div className="w-10 h-10 flex items-center justify-center opacity-30">
                <SkipForward className="w-5 h-5 text-slate-400" />
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
                className="text-slate-600 dark:text-slate-400"
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
              <span className="text-xs text-slate-500 dark:text-slate-400 w-8">
                {isMuted ? 0 : volume}%
              </span>
            </div>
          )}

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-8 space-y-6">
              {/* Episode Stats - Only show for audio episodes */}
              {!isVideoEpisode && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{Math.round(progress)}%</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Progress</div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{formatTime(actualDuration)}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Duration</div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{playbackSpeed}x</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Speed</div>
                  </div>
                </div>
              )}

              {/* Transcript/Notes */}
              {episode.transcript && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">Transcript</h4>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2 max-h-32 overflow-y-auto">
                    <p>{episode.transcript}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Completion Badge */}
          {progress >= 95 && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Episode Complete! 🎉
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}