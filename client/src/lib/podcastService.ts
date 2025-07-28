import { supabase } from './supabase'

export interface PodcastEpisode {
  id: string
  title: string
  description: string
  duration: number
  series: string
  series_color: string
  episode_number: number
  audio_url?: string
  transcript?: string
  key_takeaways?: string[]
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  created_at: string
  updated_at: string
}

export interface UserPodcastProgress {
  id: string
  user_id: string
  episode_id: string
  progress_seconds: number
  completed: boolean
  completed_at?: string
  last_listened_at: string
  episode?: PodcastEpisode
}

export interface UserPodcastStats {
  id: string
  user_id: string
  total_episodes_completed: number
  total_listening_time: number
  learning_streak: number
  longest_streak: number
  last_streak_date?: string
  favorite_series?: string
  created_at: string
  updated_at: string
}

export class PodcastService {
  
  // Get all podcast episodes
  static async getAllEpisodes(): Promise<PodcastEpisode[]> {
    const { data, error } = await supabase
      .from('podcast_episodes')
      .select('*')
      .order('series', { ascending: true })
      .order('episode_number', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  // Get episodes by series
  static async getEpisodesBySeries(series: string): Promise<PodcastEpisode[]> {
    const { data, error } = await supabase
      .from('podcast_episodes')
      .select('*')
      .eq('series', series)
      .order('episode_number', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  // Get single episode
  static async getEpisode(episodeId: string): Promise<PodcastEpisode | null> {
    const { data, error } = await supabase
      .from('podcast_episodes')
      .select('*')
      .eq('id', episodeId)
      .single()
    
    if (error) throw error
    return data
  }

  // Get user's podcast progress for all episodes
  static async getUserProgress(): Promise<UserPodcastProgress[]> {
    const { data, error } = await supabase
      .from('user_podcast_progress')
      .select(`
        *,
        episode:podcast_episodes(*)
      `)
      .order('last_listened_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Get user's progress for specific episode
  static async getEpisodeProgress(episodeId: string): Promise<UserPodcastProgress | null> {
    const { data, error } = await supabase
      .from('user_podcast_progress')
      .select('*')
      .eq('episode_id', episodeId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
    return data
  }

  // Update listening progress
  static async updateProgress(episodeId: string, progressSeconds: number, episodeDuration: number): Promise<void> {
    const { error } = await supabase.rpc('update_podcast_progress', {
      p_episode_id: episodeId,
      p_progress_seconds: progressSeconds,
      p_episode_duration: episodeDuration
    })
    
    if (error) throw error
  }

  // Get user podcast statistics
  static async getUserStats(): Promise<UserPodcastStats | null> {
    const { data, error } = await supabase
      .from('user_podcast_stats')
      .select('*')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // Get recently listened episodes
  static async getRecentlyListened(limit: number = 5): Promise<UserPodcastProgress[]> {
    const { data, error } = await supabase
      .from('user_podcast_progress')
      .select(`
        *,
        episode:podcast_episodes(*)
      `)
      .order('last_listened_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }

  // Get completed episodes
  static async getCompletedEpisodes(): Promise<UserPodcastProgress[]> {
    const { data, error } = await supabase
      .from('user_podcast_progress')
      .select(`
        *,
        episode:podcast_episodes(*)
      `)
      .eq('completed', true)
      .order('completed_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Get progress for specific series
  static async getSeriesProgress(series: string): Promise<{
    episodes: PodcastEpisode[]
    progress: UserPodcastProgress[]
    stats: { total: number, completed: number, totalDuration: number, completedDuration: number }
  }> {
    // Get all episodes in series
    const episodes = await this.getEpisodesBySeries(series)
    
    // Get user progress for these episodes
    const episodeIds = episodes.map(ep => ep.id)
    const { data: progress, error } = await supabase
      .from('user_podcast_progress')
      .select('*')
      .in('episode_id', episodeIds)
    
    if (error) throw error
    
    // Calculate stats
    const completedProgress = (progress || []).filter(p => p.completed)
    const totalDuration = episodes.reduce((sum, ep) => sum + ep.duration, 0)
    const completedDuration = completedProgress.reduce((sum, p) => {
      const episode = episodes.find(ep => ep.id === p.episode_id)
      return sum + (episode?.duration || 0)
    }, 0)
    
    return {
      episodes,
      progress: progress || [],
      stats: {
        total: episodes.length,
        completed: completedProgress.length,
        totalDuration,
        completedDuration
      }
    }
  }

  // Format duration from seconds to readable string
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Format time for progress display
  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate completion percentage
  static getCompletionPercentage(progressSeconds: number, totalSeconds: number): number {
    return Math.round((progressSeconds / totalSeconds) * 100)
  }

  // Check if episode is completed (95% threshold)
  static isEpisodeCompleted(progressSeconds: number, totalSeconds: number): boolean {
    return progressSeconds >= (totalSeconds * 0.95)
  }
}