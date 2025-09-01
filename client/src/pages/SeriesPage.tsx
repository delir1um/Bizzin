import React, { useState, useMemo } from 'react'
import { useLocation } from 'wouter'
import { StandardPageLayout, createStatCard } from '@/components/layout/StandardPageLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Clock, 
  Star, 
  ArrowLeft,
  CheckCircle2,
  Users,
  Award,
  Mic,
  TrendingUp
} from 'lucide-react'
import { AnimatedGrid, AnimatedItem } from '@/components/ui/animated-card'
import { EpisodeModal } from '@/components/podcast/EpisodeModal'
import { Episode } from '@/components/podcast/PodcastPlayer'
import { usePodcastEpisodes, useSeriesProgress, useCompletedEpisodes, usePodcastProgress } from '@/hooks/usePodcastProgress'

// Series configuration with metadata (UI styling only)
const seriesConfig: Record<string, {
  name: string
  description: string
  color: string
  bgColor: string
  icon: React.ReactNode
}> = {
  'the-journey': {
    name: 'The Journey',
    description: 'Navigate the entrepreneurial journey from idea to execution with real stories and practical experiences.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    icon: <Mic className="w-6 h-6 text-blue-600 dark:text-blue-400" />
  },
  'self-development': {
    name: 'Self-Development', 
    description: 'Build the mindset, habits, and personal skills needed to succeed as an entrepreneur.',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    icon: <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
  },
  leadership: {
    name: 'Leadership',
    description: 'Leadership skills and team management strategies for entrepreneurs building their first teams.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900', 
    icon: <Star className="w-6 h-6 text-orange-600 dark:text-orange-400" />
  },
  strategy: {
    name: 'Strategy',
    description: 'Master the art of business strategy with frameworks and methodologies used by successful entrepreneurs worldwide.',
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    icon: <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
  }
}

interface SeriesPageProps {
  seriesSlug: string
}

