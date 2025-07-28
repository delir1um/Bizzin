import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Headphones, Clock, Star, Users, Award, Search, Mic, BookOpen, CheckCircle2 } from "lucide-react"
import { StandardPageLayout, createStatCard } from "@/components/layout/StandardPageLayout"
import { motion } from "framer-motion"
import { AnimatedCard, AnimatedGrid, AnimatedItem } from "@/components/ui/animated-card"
import { useState } from "react"
import { useLocation } from 'wouter'
import { usePodcastDashboard, usePodcastEpisodes, usePodcastProgress, useCompletedEpisodes } from '@/hooks/usePodcastProgress'
import { EpisodeModal } from '@/components/podcast/EpisodeModal'
import { PodcastPlayer, Episode } from '@/components/podcast/PodcastPlayer'

export function PodcastPage() {
  const [, setLocation] = useLocation()
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [showEpisodeModal, setShowEpisodeModal] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  
  const { stats, recentEpisodes, currentlyListening, metrics, isLoading } = usePodcastDashboard()
  const { data: dbEpisodes, isLoading: episodesLoading, error: episodesError } = usePodcastEpisodes()
  const { data: allProgress } = usePodcastProgress()
  const { data: completedEpisodes } = useCompletedEpisodes()

  // Convert database episodes to Episode format
  const episodes: Episode[] = dbEpisodes?.map(ep => ({
    id: ep.id,
    title: ep.title,
    description: ep.description || '',
    duration: ep.duration,
    series: ep.series,
    seriesColor: ep.series_color || 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200',
    transcript: ep.transcript || '',
    episodeNumber: ep.episode_number,
    keyTakeaways: ep.key_takeaways,
    difficulty: ep.difficulty
  })) || []



  const handleEpisodeClick = (episode: Episode) => {
    setSelectedEpisode(episode)
    setShowEpisodeModal(true)
  }

  const handleContinueListening = () => {
    // Find first episode with progress from real database data
    if (episodes.length > 0 && allProgress) {
      // Find episode with most recent progress
      const episodeWithProgress = episodes.find(ep => {
        const progress = allProgress.find(p => p.episode_id === ep.id)
        return progress && progress.progress_seconds > 0
      })
      
      if (episodeWithProgress) {
        setSelectedEpisode(episodeWithProgress)
        setShowPlayer(true)
      } else {
        // No progress found, start first episode
        setSelectedEpisode(episodes[0])
        setShowPlayer(true)
      }
    }
  }
  // Use real data from database or fallback to demo data
  const statCards = [
    createStatCard(
      'available',
      'Episodes Available',
      episodes.length || 0,
      'Total Episodes',
      <Headphones className="w-6 h-6 text-white" />,
      'blue'
    ),
    createStatCard(
      'completed',
      'Episodes Completed',
      (stats?.total_episodes_completed ?? 0),
      'Finished Episodes',
      <BookOpen className="w-6 h-6 text-white" />,
      'green'
    ),
    createStatCard(
      'time',
      'Listening Time',
      stats?.total_listening_time ? `${Math.round(stats.total_listening_time / 3600 * 10) / 10}h` : '0h',
      'Total Hours',
      <Clock className="w-6 h-6 text-white" />,
      'purple'
    ),
    createStatCard(
      'streak',
      'Learning Streak',
      stats?.learning_streak ? `${stats.learning_streak} days` : '0 days',
      'Current Streak',
      <Star className="w-6 h-6 text-white" />,
      'orange'
    )
  ]

  const secondaryActions = [{
    label: 'Browse All Episodes',
    icon: <Search className="w-4 h-4 mr-2" />,
    onClick: () => console.log('Browse episodes'),
    variant: 'outline' as const,
    className: 'border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/20'
  }]

  return (
    <StandardPageLayout
      title="Business Podcast"
      subtitle="15-minute business insights to grow your entrepreneurial mindset"
      secondaryActions={secondaryActions}
      stats={statCards}
      showSearch={false}
      showFilters={false}
    >

      {/* Continue Listening - show only if user has progress */}
      {currentlyListening && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Continue Listening</h2>
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className={currentlyListening.episode?.series_color || "bg-orange-100 text-orange-800"}>
                      Episode {currentlyListening.episode?.episode_number || '#'}
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {currentlyListening.episode?.series || 'Unknown'}
                    </Badge>
                </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {currentlyListening.episode?.title || 'Unknown Episode'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {currentlyListening.episode?.description || 'No description available.'}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>
                        {Math.floor(currentlyListening.progress_seconds / 60)}:{String(currentlyListening.progress_seconds % 60).padStart(2, '0')} / {Math.floor((currentlyListening.episode?.duration || 0) / 60)}:{String((currentlyListening.episode?.duration || 0) % 60).padStart(2, '0')}
                      </span>
                      <span>
                        {Math.round((currentlyListening.progress_seconds / (currentlyListening.episode?.duration || 1)) * 100)}% complete
                      </span>
                    </div>
                    <Progress 
                      value={(currentlyListening.progress_seconds / (currentlyListening.episode?.duration || 1)) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
                <div className="mt-4 md:mt-0 md:ml-6">
                  <Button 
                    onClick={() => {
                      if (currentlyListening.episode) {
                        setSelectedEpisode({
                          id: currentlyListening.episode.id,
                          title: currentlyListening.episode.title,
                          description: currentlyListening.episode.description || '',
                          duration: currentlyListening.episode.duration,
                          series: currentlyListening.episode.series,
                          seriesColor: currentlyListening.episode.series_color || ''
                        })
                        setShowPlayer(true)
                      }
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Continue Listening
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Podcast Series */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Popular Series</h2>
        <AnimatedGrid className="grid grid-cols-2 md:grid-cols-4 gap-4" stagger={0.1}>
          <AnimatedItem>
            <Card 
              className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation('/training/series/strategy')}
            >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Mic className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Strategy</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{episodes.filter(ep => ep.series === 'Strategy').length} episodes</p>
            </CardContent>
          </Card>

          </AnimatedItem>
          <AnimatedItem>
            <Card 
              className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation('/training/series/marketing')}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Marketing</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{episodes.filter(ep => ep.series === 'Marketing').length} episodes</p>
              </CardContent>
            </Card>
          </AnimatedItem>

          <AnimatedItem>
            <Card 
              className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation('/training/series/finance')}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Finance</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{episodes.filter(ep => ep.series === 'Finance').length} episodes</p>
              </CardContent>
            </Card>
          </AnimatedItem>

          <AnimatedItem>
            <Card 
              className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation('/training/series/leadership')}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Leadership</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{episodes.filter(ep => ep.series === 'Leadership').length} episodes</p>
              </CardContent>
            </Card>
          </AnimatedItem>
        </AnimatedGrid>
      </div>

      {/* Featured Episodes */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Featured Episodes</h2>
        {episodesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <div className="animate-pulse">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <AnimatedGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.15}>
            {episodes.slice(0, 6).map((episode, index) => (
              <AnimatedItem key={episode.id}>
                <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-slate-900 dark:text-white">
                          {episode.title}
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                          {episode.description.length > 60 
                            ? `${episode.description.substring(0, 60)}...` 
                            : episode.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className={episode.seriesColor}>
                        {episode.series}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {Math.round(episode.duration / 60)} min
                      </div>
                      {episode.difficulty && (
                        <Badge variant="outline" className="text-xs">
                          {episode.difficulty}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Episode Progress */}
                    {(() => {
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
                        <>
                          {hasProgress && !isCompleted && (
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                                <span>Progress</span>
                                <span>{progressPercentage}%</span>
                              </div>
                              <Progress value={progressPercentage} className="h-2" />
                            </div>
                          )}
                          
                          <Button 
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => handleEpisodeClick(episode)}
                          >
                            {buttonIcon}
                            {buttonText}
                          </Button>
                        </>
                      )
                    })()}
                  </CardContent>
                </Card>
              </AnimatedItem>
            ))}
          </AnimatedGrid>
        )}
      </div>

      {/* Episode Modal */}
      <EpisodeModal
        episode={selectedEpisode}
        isOpen={showEpisodeModal}
        onClose={() => setShowEpisodeModal(false)}
      />

      {/* Direct Podcast Player */}
      {showPlayer && selectedEpisode && (() => {
        const episodeProgress = allProgress?.find(p => p.episode_id === selectedEpisode.id)
        const startTime = episodeProgress?.progress_seconds || 0
        
        return (
          <PodcastPlayer
            episode={selectedEpisode}
            onClose={() => setShowPlayer(false)}
            autoPlay={true}
            startTime={startTime}
          />
        )
      })()}
    </StandardPageLayout>
  )
}