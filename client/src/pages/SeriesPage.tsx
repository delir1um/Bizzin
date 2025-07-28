import React, { useState } from 'react'
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

interface SeriesData {
  name: string
  description: string
  totalEpisodes: number
  completedEpisodes: number
  totalDuration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  color: string
  bgColor: string
  icon: React.ReactNode
  episodes: Episode[]
}

const seriesData: Record<string, SeriesData> = {
  strategy: {
    name: 'Strategy',
    description: 'Master the art of business strategy with frameworks and methodologies used by successful entrepreneurs worldwide.',
    totalEpisodes: 12,
    completedEpisodes: 1,
    totalDuration: '3.2h',
    difficulty: 'Intermediate',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    icon: <Mic className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    episodes: [
      {
        id: 'strategy-1',
        title: 'The 15-Minute Business Model',
        description: 'Quick framework to validate your business idea and build a sustainable model that attracts customers and generates revenue.',
        duration: 15 * 60,
        series: 'Strategy',
        seriesColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
      },
      {
        id: 'strategy-2',
        title: 'Competitive Analysis Made Simple',
        description: 'Learn how to analyze your competition effectively and find your unique positioning in the market.',
        duration: 18 * 60,
        series: 'Strategy',
        seriesColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
      },
      {
        id: 'strategy-3',
        title: 'Product-Market Fit Essentials',
        description: 'Discover the key indicators of product-market fit and how to achieve it faster than your competitors.',
        duration: 16 * 60,
        series: 'Strategy',
        seriesColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
      },
      {
        id: 'strategy-4',
        title: 'Scaling Strategy Frameworks',
        description: 'Strategic frameworks for scaling your business without losing focus or burning through cash.',
        duration: 20 * 60,
        series: 'Strategy',
        seriesColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
      }
    ]
  },
  marketing: {
    name: 'Marketing',
    description: 'Practical marketing strategies that work for startups and small businesses on any budget.',
    totalEpisodes: 10,
    completedEpisodes: 3,
    totalDuration: '2.8h',
    difficulty: 'Beginner',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    icon: <Users className="w-6 h-6 text-green-600 dark:text-green-400" />,
    episodes: [
      {
        id: 'marketing-1',
        title: 'Digital Marketing on a Startup Budget',
        description: 'Cost-effective marketing strategies that deliver real results without breaking the bank.',
        duration: 15 * 60,
        series: 'Marketing',
        seriesColor: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      },
      {
        id: 'marketing-2',
        title: 'Content Marketing That Converts',
        description: 'Create content that engages your audience and drives meaningful business results.',
        duration: 17 * 60,
        series: 'Marketing',
        seriesColor: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      },
      {
        id: 'marketing-3',
        title: 'Social Media Strategy for B2B',
        description: 'Build a professional social media presence that generates leads and builds authority.',
        duration: 14 * 60,
        series: 'Marketing',
        seriesColor: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      }
    ]
  },
  finance: {
    name: 'Finance',
    description: 'Financial fundamentals every entrepreneur needs to know to build a profitable and sustainable business.',
    totalEpisodes: 8,
    completedEpisodes: 0,
    totalDuration: '2.1h',
    difficulty: 'Intermediate',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    icon: <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
    episodes: [
      {
        id: 'finance-1',
        title: 'Cash Flow Crisis Management',
        description: 'Practical steps when money gets tight and how to navigate financial challenges successfully.',
        duration: 15 * 60,
        series: 'Finance',
        seriesColor: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
      },
      {
        id: 'finance-2',
        title: 'Funding Options for Startups',
        description: 'Explore different funding strategies from bootstrapping to venture capital and everything in between.',
        duration: 19 * 60,
        series: 'Finance',
        seriesColor: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
      },
      {
        id: 'finance-3',
        title: 'Financial Planning for Growth',
        description: 'Build financial models and plans that support sustainable business growth and expansion.',
        duration: 16 * 60,
        series: 'Finance',
        seriesColor: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
      }
    ]
  },
  leadership: {
    name: 'Leadership',
    description: 'Develop the leadership skills needed to build high-performing teams and drive organizational success.',
    totalEpisodes: 12,
    completedEpisodes: 2,
    totalDuration: '3.5h',
    difficulty: 'Advanced',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    icon: <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
    episodes: [
      {
        id: 'leadership-1',
        title: 'Building Team Culture Remotely',
        description: 'Leadership tactics for distributed teams and creating strong company culture in a remote-first world.',
        duration: 15 * 60,
        series: 'Leadership',
        seriesColor: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
      },
      {
        id: 'leadership-2',
        title: 'Hiring Your First Employees',
        description: 'Navigate the challenges of hiring when resources are limited and every hire is critical.',
        duration: 18 * 60,
        series: 'Leadership',
        seriesColor: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
      },
      {
        id: 'leadership-3',
        title: 'Difficult Conversations Made Easy',
        description: 'Master the art of having challenging conversations that build stronger relationships and better outcomes.',
        duration: 16 * 60,
        series: 'Leadership',
        seriesColor: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
      }
    ]
  }
}

