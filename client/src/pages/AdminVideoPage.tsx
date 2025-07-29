import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Video, Clock, Upload } from 'lucide-react'
// Admin video management page
import { usePodcastEpisodes } from '@/hooks/usePodcastProgress'
import { VideoUploadModal } from '@/components/podcast/VideoUploadModal'

export function AdminVideoPage() {
  const { data: episodes, isLoading, refetch } = usePodcastEpisodes()

  const videoEpisodes = episodes?.filter(ep => ep.has_video) || []
  const audioOnlyEpisodes = episodes?.filter(ep => !ep.has_video) || []

  const handleVideoUploaded = () => {
    refetch()
  }

  const statCards = [
    {
      title: 'Total Episodes',
      value: episodes?.length || 0,
      subtitle: 'All podcast episodes',
      icon: <Video className="w-6 h-6 text-white" />,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Video Episodes',
      value: videoEpisodes.length,
      subtitle: 'Episodes with video',
      icon: <Video className="w-6 h-6 text-white" />,
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Audio Only',
      value: audioOnlyEpisodes.length,
      subtitle: 'Audio-only episodes',
      icon: <Upload className="w-6 h-6 text-white" />,
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Storage Used',
      value: '2.3 GB',
      subtitle: 'Video storage in R2',
      icon: <Upload className="w-6 h-6 text-white" />,
      gradient: 'from-purple-500 to-purple-600'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Video Management
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
            Upload and manage video/audio content for learning episodes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className={`bg-gradient-to-br ${card.gradient} p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white/90 text-sm font-medium">{card.title}</h3>
                  <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                  <p className="text-white/80 text-xs mt-1">{card.subtitle}</p>
                </div>
                <div className="text-white/80">
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      <div className="space-y-8">
        {/* Audio-Only Episodes (Upload Video) */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
            Audio-Only Episodes
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Upload video content for these episodes to enable video streaming
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {audioOnlyEpisodes.map((episode) => (
              <Card key={episode.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-slate-900 dark:text-white">
                        {episode.title}
                      </CardTitle>
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 mt-2">
                        <Clock className="w-4 h-4 mr-1" />
                        {Math.round(episode.duration / 60)} min
                      </div>
                    </div>
                    <Badge variant="secondary" className={episode.series_color}>
                      {episode.series}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {episode.description?.substring(0, 100)}...
                  </p>
                  <VideoUploadModal
                    episodeId={episode.id}
                    episodeTitle={episode.title}
                    hasVideo={false}
                    onVideoUploaded={handleVideoUploaded}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Video Episodes (Manage) */}
        {videoEpisodes.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              Video Episodes
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Episodes with video content available for streaming
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoEpisodes.map((episode) => (
                <Card key={episode.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-slate-900 dark:text-white">
                          {episode.title}
                        </CardTitle>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <Clock className="w-4 h-4 mr-1" />
                            {Math.round(episode.duration / 60)} min
                          </div>
                          <div className="flex items-center text-green-600">
                            <Video className="w-4 h-4 mr-1" />
                            <span className="text-xs">Video</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className={episode.series_color}>
                        {episode.series}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {episode.description?.substring(0, 100)}...
                    </p>
                    <VideoUploadModal
                      episodeId={episode.id}
                      episodeTitle={episode.title}
                      hasVideo={true}
                      onVideoUploaded={handleVideoUploaded}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}