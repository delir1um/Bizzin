import React, { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Clock, 
  Star, 
  Users,
  Award,
  TrendingUp,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'
import { Episode, PodcastPlayer } from './PodcastPlayer'

interface EpisodeModalProps {
  episode: Episode | null
  isOpen: boolean
  onClose: () => void
}

// Mock related episodes
const getRelatedEpisodes = (currentEpisode: Episode) => [
  {
    id: 'related-1',
    title: 'Market Research on a Budget',
    duration: 12 * 60,
    series: currentEpisode.series,
    completed: true
  },
  {
    id: 'related-2', 
    title: 'Customer Validation Techniques',
    duration: 18 * 60,
    series: currentEpisode.series,
    completed: false
  },
  {
    id: 'related-3',
    title: 'MVP Development Strategy',
    duration: 15 * 60,
    series: currentEpisode.series,
    completed: false
  }
]

export function EpisodeModal({ episode, isOpen, onClose }: EpisodeModalProps) {
  const [showPlayer, setShowPlayer] = useState(false)

  if (!episode) return null

  const handlePlayEpisode = () => {
    setShowPlayer(true)
  }

  const handleClosePlayer = () => {
    setShowPlayer(false)
  }

  const relatedEpisodes = getRelatedEpisodes(episode)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="secondary" 
                    className={`${episode.seriesColor} text-white`}
                  >
                    {episode.series}
                  </Badge>
                  <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDuration(episode.duration)}
                  </div>
                </div>
                <DialogTitle className="text-2xl mb-3">{episode.title}</DialogTitle>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {episode.description}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Play Button */}
            <div className="flex justify-center">
              <Button
                onClick={handlePlayEpisode}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3"
              >
                <Play className="w-5 h-5 mr-2" />
                Listen Now
              </Button>
            </div>

            <Separator />

            {/* Episode Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Practical Insights</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Actionable business strategies you can implement today
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Expert Guidance</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Learn from successful entrepreneurs and industry leaders
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="p-4 text-center">
                  <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">15-Minute Format</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Perfect for busy schedules and focused learning
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Key Takeaways */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Key Takeaways</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 dark:text-orange-400 text-sm font-bold">1</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    Understand the essential components of a viable business model
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 dark:text-orange-400 text-sm font-bold">2</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    Learn rapid validation techniques to test your ideas quickly
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 dark:text-orange-400 text-sm font-bold">3</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    Discover common pitfalls and how to avoid them in early stages
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Related Episodes */}
            <div>
              <h3 className="text-lg font-semibold mb-4">More from {episode.series} Series</h3>
              <div className="space-y-3">
                {relatedEpisodes.map((relatedEpisode) => (
                  <Card key={relatedEpisode.id} className="border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          {relatedEpisode.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-slate-300 rounded-full" />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              {relatedEpisode.title}
                            </h4>
                            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatDuration(relatedEpisode.duration)}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Series Progress */}
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                      {episode.series} Series Progress
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      1 of 12 episodes completed
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">8%</div>
                    <div className="text-xs text-orange-600">Complete</div>
                  </div>
                </div>
                <div className="mt-3 w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{ width: '8%' }}></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Podcast Player */}
      {showPlayer && (
        <PodcastPlayer
          episode={episode}
          onClose={handleClosePlayer}
          autoPlay={true}
        />
      )}
    </>
  )
}