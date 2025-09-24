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
import { useToast } from "@/hooks/use-toast"
import { extractMediaDuration, formatDurationDisplay, isMediaFile } from "@/utils/mediaUtils"
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
  Clock,
  MoreVertical,
  Edit3,
  AlertTriangle,
  Shield,
  Save
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
      const response = await fetch('/api/podcast/episodes')
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch episodes')
      }
      
      const data = await response.json()
      return data.episodes?.map((episode: any) => ({
        ...episode,
        is_published: true, // Default since we removed this field
        view_count: 0 // We'll add this later if needed
      })) || []
    },
    refetchInterval: 60000 // Refresh every minute
  })

  // Note: Removed toggle publish functionality since is_published field was removed

  // Delete episode
  const deleteEpisodeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/podcast/episodes/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete episode')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-episodes'] })
    }
  })


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
          <TabsTrigger value="footer-content" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Footer Content
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

        <TabsContent value="footer-content">
          <FooterContentManagement />
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

interface RenameDialogProps {
  isOpen: boolean
  onClose: () => void
  currentName: string
  onRename: (newName: string) => void
  isLoading: boolean
}

function RenameDialog({ isOpen, onClose, currentName, onRename, isLoading }: RenameDialogProps) {
  const [newName, setNewName] = useState('')
  
  useEffect(() => {
    if (isOpen) {
      // Extract filename without extension for editing
      const nameWithoutExt = currentName.replace(/\.[^/.]+$/, '')
      setNewName(nameWithoutExt)
    }
  }, [isOpen, currentName])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newName.trim() && newName !== currentName.replace(/\.[^/.]+$/, '')) {
      // Add back the original extension
      const extension = currentName.split('.').pop()
      const newFullName = `${newName.trim()}.${extension}`
      onRename(newFullName)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename File</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filename">File Name</Label>
            <Input
              id="filename"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new filename"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Extension will be preserved: .{currentName.split('.').pop()}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !newName.trim()}>
              {isLoading ? 'Renaming...' : 'Rename'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FileBrowser({ onSelectFile, fileType, currentValue }: FileBrowserProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFileKey, setSelectedFileKey] = useState<string | null>(null)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
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
  
  const handleRename = async (newName: string) => {
    if (!selectedFileKey) return
    
    setIsRenaming(true)
    try {
      const directory = selectedFileKey.includes('/') ? selectedFileKey.substring(0, selectedFileKey.lastIndexOf('/') + 1) : ''
      const newKey = directory + newName
      
      await r2Service.renameFile(selectedFileKey, newKey)
      
      // Refresh the file list
      queryClient.invalidateQueries({ queryKey: ['r2-files'] })
      
      toast({
        title: "File renamed",
        description: `Successfully renamed to ${newName}`,
      })
      
      setIsRenameOpen(false)
      setSelectedFileKey(null)
    } catch (error) {
      toast({
        title: "Failed to rename file",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      })
    } finally {
      setIsRenaming(false)
    }
  }
  
  const handleDelete = async () => {
    if (!selectedFileKey) return
    
    setIsDeleting(true)
    try {
      await r2Service.deleteFile(selectedFileKey)
      
      // Refresh the file list
      queryClient.invalidateQueries({ queryKey: ['r2-files'] })
      
      toast({
        title: "File deleted",
        description: "File has been successfully deleted",
      })
      
      setIsDeleteOpen(false)
      setSelectedFileKey(null)
    } catch (error) {
      toast({
        title: "Failed to delete file",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
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
                  className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          onSelectFile(getPublicUrl(file.key))
                          setIsOpen(false)
                        }}
                      >
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
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedFileKey(file.key)
                              setIsRenameOpen(true)
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedFileKey(file.key)
                              setIsDeleteOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
      
      <RenameDialog
        isOpen={isRenameOpen}
        onClose={() => {
          setIsRenameOpen(false)
          setSelectedFileKey(null)
        }}
        currentName={selectedFileKey ? selectedFileKey.split('/').pop() || '' : ''}
        onRename={handleRename}
        isLoading={isRenaming}
      />
      
      <Dialog open={isDeleteOpen} onOpenChange={() => {
        setIsDeleteOpen(false)
        setSelectedFileKey(null)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete File
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong>{selectedFileKey?.split('/').pop()}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDeleteOpen(false)
                  setSelectedFileKey(null)
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
    audio_url: episode?.audio_url || ''
  })
  
  const [isDetectingDuration, setIsDetectingDuration] = useState(false)
  const [detectedFromFile, setDetectedFromFile] = useState<string | null>(null)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Handle file selection for audio
  const handleAudioFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!isMediaFile(file)) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid audio file",
        variant: "destructive"
      })
      return
    }
    
    await extractDurationFromFile(file, 'audio')
  }
  
  // Handle file selection for video
  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!isMediaFile(file)) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid video file",
        variant: "destructive"
      })
      return
    }
    
    await extractDurationFromFile(file, 'video')
  }
  
  // Extract duration from uploaded file
  const extractDurationFromFile = async (file: File, type: 'audio' | 'video') => {
    setIsDetectingDuration(true)
    setDetectedFromFile(null)
    
    try {
      const duration = await extractMediaDuration(file)
      setFormData(prev => ({ ...prev, duration }))
      setDetectedFromFile(type)
      
      toast({
        title: "Duration detected",
        description: `Automatically detected duration: ${formatDurationDisplay(duration)}`,
      })
    } catch (error) {
      console.error('Error extracting duration:', error)
      toast({
        title: "Could not detect duration",
        description: "Please enter the duration manually",
        variant: "destructive"
      })
    } finally {
      setIsDetectingDuration(false)
    }
  }
  
  // Detect duration from URL (for existing files)
  const detectDurationFromUrl = async (url: string, type: 'audio' | 'video') => {
    if (!url) return
    
    setIsDetectingDuration(true)
    setDetectedFromFile(null)
    
    try {
      // Create a temporary media element to load the URL and get duration
      const mediaElement = type === 'video' ? document.createElement('video') : document.createElement('audio')
      mediaElement.crossOrigin = 'anonymous'
      
      const duration = await new Promise<number>((resolve, reject) => {
        const onLoadedMetadata = () => {
          const duration = mediaElement.duration
          cleanup()
          if (isFinite(duration) && duration > 0) {
            resolve(Math.round(duration))
          } else {
            reject(new Error('Could not determine duration'))
          }
        }
        
        const onError = () => {
          cleanup()
          reject(new Error('Failed to load media'))
        }
        
        const cleanup = () => {
          mediaElement.removeEventListener('loadedmetadata', onLoadedMetadata)
          mediaElement.removeEventListener('error', onError)
        }
        
        mediaElement.addEventListener('loadedmetadata', onLoadedMetadata)
        mediaElement.addEventListener('error', onError)
        mediaElement.src = url
        mediaElement.load()
        
        // Timeout after 5 seconds
        setTimeout(() => {
          cleanup()
          reject(new Error('Timeout'))
        }, 5000)
      })
      
      setFormData(prev => ({ ...prev, duration }))
      setDetectedFromFile(type)
      
      toast({
        title: "Duration detected",
        description: `Automatically detected duration: ${formatDurationDisplay(duration)}`,
      })
    } catch (error) {
      console.error('Error detecting duration from URL:', error)
      // Don't show error toast for URL detection failures as they're common
    } finally {
      setIsDetectingDuration(false)
    }
  }

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (episode) {
        // Update existing episode
        const response = await fetch(`/api/podcast/episodes/${episode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update episode')
        }
        
        return response.json()
      } else {
        // Create new episode
        const response = await fetch('/api/podcast/episodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create episode')
        }
        
        return response.json()
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-episodes'] })
      onClose()
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
          <div className="flex items-center gap-2">
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className={detectedFromFile ? 'bg-green-50 border-green-200' : ''}
              required
            />
            {isDetectingDuration && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Detecting...
              </div>
            )}
            {detectedFromFile && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Auto-detected from {detectedFromFile}
              </Badge>
            )}
          </div>
          {detectedFromFile && (
            <p className="text-xs text-green-600">
              Duration automatically detected: {formatDurationDisplay(formData.duration)}
            </p>
          )}
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
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <FileBrowser 
                fileType="audio"
                currentValue={formData.audio_url}
                onSelectFile={async (url) => {
                  setFormData(prev => ({ ...prev, audio_url: url }))
                  await detectDurationFromUrl(url, 'audio')
                }}
              />
              <div className="flex flex-col">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileSelect}
                  className="hidden"
                  id="audio-file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="text-orange-700 border-orange-200 hover:bg-orange-50"
                  onClick={() => document.getElementById('audio-file-upload')?.click()}
                >
                  Upload New
                </Button>
              </div>
            </div>
            {formData.audio_url && (
              <div className="text-xs text-gray-500 truncate">
                {formData.audio_url}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Video File (optional)</Label>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <FileBrowser 
                fileType="video"
                currentValue={formData.video_url}
                onSelectFile={async (url) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    video_url: url,
                    has_video: !!url
                  }))
                  await detectDurationFromUrl(url, 'video')
                }}
              />
              <div className="flex flex-col">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileSelect}
                  className="hidden"
                  id="video-file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="text-orange-700 border-orange-200 hover:bg-orange-50"
                  onClick={() => document.getElementById('video-file-upload')?.click()}
                >
                  Upload New
                </Button>
              </div>
            </div>
            {formData.video_url && (
              <div className="text-xs text-gray-500 truncate">
                {formData.video_url}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving...' : episode ? 'Update' : 'Create'} Episode
        </Button>
      </div>
    </form>
  )
}

// Footer Content Management Component
interface FooterContent {
  id: string
  type: 'privacy' | 'terms' | 'contact'
  title: string
  content: string
  is_published: boolean
  created_at: string
  updated_at: string
}

function FooterContentManagement() {
  const [selectedContent, setSelectedContent] = useState<FooterContent | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ title: '', content: '', is_published: true })
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch footer content for admin
  const { data: footerContent, isLoading } = useQuery({
    queryKey: ['admin-footer-content'],
    queryFn: async () => {
      const response = await fetch('/api/footer-content/admin')
      if (!response.ok) {
        throw new Error('Failed to fetch footer content')
      }
      const result = await response.json()
      return result.content || []
    },
  })

  // Update footer content mutation
  const updateContentMutation = useMutation({
    mutationFn: async ({ type, data }: { type: string, data: any }) => {
      const response = await fetch(`/api/footer-content/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update content')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-footer-content'] })
      toast({
        title: "Content Updated",
        description: "Footer content has been successfully updated.",
      })
      setIsEditing(false)
      setSelectedContent(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update content",
        variant: "destructive",
      })
    }
  })

  const handleEdit = (content: FooterContent) => {
    setSelectedContent(content)
    setEditData({
      title: content.title,
      content: content.content,
      is_published: content.is_published
    })
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!selectedContent) return
    
    updateContentMutation.mutate({
      type: selectedContent.type,
      data: editData
    })
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'privacy':
        return <Shield className="w-5 h-5 text-blue-600" />
      case 'terms':
        return <FileText className="w-5 h-5 text-orange-600" />
      case 'contact':
        return <Eye className="w-5 h-5 text-green-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  const getDefaultContent = (type: string) => {
    const defaults = {
      privacy: { title: 'Privacy Policy', content: 'Privacy policy content...' },
      terms: { title: 'Terms of Service', content: 'Terms of service content...' },
      contact: { title: 'Contact Us', content: 'Contact information...' }
    }
    return defaults[type as keyof typeof defaults] || { title: type, content: 'Content...' }
  }

  // Ensure all three types are represented
  const allContentTypes = ['privacy', 'terms', 'contact']
  const contentWithDefaults = allContentTypes.map(type => {
    const existing = footerContent?.find((c: FooterContent) => c.type === type)
    if (existing) return existing
    
    const defaultContent = getDefaultContent(type)
    return {
      id: `default-${type}`,
      type,
      title: defaultContent.title,
      content: defaultContent.content,
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Footer Content Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {contentWithDefaults.map((content) => (
                <Card key={content.type} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getContentTypeIcon(content.type)}
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {content.title}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                            {content.type} content
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={content.is_published ? 'default' : 'secondary'}>
                          {content.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(content)}
                          data-testid={`button-edit-${content.type}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                        {content.content.substring(0, 120)}...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedContent && getContentTypeIcon(selectedContent.type)}
              Edit {selectedContent?.type.charAt(0).toUpperCase()}{selectedContent?.type.slice(1)} Content
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title"
                data-testid="input-content-title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editData.content}
                onChange={(e) => setEditData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter content (supports markdown formatting)"
                className="min-h-[400px] font-mono"
                data-testid="textarea-content"
              />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Supports basic markdown: # for headings, ** for bold, * for italic, - for lists
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_published"
                checked={editData.is_published}
                onChange={(e) => setEditData(prev => ({ ...prev, is_published: e.target.checked }))}
                className="rounded"
                data-testid="checkbox-published"
              />
              <Label htmlFor="is_published">Published (visible to users)</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateContentMutation.isPending}
              data-testid="button-save-content"
            >
              {updateContentMutation.isPending ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}