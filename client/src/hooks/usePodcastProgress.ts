import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PodcastService, UserPodcastProgress, UserPodcastStats, PodcastEpisode } from '@/lib/podcastService'
import { useToast } from '@/hooks/use-toast'

// Hook for getting all podcast episodes
export function usePodcastEpisodes() {
  return useQuery({
    queryKey: ['podcast', 'episodes'],
    queryFn: () => PodcastService.getAllEpisodes(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Hook for getting episodes by series
export function usePodcastEpisodesBySeries(series: string) {
  return useQuery({
    queryKey: ['podcast', 'episodes', 'series', series],
    queryFn: () => PodcastService.getEpisodesBySeries(series),
    enabled: !!series,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Hook for getting user's overall podcast statistics
export function usePodcastStats() {
  return useQuery({
    queryKey: ['podcast', 'stats'],
    queryFn: () => PodcastService.getUserStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Hook for getting user's progress across all episodes
export function usePodcastProgress() {
  return useQuery({
    queryKey: ['podcast', 'progress'],
    queryFn: () => PodcastService.getUserProgress(),
    staleTime: 1000 * 30, // 30 seconds for more frequent updates
    gcTime: 1000 * 60 * 5, // Keep in memory for 5 minutes
  })
}

// Hook for getting progress for a specific episode
export function useEpisodeProgress(episodeId: string) {
  return useQuery({
    queryKey: ['podcast', 'progress', episodeId],
    queryFn: () => PodcastService.getEpisodeProgress(episodeId),
    enabled: !!episodeId,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Hook for getting recently listened episodes
export function useRecentlyListened(limit: number = 5) {
  return useQuery({
    queryKey: ['podcast', 'recent', limit],
    queryFn: () => PodcastService.getRecentlyListened(limit),
    staleTime: 1000 * 30, // 30 seconds for more frequent updates
    gcTime: 1000 * 60 * 5, // Keep in memory for 5 minutes
  })
}

// Hook for getting completed episodes
export function useCompletedEpisodes() {
  return useQuery({
    queryKey: ['podcast', 'completed'],
    queryFn: () => PodcastService.getCompletedEpisodes(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Hook for getting series progress
export function useSeriesProgress(series: string) {
  return useQuery({
    queryKey: ['podcast', 'series', series],
    queryFn: () => PodcastService.getSeriesProgress(series),
    enabled: !!series,
    staleTime: 1000 * 30, // 30 seconds for more frequent updates
    gcTime: 1000 * 60 * 5, // Keep in memory for 5 minutes
  })
}

// Hook for updating listening progress
export function useUpdateProgress() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      episodeId, 
      progressSeconds, 
      episodeDuration,
      mediaType
    }: { 
      episodeId: string
      progressSeconds: number
      episodeDuration: number
      mediaType?: 'audio' | 'video'
    }) => {
      await PodcastService.updateProgress(episodeId, progressSeconds, episodeDuration, mediaType)
    },
    onSuccess: (_, variables) => {
      // Invalidate specific queries that need immediate updates
      queryClient.invalidateQueries({ queryKey: ['podcast', 'progress'] })
      queryClient.invalidateQueries({ queryKey: ['podcast', 'progress', variables.episodeId] })
      queryClient.invalidateQueries({ queryKey: ['podcast', 'completed'] })
      queryClient.invalidateQueries({ queryKey: ['podcast', 'recent'] })
      queryClient.invalidateQueries({ queryKey: ['podcast', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['podcast', 'series'] })
      
      // Force immediate refetch with reduced stale time
      queryClient.refetchQueries({ queryKey: ['podcast'] })
      
      // Show completion toast if episode was just completed
      const isCompleted = PodcastService.isEpisodeCompleted(
        variables.progressSeconds, 
        variables.episodeDuration
      )
      
      if (isCompleted) {
        toast({
          title: "Episode Complete! 🎉",
          description: "Great job! Your learning streak continues.",
        })
      }
    },
    onError: (error) => {
      console.error('Failed to update progress:', error)
      // Suppress error toasts to avoid spam during video playback
      // Progress will be auto-saved on next successful attempt
    }
  })
}

// Custom hook for podcast dashboard data
export function usePodcastDashboard() {
  const statsQuery = usePodcastStats()
  const recentQuery = useRecentlyListened(3)
  const progressQuery = usePodcastProgress()
  const episodesQuery = usePodcastEpisodes()

  const isLoading = statsQuery.isLoading || recentQuery.isLoading || progressQuery.isLoading || episodesQuery.isLoading
  const error = statsQuery.error || recentQuery.error || progressQuery.error || episodesQuery.error

  // Calculate additional metrics
  const stats = statsQuery.data
  const recentEpisodes = recentQuery.data || []
  const allProgress = progressQuery.data || []
  const allEpisodes = episodesQuery.data || []

  const currentlyListening = recentEpisodes.find(
    progress => progress.progress_seconds > 0 && !progress.completed
  )

  const totalEpisodes = allEpisodes.length // Use actual total episodes count
  const completedCount = allProgress.filter(p => p.completed).length
  const inProgressCount = allProgress.filter(p => p.progress_seconds > 0 && !p.completed).length

  // Calculate completion rate considering partial progress across ALL episodes
  let totalCompletionScore = 0
  
  allEpisodes.forEach(episode => {
    const userProgress = allProgress.find(p => p.episode_id === episode.id)
    
    if (userProgress?.completed) {
      totalCompletionScore += 100 // Full completion
    } else if (userProgress?.progress_seconds && userProgress.progress_seconds > 0) {
      // Calculate partial completion percentage
      const episodeCompletion = (userProgress.progress_seconds / episode.duration) * 100
      totalCompletionScore += Math.min(episodeCompletion, 100)
    }
    // Episodes with no progress contribute 0 to the score
  })

  const averageCompletionRate = totalEpisodes > 0 ? Math.round(totalCompletionScore / totalEpisodes) : 0

  return {
    stats,
    recentEpisodes,
    currentlyListening,
    metrics: {
      totalEpisodes,
      completedCount,
      inProgressCount,
      completionRate: averageCompletionRate
    },
    isLoading,
    error
  }
}