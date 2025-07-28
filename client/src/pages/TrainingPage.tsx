import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Headphones, Clock, Star, Users, Award, Search, Mic, BookOpen } from "lucide-react"
import { StandardPageLayout, createStatCard } from "@/components/layout/StandardPageLayout"
import { motion } from "framer-motion"
import { AnimatedCard, AnimatedGrid, AnimatedItem } from "@/components/ui/animated-card"
import { useState } from "react"
import { useLocation } from 'wouter'
import { usePodcastDashboard } from '@/hooks/usePodcastProgress'
import { EpisodeModal } from '@/components/podcast/EpisodeModal'
import { PodcastPlayer, Episode } from '@/components/podcast/PodcastPlayer'

export function PodcastPage() {
  const [, setLocation] = useLocation()
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [showEpisodeModal, setShowEpisodeModal] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  
  const { stats, recentEpisodes, currentlyListening, metrics, isLoading } = usePodcastDashboard()

  // Mock episode data
  const episodes: Episode[] = [
    {
      id: 'ep-1',
      title: 'The 15-Minute Business Model',
      description: 'Quick framework to validate your business idea and build a sustainable model that attracts customers and generates revenue from day one.',
      duration: 15 * 60, // 15 minutes in seconds
      series: 'Strategy',
      seriesColor: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      transcript: 'In this episode, we cover the essential components of building a business model that works. We start with identifying your core value proposition, understanding your target customer segments, and mapping out your revenue streams. The key is to keep it simple and focus on validation over perfection.'
    },
    {
      id: 'ep-2',
      title: 'Cash Flow Crisis Management',
      description: 'Practical steps when money gets tight and how to navigate financial challenges while keeping your business operational.',
      duration: 15 * 60,
      series: 'Finance',
      seriesColor: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      transcript: 'Cash flow problems are one of the leading causes of business failure. In this episode, we discuss early warning signs, emergency funding options, and strategic decisions to make when facing financial pressure.'
    },
    {
      id: 'ep-3',
      title: 'Building Team Culture Remotely',
      description: 'Leadership tactics for distributed teams and creating strong company culture in a remote-first world.',
      duration: 15 * 60,
      series: 'Leadership',
      seriesColor: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      transcript: 'Remote work has changed the game for team building and company culture. Learn practical strategies for maintaining team cohesion, communication best practices, and building trust across distributed teams.'
    }
  ]

  const handleEpisodeClick = (episode: Episode) => {
    setSelectedEpisode(episode)
    setShowEpisodeModal(true)
  }

  const handleContinueListening = () => {
    // Find episode 8 from mock data or create it
    const continueEpisode: Episode = {
      id: 'ep-8',
      title: 'Digital Marketing on a Startup Budget',
      description: 'Practical strategies to market your business effectively without breaking the bank.',
      duration: 15 * 60,
      series: 'Marketing',
      seriesColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      transcript: 'Marketing doesn\'t have to be expensive to be effective. In this episode, we explore cost-effective marketing strategies that deliver real results for startups and small businesses.'
    }
    setSelectedEpisode(continueEpisode)
    setShowPlayer(true)
  }
  // Use real data from database or fallback to demo data
  const statCards = [
    createStatCard(
      'available',
      'Episodes Available',
      42,
      'Total Episodes',
      <Headphones className="w-6 h-6 text-white" />,
      'blue'
    ),
    createStatCard(
      'completed',
      'Episodes Completed',
      stats?.total_episodes_completed || 0,
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
    className: 'border-orange-200 text-orange-700 hover:bg-orange-50'
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
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">12 episodes</p>
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
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">10 episodes</p>
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
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">8 episodes</p>
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
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">12 episodes</p>
              </CardContent>
            </Card>
          </AnimatedItem>
        </AnimatedGrid>
      </div>

      {/* Featured Episodes */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Featured Episodes</h2>
        <AnimatedGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.15}>
          {/* Episode 1 */}
          <AnimatedItem>
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    The 15-Minute Business Model
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Quick framework to validate your business idea
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Strategy
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  15 minutes
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  4.8 (234)
                </div>
              </div>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => handleEpisodeClick(episodes[0])}
              >
                <Play className="w-4 h-4 mr-2" />
                Listen Now
              </Button>
            </CardContent>
          </Card>
          </AnimatedItem>

          {/* Episode 2 */}
          <AnimatedItem>
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    Cash Flow Crisis Management
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Practical steps when money gets tight
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                  Finance
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  15 minutes
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  4.9 (189)
                </div>
              </div>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => handleEpisodeClick(episodes[1])}
              >
                <Play className="w-4 h-4 mr-2" />
                Listen Now
              </Button>
            </CardContent>
          </Card>
          </AnimatedItem>

          {/* Episode 3 */}
          <AnimatedItem>
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    Building Team Culture Remotely
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Leadership tactics for distributed teams
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                  Leadership
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  15 minutes
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  4.7 (156)
                </div>
              </div>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => handleEpisodeClick(episodes[2])}
              >
                <Play className="w-4 h-4 mr-2" />
                Listen Now
              </Button>
            </CardContent>
          </Card>
          </AnimatedItem>
        </AnimatedGrid>
      </div>

      {/* Episode Modal */}
      <EpisodeModal
        episode={selectedEpisode}
        isOpen={showEpisodeModal}
        onClose={() => setShowEpisodeModal(false)}
      />

      {/* Direct Podcast Player */}
      {showPlayer && selectedEpisode && (
        <PodcastPlayer
          episode={selectedEpisode}
          onClose={() => setShowPlayer(false)}
          autoPlay={true}
          startTime={8 * 60 + 32} // Continue from 8:32 for demo
        />
      )}
    </StandardPageLayout>
  )
}