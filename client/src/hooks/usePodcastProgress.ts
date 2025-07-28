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
    staleTime: 1000 * 60 * 2, // 2 minutes
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
    staleTime: 1000 * 60 * 2, // 2 minutes
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
    staleTime: 1000 * 60 * 2, // 2 minutes
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
      episodeDuration 
    }: { 
      episodeId: string
      progressSeconds: number
      episodeDuration: number 
    }) => {
      await PodcastService.updateProgress(episodeId, progressSeconds, episodeDuration)
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['podcast'] })
      
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
      toast({
        title: "Progress Not Saved",
        description: "There was an issue saving your progress. Please try again.",
        variant: "destructive",
      })
    }
  })
}

// Custom hook for podcast dashboard data
export function usePodcastDashboard() {
  const statsQuery = usePodcastStats()
  const recentQuery = useRecentlyListened(3)
  const progressQuery = usePodcastProgress()

  const isLoading = statsQuery.isLoading || recentQuery.isLoading || progressQuery.isLoading
  const error = statsQuery.error || recentQuery.error || progressQuery.error

  // Calculate additional metrics
  const stats = statsQuery.data
  const recentEpisodes = recentQuery.data || []
  const allProgress = progressQuery.data || []

  const currentlyListening = recentEpisodes.find(
    progress => progress.progress_seconds > 0 && !progress.completed
  )

  const totalEpisodes = new Set(allProgress.map(p => p.episode_id)).size
  const completedCount = allProgress.filter(p => p.completed).length
  const inProgressCount = allProgress.filter(p => p.progress_seconds > 0 && !p.completed).length

  return {
    stats,
    recentEpisodes,
    currentlyListening,
    metrics: {
      totalEpisodes,
      completedCount,
      inProgressCount,
      completionRate: totalEpisodes > 0 ? Math.round((completedCount / totalEpisodes) * 100) : 0
    },
    isLoading,
    error
  }
}