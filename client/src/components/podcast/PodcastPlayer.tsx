import React, { useState, useRef, useEffect } from 'react'
import { useUpdateProgress } from '@/hooks/usePodcastProgress'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react'

export interface Episode {
  id: string
  title: string
  description: string
  duration: number // in seconds
  series: string
  seriesColor: string
  audioUrl?: string // For demo, we'll simulate audio
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
}

export function PodcastPlayer({ episode, onClose, autoPlay = false, startTime = 0 }: PodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentTime, setCurrentTime] = useState(startTime)
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const updateProgress = useUpdateProgress()
  const lastSaveTime = useRef(startTime)

  // Save progress every 10 seconds and on pause/close
  const saveProgress = (time: number) => {
    if (Math.abs(time - lastSaveTime.current) >= 10 || time >= episode.duration) {
      updateProgress.mutate({
        episodeId: episode.id,
        progressSeconds: Math.floor(time),
        episodeDuration: episode.duration
      })
      lastSaveTime.current = time
    }
  }

  // Simulate audio playback with progress tracking
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + playbackSpeed
          
          if (newTime >= episode.duration) {
            setIsPlaying(false)
            saveProgress(episode.duration) // Save completion
            return episode.duration
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
          episodeDuration: episode.duration
        })
      }
    }
  }, [])


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    setIsMuted(false)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const skipForward = () => {
    setCurrentTime(prev => Math.min(prev + 15, episode.duration))
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

  const progress = (currentTime / episode.duration) * 100

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
                onClick={onClose}
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

          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <Slider
              value={[currentTime]}
              max={episode.duration}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(episode.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipBackward}
              className="text-slate-600 dark:text-slate-400"
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
            
            <Button
              variant="ghost"
              size="sm"
              onClick={skipForward}
              className="text-slate-600 dark:text-slate-400"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* Volume Control */}
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

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-8 space-y-6">
              {/* Episode Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{Math.round(progress)}%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Progress</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatTime(episode.duration)}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Duration</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{playbackSpeed}x</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Speed</div>
                </div>
              </div>

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