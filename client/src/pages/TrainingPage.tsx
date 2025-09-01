import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Play, Headphones, Clock, Star, Users, Award, Search, Mic, BookOpen, CheckCircle2, Video } from "lucide-react"
import { StandardPageLayout, createStatCard } from "@/components/layout/StandardPageLayout"
import { motion } from "framer-motion"
import { AnimatedCard, AnimatedGrid, AnimatedItem } from "@/components/ui/animated-card"
import { useState } from "react"
import { useLocation } from 'wouter'
import { usePodcastDashboard, usePodcastEpisodes, usePodcastProgress, useCompletedEpisodes } from '@/hooks/usePodcastProgress'
import { PodcastService } from '@/lib/podcastService'
import { EpisodeModal } from '@/components/podcast/EpisodeModal'
import { PodcastPlayer } from '@/components/podcast/PodcastPlayer'
import { PodcastEpisode } from '@/lib/podcastService'

export function PodcastPage() {
  const [, setLocation] = useLocation()
  const [selectedEpisode, setSelectedEpisode] = useState<PodcastEpisode | null>(null)
  const [showEpisodeModal, setShowEpisodeModal] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  const { stats, recentEpisodes, currentlyListening, metrics, isLoading } = usePodcastDashboard()
  const { data: dbEpisodes, isLoading: episodesLoading, error: episodesError } = usePodcastEpisodes()
  const { data: allProgress } = usePodcastProgress()
  const { data: completedEpisodes } = useCompletedEpisodes()

  // Helper function to get series-specific colors
  const getSeriesColor = (seriesName: string, dbColor?: string) => {
    if (dbColor) return dbColor
    
    // Use series-specific colors based on series name
    const seriesColorMap: Record<string, string> = {
      'The Journey': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
      'Self-Development': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
      'Leadership': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200',
      'Strategy': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200'
    }
    
    return seriesColorMap[seriesName] || 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
  }

  // Use episodes directly from database without conversion
  const episodes: PodcastEpisode[] = dbEpisodes || []

  // Filter episodes based on search query
  const filteredEpisodes = episodes.filter(episode =>
    searchQuery === '' || 
    episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    episode.series.toLowerCase().includes(searchQuery.toLowerCase()) ||
    episode.description.toLowerCase().includes(searchQuery.toLowerCase())
  )



  const handleEpisodeClick = (episode: PodcastEpisode) => {
    setSelectedEpisode(episode)
    setShowEpisodeModal(true)
  }

  const handleContinueListening = () => {
    console.log('🔍 [CLICK LOG] TrainingPage - Continue button clicked');
    
    // Find first episode with progress from real database data
    if (episodes.length > 0 && allProgress) {
      // Find episode with most recent progress
      const episodeWithProgress = episodes.find(ep => {
        const progress = allProgress.find(p => p.episode_id === ep.id)
        return progress && progress.progress_seconds > 0
      })
      
      if (episodeWithProgress) {
        const progress = allProgress.find(p => p.episode_id === episodeWithProgress.id);
        console.log('🔍 [CLICK LOG] Found episode with progress:', {
          episodeId: episodeWithProgress.id,
          title: episodeWithProgress.title,
          progressSeconds: progress?.progress_seconds,
          lastMediaType: progress?.last_media_type,
          hasProgress: !!progress
        });
        setSelectedEpisode(episodeWithProgress)
        setShowPlayer(true)
      } else {
        console.log('🔍 [CLICK LOG] No progress found, starting first episode:', episodes[0]?.title);
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
      'Learning Time',
      stats?.total_listening_time ? `${Math.round(stats.total_listening_time / 3600 * 10) / 10}h` : '0h',
      'Audio & Video',
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

  const secondaryActions: any[] = []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header - Exact Same Animation as Journal & Goals */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-3xl font-bold text-slate-900 dark:text-white"
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              <motion.span
                animate={{ 
                  color: ["#1e293b", "#ea7a57", "#1e293b"],
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="dark:animate-none dark:text-white"
              >
                Business Podcast
              </motion.span>
            </motion.h1>
            <motion.p 
              className="mt-2 text-lg text-slate-600 dark:text-slate-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              15-minute business insights to grow your entrepreneurial mindset
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="mt-4 sm:mt-0"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "backOut" }}
          >
            {/* Quick actions can be added here if needed */}
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards - Animated */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 + (index * 0.1), ease: "backOut" }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                    <Headphones className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <motion.div 
                      className="text-2xl font-bold text-blue-900 dark:text-blue-100"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.7 + (index * 0.1) }}
                    >
                      {stat.value}
                    </motion.div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Search Bar - Now positioned after stats cards */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search episodes by title or series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
        </div>
      </motion.div>

      {/* Podcast Series - Top Content Section */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Popular Series</h2>
        <AnimatedGrid className="grid grid-cols-2 md:grid-cols-4 gap-4" stagger={0.1}>
          <AnimatedItem>
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Card 
                className="bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 cursor-pointer group
                  border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 relative overflow-hidden"
                onClick={() => setLocation('/training/series/the-journey')}
              >
                <CardContent className="p-6 text-center">
                  <motion.div 
                    className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Mic className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">The Journey</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{episodes.filter(ep => ep.series === 'The Journey').length} episodes</p>
                  
                  {/* Background shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/20 dark:via-blue-900/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </AnimatedItem>
          <AnimatedItem>
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Card 
                className="bg-white dark:bg-slate-800 hover:shadow-xl hover:shadow-green-200/50 dark:hover:shadow-green-900/30 
                  hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer group
                  border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 relative overflow-hidden"
                onClick={() => setLocation('/training/series/self-development')}
              >
                <CardContent className="p-6 text-center relative z-10">
                  <motion.div 
                    className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Self-Development</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{episodes.filter(ep => ep.series === 'Self-Development').length} episodes</p>
                  
                  {/* Animated Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-900/10 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </CardContent>
              </Card>
            </motion.div>
          </AnimatedItem>

          <AnimatedItem>
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Card 
                className="bg-white dark:bg-slate-800 hover:shadow-xl hover:shadow-purple-200/50 dark:hover:shadow-purple-900/30 
                  hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer group
                  border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 relative overflow-hidden"
                onClick={() => setLocation('/training/series/strategy')}
              >
                <CardContent className="p-6 text-center relative z-10">
                  <motion.div 
                    className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </motion.div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Strategy</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{episodes.filter(ep => ep.series === 'Strategy').length} episodes</p>
                  
                  {/* Animated Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-900/10 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </CardContent>
              </Card>
            </motion.div>
          </AnimatedItem>

          <AnimatedItem>
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Card 
                className="bg-white dark:bg-slate-800 hover:shadow-xl hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30 
                  hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer group
                  border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 relative overflow-hidden"
                onClick={() => setLocation('/training/series/leadership')}
              >
                <CardContent className="p-6 text-center relative z-10">
                  <motion.div 
                    className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-3"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Star className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </motion.div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Leadership</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{episodes.filter(ep => ep.series === 'Leadership').length} episodes</p>
                  
                  {/* Animated Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-900/10 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </CardContent>
              </Card>
            </motion.div>
          </AnimatedItem>
        </AnimatedGrid>
      </motion.div>

      {/* Continue Listening - show only if user has progress */}
      {currentlyListening && (
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Continue Learning</h2>
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
                        {PodcastService.getCompletionPercentage(currentlyListening.progress_seconds, currentlyListening.episode?.duration || 1)}% complete
                      </span>
                    </div>
                    <Progress 
                      value={PodcastService.getCompletionPercentage(currentlyListening.progress_seconds, currentlyListening.episode?.duration || 1)} 
                      className="h-2" 
                    />
                  </div>
                </div>
                <div className="mt-4 md:mt-0 md:ml-6">
                  <Button 
                    onClick={() => {
                      console.log('🔍 [CLICK LOG] Continue Learning - Button clicked:', {
                        episodeId: currentlyListening.episode?.id,
                        title: currentlyListening.episode?.title,
                        lastMediaType: currentlyListening.last_media_type,
                        hasVideo: currentlyListening.episode?.has_video,
                        progressSeconds: currentlyListening.progress_seconds
                      });
                      
                      if (currentlyListening.episode) {
                        setSelectedEpisode(currentlyListening.episode)
                        setShowPlayer(true)
                      }
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {(() => {
                      // Check database first, then localStorage fallback
                      const lastMediaType = currentlyListening.last_media_type || 
                        (currentlyListening.episode ? PodcastService.getStoredMediaTypePreference(currentlyListening.episode.id) : null)
                      return (lastMediaType === 'video' || 
                        (currentlyListening.episode?.has_video && !lastMediaType)) 
                        ? 'Continue Watching' : 'Continue Listening'
                    })()}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Featured Episodes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          {searchQuery ? `Search Results (${filteredEpisodes.length} episodes)` : 'Featured Episodes'}
        </h2>
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
        ) : filteredEpisodes.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No episodes found</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try adjusting your search terms or browse our series above.
            </p>
          </div>
        ) : (
          <AnimatedGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.15}>
            {filteredEpisodes.slice(0, 6).map((episode, index) => (
              <AnimatedItem key={episode.id}>
                <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                  hover:shadow-xl hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30 
                  hover:border-blue-300 dark:hover:border-blue-600
                  hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out
                  cursor-pointer group relative overflow-hidden"
                  onClick={() => {
                    setSelectedEpisode(episode)
                    setShowEpisodeModal(true)
                  }}
                >
                  {/* Animated Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-slate-900 dark:text-white 
                          group-hover:text-blue-600 dark:group-hover:text-blue-400 
                          transition-colors duration-300">
                          {episode.title}
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                          {episode.description.length > 60 
                            ? `${episode.description.substring(0, 60)}...` 
                            : episode.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className={episode.series_color}>
                        {episode.series}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {Math.round(episode.duration / 60)} min
                        </div>
                        {episode.has_video ? (
                          <div className="flex items-center text-orange-600">
                            <Video className="w-4 h-4 mr-1" />
                            <span className="text-xs">Video</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-blue-600">
                            <Headphones className="w-4 h-4 mr-1" />
                            <span className="text-xs">Audio</span>
                          </div>
                        )}
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
                      const progressPercentage = hasProgress ? PodcastService.getCompletionPercentage(episodeProgress.progress_seconds, episode.duration) : 0
                      
                      // Determine button text and icon based on last media type used or episode capability
                      // Try database first, then localStorage fallback
                      const userLastMediaType = episodeProgress?.last_media_type || PodcastService.getStoredMediaTypePreference(episode.id)
                      const episodeHasVideo = episode.has_video && episode.video_url
                      
                      // Use last media type if available, otherwise default to episode capability
                      let buttonText = (userLastMediaType === 'video' || (episodeHasVideo && !userLastMediaType)) ? 'Watch Now' : 'Listen Now'
                      let buttonIcon = (userLastMediaType === 'video' || (episodeHasVideo && !userLastMediaType)) ? 
                        <Video className="w-4 h-4 mr-2" /> : 
                        <Play className="w-4 h-4 mr-2" />
                      
                      if (isCompleted) {
                        buttonText = (userLastMediaType === 'video' || (episodeHasVideo && !userLastMediaType)) ? 'Watch Again' : 'Listen Again'
                        buttonIcon = <CheckCircle2 className="w-4 h-4 mr-2" />
                      } else if (hasProgress) {
                        buttonText = (userLastMediaType === 'video' || (episodeHasVideo && !userLastMediaType)) ? 'Continue Watching' : 'Continue Listening'
                        buttonIcon = (userLastMediaType === 'video' || (episodeHasVideo && !userLastMediaType)) ? 
                          <Video className="w-4 h-4 mr-2" /> : 
                          <Play className="w-4 h-4 mr-2" />
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
                            onClick={() => {
                              console.log('🔍 [CLICK LOG] Featured Episodes - Episode card clicked:', {
                                episodeId: episode.id,
                                title: episode.title,
                                buttonText,
                                userLastMediaType,
                                episodeHasVideo,
                                hasProgress,
                                isCompleted,
                                progressSeconds: episodeProgress?.progress_seconds
                              });
                              handleEpisodeClick(episode)
                            }}
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
      </motion.div>

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
    </div>
  )
}