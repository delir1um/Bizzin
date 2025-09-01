import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Upload,
  FileText,
  Video,
  Headphones,
  BarChart3,
  Eye,
  Calendar,
  Clock
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { r2Service } from "@/lib/cloudflareR2Service"
import { format } from "date-fns"

interface PodcastEpisode {
  id: string
  title: string
  description: string
  series: string
  episode_number: number
  duration: number
  has_video: boolean
  video_url: string | null
  audio_url: string | null
  is_published: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export function AdminContentManagement() {
  const [selectedEpisode, setSelectedEpisode] = useState<PodcastEpisode | null>(null)
  const [isAddingEpisode, setIsAddingEpisode] = useState(false)
  const queryClient = useQueryClient()

  // Fetch podcast episodes
  const { data: episodes, isLoading } = useQuery({
    queryKey: ['admin-episodes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('podcast_episodes')
        .select(`
          id,
          title,
          description,
          series,
          episode_number,
          duration,
          has_video,
          video_url,
          audio_url,
          is_published,
          created_at,
          updated_at,
          podcast_progress(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data?.map(episode => ({
        ...episode,
        view_count: Array.isArray(episode.podcast_progress) ? episode.podcast_progress.length : 0
      })) || []
    },
    refetchInterval: 60000 // Refresh every minute
  })

  // Toggle episode publish status
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('podcast_episodes')
        .update({ is_published })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-episodes'] })
    }
  })

  // Delete episode
  const deleteEpisodeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('podcast_episodes')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-episodes'] })
    }
  })

  const handleTogglePublish = (episode: PodcastEpisode) => {
    togglePublishMutation.mutate({
      id: episode.id,
      is_published: !episode.is_published
    })
  }

  const handleDeleteEpisode = (id: string) => {
    if (confirm('Are you sure you want to delete this episode?')) {
      deleteEpisodeMutation.mutate(id)
    }
  }

  // Calculate content stats
  const stats = episodes ? {
    total: episodes.length,
    published: episodes.filter(e => e.is_published).length,
    draft: episodes.filter(e => !e.is_published).length,
    totalViews: episodes.reduce((sum, e) => sum + e.view_count, 0),
    seriesCount: new Set(episodes.map(e => e.series)).size
  } : { total: 0, published: 0, draft: 0, totalViews: 0, seriesCount: 0 }

  return (
    <div className="space-y-6">
      {/* Content Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Episodes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Series</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.seriesCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Management Tabs */}
      <Tabs defaultValue="episodes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="episodes" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Podcast Episodes
          </TabsTrigger>
          <TabsTrigger value="calculators" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Business Calculators
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="episodes" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Podcast Episodes</CardTitle>
              <Dialog open={isAddingEpisode} onOpenChange={setIsAddingEpisode}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Episode
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Episode</DialogTitle>
                  </DialogHeader>
                  <EpisodeForm onClose={() => setIsAddingEpisode(false)} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Episode</TableHead>
                        <TableHead>Series</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {episodes?.map((episode) => (
                        <TableRow key={episode.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{episode.title}</div>
                              <div className="text-sm text-muted-foreground">
                                Episode {episode.episode_number}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {episode.description}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant="outline">{episode.series}</Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {episode.has_video ? (
                                <div className="flex items-center gap-1 text-orange-600">
                                  <Video className="w-4 h-4" />
                                  <span className="text-xs">Video</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Headphones className="w-4 h-4" />
                                  <span className="text-xs">Audio</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant={episode.is_published ? 'default' : 'secondary'}>
                              {episode.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div>{episode.view_count} views</div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {Math.round(episode.duration / 60)}min
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(episode.created_at), 'MMM d, yyyy')}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleTogglePublish(episode)}
                              >
                                {episode.is_published ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </Button>
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => setSelectedEpisode(episode)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Edit Episode</DialogTitle>
                                  </DialogHeader>
                                  {selectedEpisode && (
                                    <EpisodeForm 
                                      episode={selectedEpisode} 
                                      onClose={() => setSelectedEpisode(null)} 
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteEpisode(episode.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculators">
          <Card>
            <CardHeader>
              <CardTitle>Business Calculators</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Calculator management interface would be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>System Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Announcement management interface would be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface R2File {
  key: string
  size: number
  lastModified: Date
  contentType?: string
}

interface FileBrowserProps {
  onSelectFile: (fileUrl: string) => void
  fileType: 'audio' | 'video'
  currentValue?: string
}

function FileBrowser({ onSelectFile, fileType, currentValue }: FileBrowserProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const { data: r2Files, isLoading } = useQuery({
    queryKey: ['r2-files'],
    queryFn: () => r2Service.listFiles(),
    enabled: isOpen
  })
  
  const filteredFiles = r2Files?.files.filter(file => {
    const extension = file.key.split('.').pop()?.toLowerCase()
    if (fileType === 'audio') {
      return ['mp3', 'wav', 'aac', 'm4a'].includes(extension || '')
    }
    if (fileType === 'video') {
      return ['mp4', 'webm', 'mov', 'avi'].includes(extension || '')
    }
    return false
  }) || []
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const getPublicUrl = (key: string) => {
    return `https://${import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_DOMAIN}/${key}`
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          {currentValue ? `Selected: ${currentValue.split('/').pop()}` : `Browse ${fileType} files`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select {fileType === 'audio' ? 'Audio' : 'Video'} File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              ))}
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">No {fileType} files found in storage</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredFiles.map((file) => (
                <Card 
                  key={file.key} 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => {
                    onSelectFile(getPublicUrl(file.key))
                    setIsOpen(false)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{file.key.split('/').pop()}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {formatFileSize(file.size)} • {format(new Date(file.lastModified), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {fileType === 'video' ? (
                          <Video className="w-5 h-5 text-orange-600" />
                        ) : (
                          <Headphones className="w-5 h-5 text-blue-600" />
                        )}
                        <Badge variant="outline">
                          {file.key.split('.').pop()?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface EpisodeFormProps {
  episode?: PodcastEpisode
  onClose: () => void
}

function EpisodeForm({ episode, onClose }: EpisodeFormProps) {
  const [formData, setFormData] = useState({
    title: episode?.title || '',
    description: episode?.description || '',
    series: episode?.series || 'The Journey',
    episode_number: episode?.episode_number || 1,
    duration: episode?.duration || 900,
    has_video: episode?.has_video || false,
    video_url: episode?.video_url || '',
    audio_url: episode?.audio_url || '',
    is_published: episode?.is_published || false
  })

  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('Submitting episode data:', data)
      
      if (episode) {
        // Update existing episode
        const { error } = await supabase
          .from('podcast_episodes')
          .update(data)
          .eq('id', episode.id)
        
        if (error) {
          console.error('Update error:', error)
          throw error
        }
      } else {
        // Create new episode
        const { data: result, error } = await supabase
          .from('podcast_episodes')
          .insert([data])
          .select()
        
        if (error) {
          console.error('Insert error:', error)
          throw error
        }
        
        console.log('Episode created successfully:', result)
      }
    },
    onSuccess: () => {
      console.log('Episode saved successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-episodes'] })
      onClose()
    },
    onError: (error) => {
      console.error('Save mutation error:', error)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="series">Series</Label>
          <Select value={formData.series} onValueChange={(value) => setFormData(prev => ({ ...prev, series: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="The Journey">The Journey</SelectItem>
              <SelectItem value="Self-Development">Self-Development</SelectItem>
              <SelectItem value="Leadership">Leadership</SelectItem>
              <SelectItem value="Strategy">Strategy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="episode_number">Episode Number</Label>
          <Input
            id="episode_number"
            type="number"
            value={formData.episode_number}
            onChange={(e) => setFormData(prev => ({ ...prev, episode_number: parseInt(e.target.value) }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (seconds)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Audio File</Label>
          <div className="space-y-2">
            <FileBrowser 
              fileType="audio"
              currentValue={formData.audio_url}
              onSelectFile={(url) => setFormData(prev => ({ ...prev, audio_url: url }))}
            />
            <Input
              placeholder="Or enter audio URL manually"
              value={formData.audio_url}
              onChange={(e) => setFormData(prev => ({ ...prev, audio_url: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Video File (optional)</Label>
          <div className="space-y-2">
            <FileBrowser 
              fileType="video"
              currentValue={formData.video_url}
              onSelectFile={(url) => setFormData(prev => ({ 
                ...prev, 
                video_url: url,
                has_video: !!url
              }))}
            />
            <Input
              placeholder="Or enter video URL manually"
              value={formData.video_url}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                video_url: e.target.value,
                has_video: !!e.target.value
              }))}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_published}
            onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
          />
          Publish immediately
        </Label>
        
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : episode ? 'Update' : 'Create'} Episode
          </Button>
        </div>
      </div>
    </form>
  )
}