export function SeriesPage({ seriesSlug }: SeriesPageProps) {
  const [, setLocation] = useLocation()
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [showEpisodeModal, setShowEpisodeModal] = useState(false)

  // Fetch real episode data from database
  const { data: dbEpisodes, isLoading: episodesLoading } = usePodcastEpisodes()
  
  // Convert slug to proper series name (e.g., "the-journey" → "The Journey")
  const convertSlugToSeriesName = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  
  // Get real progress data from database
  const seriesName = convertSlugToSeriesName(seriesSlug)
  const { data: seriesProgress } = useSeriesProgress(seriesName)
  const { data: completedEpisodes } = useCompletedEpisodes()
  const { data: allProgress } = usePodcastProgress()

  // Get series configuration
  const seriesInfo = seriesConfig[seriesSlug]

  // Filter episodes for this series and convert to Episode format
  const episodes: Episode[] = useMemo(() => {
    if (!dbEpisodes) return []
    
    return dbEpisodes
      .filter(ep => ep.series === seriesName)
      .map(ep => ({
        id: ep.id,
        title: ep.title,
        description: ep.description || '',
        duration: ep.duration,
        series: ep.series,
        seriesColor: ep.series_color || 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200',
        transcript: ep.transcript || '',
        episodeNumber: ep.episode_number,
        keyTakeaways: ep.key_takeaways,
        difficulty: ep.difficulty,
        hasVideo: ep.has_video,
        videoUrl: ep.video_url,
        videoThumbnail: ep.video_thumbnail
      }))
      .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0))
  }, [dbEpisodes, seriesName])



  // Calculate series stats from real data
  const totalDuration = episodes.reduce((acc, ep) => acc + ep.duration, 0)
  const totalDurationHours = (totalDuration / 3600).toFixed(1)
  
  // Get actual completed episodes count for this series
  const seriesCompletedCount = completedEpisodes?.filter(ep => 
    ep.episode?.series === seriesName
  ).length || 0
  
  const progressPercentage = episodes.length > 0 ? (seriesCompletedCount / episodes.length) * 100 : 0
  
  // Get most common difficulty level
  const difficulties = episodes.map(ep => ep.difficulty).filter(Boolean)
  const difficultyCount = difficulties.reduce((acc, diff) => {
    if (diff) acc[diff] = (acc[diff] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const mostCommonDifficulty = Object.keys(difficultyCount).length > 0 
    ? Object.entries(difficultyCount).reduce((a, b) => 
        difficultyCount[a[0]] > difficultyCount[b[0]] ? a : b
      )[0] 
    : 'Intermediate'

  if (!seriesInfo) {
    return (
      <StandardPageLayout
        title="Series Not Found"
        subtitle="The podcast series you're looking for doesn't exist."
        stats={[]}
      >
        <div className="text-center py-12">
          <p>Series not found. Please check the URL and try again.</p>
          <Button 
            onClick={() => setLocation('/training')}
            className="mt-4"
          >
            Back to Podcast
          </Button>
        </div>
      </StandardPageLayout>
    )
  }

  if (episodesLoading) {
    return (
      <StandardPageLayout
        title={seriesInfo.name}
        subtitle={seriesInfo.description}
        stats={[]}
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading episodes...</p>
        </div>
      </StandardPageLayout>
    )
  }

  const handleEpisodeClick = (episode: Episode) => {
    setSelectedEpisode(episode)
    setShowEpisodeModal(true)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  const statCards = [
    createStatCard(
      'episodes',
      'Total Episodes',
      episodes.length,
      'Episodes Available',
      <Mic className="w-6 h-6 text-white" />,
      'blue'
    ),
    createStatCard(
      'completed',
      'Completed',
      seriesCompletedCount,
      'Episodes Finished',
      <CheckCircle2 className="w-6 h-6 text-white" />,
      'green'
    ),
    createStatCard(
      'duration',
      'Total Duration',
      `${totalDurationHours}h`,
      'Hours of Content',
      <Clock className="w-6 h-6 text-white" />,
      'purple'
    ),
    createStatCard(
      'difficulty',
      'Difficulty',
      mostCommonDifficulty,
      'Skill Level',
      <Award className="w-6 h-6 text-white" />,
      'orange'
    )
  ]

  return (
    <>
      <StandardPageLayout
        title={seriesInfo.name}
        subtitle={seriesInfo.description}
        searchPlaceholder={`Search ${seriesInfo.name} episodes...`}
        stats={statCards}
      >
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/training')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Podcast
          </Button>
        </div>

        {/* Series Progress */}
        <div className="mb-8">
          <Card className={`${seriesInfo.bgColor} border-2`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 ${seriesInfo.bgColor} rounded-lg`}>
                    {seriesInfo.icon}
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold ${seriesInfo.color}`}>
                      {seriesInfo.name} Series Progress
                    </h3>
                    <p className={`text-sm ${seriesInfo.color} opacity-80`}>
                      {seriesCompletedCount} of {episodes.length} episodes completed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${seriesInfo.color}`}>
                    {Math.round(progressPercentage)}%
                  </div>
                  <div className={`text-sm ${seriesInfo.color} opacity-80`}>Complete</div>
                </div>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </CardContent>
          </Card>
        </div>

        {/* Episodes List */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">Episodes</h2>
          {episodes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">No episodes found for this series.</p>
            </div>
          ) : (
            <AnimatedGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.1}>
              {episodes.map((episode, index) => {
                // Get progress for this episode
                const episodeProgress = allProgress?.find(p => p.episode_id === episode.id)
                const isCompleted = completedEpisodes?.some(completedEp => completedEp.episode_id === episode.id)
                const hasProgress = episodeProgress && episodeProgress.progress_seconds > 0
                const progressPercentage = hasProgress ? Math.round((episodeProgress.progress_seconds / episode.duration) * 100) : 0
                
                // Determine button text and icon
                let buttonText = 'Listen Now'
                let buttonIcon = <Play className="w-4 h-4 mr-2" />
                
                if (isCompleted) {
                  buttonText = 'Listen Again'
                  buttonIcon = <CheckCircle2 className="w-4 h-4 mr-2" />
                } else if (hasProgress) {
                  buttonText = 'Continue Listening'
                  buttonIcon = <Play className="w-4 h-4 mr-2" />
                }

                return (
                  <AnimatedItem key={episode.id}>
                    <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                Episode {episode.episodeNumber}
                              </Badge>
                              {episode.difficulty && (
                                <Badge variant="secondary" className="text-xs">
                                  {episode.difficulty}
                                </Badge>
                              )}
                              {isCompleted && (
                                <Badge className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg text-slate-900 dark:text-white mb-2">
                              {episode.title}
                            </CardTitle>
                            <CardDescription className="text-slate-600 dark:text-slate-400">
                              {episode.description.length > 80 
                                ? `${episode.description.substring(0, 80)}...` 
                                : episode.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDuration(episode.duration)}
                          </div>
                          {hasProgress && !isCompleted && (
                            <div className="flex items-center text-orange-600">
                              <span className="text-xs font-medium">
                                {progressPercentage}% complete
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Progress bar for episodes with progress */}
                        {hasProgress && !isCompleted && (
                          <div className="mb-4">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                              <div 
                                className="bg-orange-600 h-1.5 rounded-full transition-all duration-300" 
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                          onClick={() => handleEpisodeClick(episode)}
                        >
                          {buttonIcon}
                          {buttonText}
                        </Button>
                      </CardContent>
                    </Card>
                  </AnimatedItem>
                )
              })}
            </AnimatedGrid>
          )}
        </div>
      </StandardPageLayout>

      {/* Episode Modal */}
      <EpisodeModal
        episode={selectedEpisode}
        isOpen={showEpisodeModal}
        onClose={() => setShowEpisodeModal(false)}
      />
    </>
  )
}