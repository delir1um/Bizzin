import React, { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
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
import { usePodcastEpisodes, useSeriesProgress, useCompletedEpisodes, usePodcastProgress } from '@/hooks/usePodcastProgress'

interface EpisodeModalProps {
  episode: Episode | null
  isOpen: boolean
  onClose: () => void
}

// Get related episodes from database (other episodes in same series)
const useRelatedEpisodes = (currentEpisode: Episode) => {
  const { data: allEpisodes } = usePodcastEpisodes()
  const { data: completedEpisodes } = useCompletedEpisodes()
  
  if (!allEpisodes) return []
  
  return allEpisodes
    .filter(ep => ep.series === currentEpisode.series && ep.id !== currentEpisode.id)
    .slice(0, 3) // Limit to 3 related episodes
    .map(ep => ({
      id: ep.id,
      title: ep.title,
      duration: ep.duration,
      series: ep.series,
      completed: completedEpisodes?.some(completed => completed.episode_id === ep.id) || false
    }))
}

export function EpisodeModal({ episode, isOpen, onClose }: EpisodeModalProps) {
  const [showPlayer, setShowPlayer] = useState(false)

  // Get real data from database
  const { data: allEpisodes } = usePodcastEpisodes()
  const { data: completedEpisodes } = useCompletedEpisodes()
  const { data: allProgress } = usePodcastProgress()
  const relatedEpisodes = useRelatedEpisodes(episode || {} as Episode)

  if (!episode) return null

  const handlePlayEpisode = () => {
    setShowPlayer(true)
    onClose() // Close the modal when starting to play
  }

  const handleClosePlayer = () => {
    setShowPlayer(false)
  }

  // Calculate real series progress (same logic as SeriesPage)
  const seriesEpisodes = allEpisodes?.filter(ep => ep.series === episode.series) || []
  const seriesCompletedCount = completedEpisodes?.filter(ep => 
    ep.episode?.series === episode.series
  ).length || 0
  

  
  const seriesProgressPercentage = seriesEpisodes.length > 0 ? 
    Math.round((seriesCompletedCount / seriesEpisodes.length) * 100) : 0

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
                <DialogDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {episode.description}
                </DialogDescription>
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
            {episode.keyTakeaways && episode.keyTakeaways.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Key Takeaways</h3>
                <div className="space-y-3">
                  {episode.keyTakeaways.map((takeaway, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-orange-600 dark:text-orange-400 text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">
                        {takeaway}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Related Episodes */}
            {relatedEpisodes.length > 0 && (
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
            )}

            {/* Episode Progress */}
            {(() => {
              const episodeProgress = allProgress?.find(p => p.episode_id === episode.id)
              const isCompleted = completedEpisodes?.some(completed => completed.episode_id === episode.id)
              const hasProgress = episodeProgress && episodeProgress.progress_seconds > 0
              const progressPercentage = hasProgress ? Math.round((episodeProgress.progress_seconds / episode.duration) * 100) : 0
              
              if (hasProgress || isCompleted) {
                return (
                  <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                            Episode Progress
                          </h4>
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            {isCompleted ? 'Completed' : `${Math.round((episodeProgress?.progress_seconds || 0) / 60)} of ${Math.round(episode.duration / 60)} minutes`}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-600">{isCompleted ? 100 : progressPercentage}%</div>
                          <div className="text-xs text-orange-600">{isCompleted ? 'Complete' : 'Progress'}</div>
                        </div>
                      </div>
                      <div className="mt-3 w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${isCompleted ? 100 : progressPercentage}%` }}></div>
                      </div>
                    </CardContent>
                  </Card>
                )
              }
              
              // Show series progress if no individual progress
              return (
                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                          {episode.series} Series Progress
                        </h4>
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          {seriesCompletedCount} of {seriesEpisodes.length} episodes completed
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600">{seriesProgressPercentage}%</div>
                        <div className="text-xs text-orange-600">Complete</div>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${seriesProgressPercentage}%` }}></div>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Podcast Player */}
      {showPlayer && (() => {
        const episodeProgress = allProgress?.find(p => p.episode_id === episode.id)
        const startTime = episodeProgress?.progress_seconds || 0
        
        return (
          <PodcastPlayer
            episode={episode}
            onClose={handleClosePlayer}
            autoPlay={true}
            startTime={startTime}
          />
        )
      })()}
    </>
  )
}