interface SeriesPageProps {
  seriesSlug: string
}

export function SeriesPage({ seriesSlug }: SeriesPageProps) {
  const [, setLocation] = useLocation()
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [showEpisodeModal, setShowEpisodeModal] = useState(false)

  const series = seriesData[seriesSlug]
  
  if (!series) {
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

  const handleEpisodeClick = (episode: Episode) => {
    setSelectedEpisode(episode)
    setShowEpisodeModal(true)
  }

  const completedEpisodeIds = new Set(['strategy-1', 'marketing-1', 'marketing-2', 'marketing-3', 'leadership-1', 'leadership-2'])
  const progressPercentage = (series.completedEpisodes / series.totalEpisodes) * 100

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  const statCards = [
    createStatCard(
      'episodes',
      'Total Episodes',
      series.totalEpisodes,
      'Episodes Available',
      <Mic className="w-6 h-6 text-white" />,
      'blue'
    ),
    createStatCard(
      'completed',
      'Completed',
      series.completedEpisodes,
      'Episodes Finished',
      <CheckCircle2 className="w-6 h-6 text-white" />,
      'green'
    ),
    createStatCard(
      'duration',
      'Total Duration',
      series.totalDuration,
      'Hours of Content',
      <Clock className="w-6 h-6 text-white" />,
      'purple'
    ),
    createStatCard(
      'difficulty',
      'Difficulty',
      series.difficulty,
      'Skill Level',
      <Award className="w-6 h-6 text-white" />,
      'orange'
    )
  ]

  return (
    <>
      <StandardPageLayout
        title={series.name}
        subtitle={series.description}
        searchPlaceholder={`Search ${series.name} episodes...`}
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
          <Card className={`${series.bgColor} border-2`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 ${series.bgColor} rounded-lg`}>
                    {series.icon}
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold ${series.color}`}>
                      {series.name} Series Progress
                    </h3>
                    <p className={`text-sm ${series.color} opacity-80`}>
                      {series.completedEpisodes} of {series.totalEpisodes} episodes completed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${series.color}`}>
                    {Math.round(progressPercentage)}%
                  </div>
                  <div className={`text-sm ${series.color} opacity-80`}>Complete</div>
                </div>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </CardContent>
          </Card>
        </div>

        {/* Episodes List */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">Episodes</h2>
          <AnimatedGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.1}>
            {series.episodes.map((episode, index) => {
              const isCompleted = completedEpisodeIds.has(episode.id)
              
              return (
                <AnimatedItem key={episode.id}>
                  <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            Episode {index + 1}
                          </Badge>
                          {isCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-lg text-slate-900 dark:text-white">
                        {episode.title}
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">
                        {episode.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(episode.duration)}
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1 text-yellow-500" />
                          4.{8 + index} ({120 + index * 15})
                        </div>
                      </div>
                      
                      {isCompleted && (
                        <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800 dark:text-green-200">
                              Completed
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => handleEpisodeClick(episode)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isCompleted ? 'Listen Again' : 'Listen Now'}
                      </Button>
                    </CardContent>
                  </Card>
                </AnimatedItem>
              )
            })}
          </AnimatedGrid>
        </div>

        {/* Coming Soon Episodes */}
        {series.episodes.length < series.totalEpisodes && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Coming Soon</h3>
            <Card className="bg-slate-50 dark:bg-slate-800/50 border-dashed border-2 border-slate-300 dark:border-slate-600">
              <CardContent className="p-8 text-center">
                <Mic className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  More Episodes Coming Soon
                </h4>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  We're working on {series.totalEpisodes - series.episodes.length} more episodes for the {series.name} series.
                </p>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Stay Tuned
                </Badge>
              </CardContent>
            </Card>
          </div>
        )}
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