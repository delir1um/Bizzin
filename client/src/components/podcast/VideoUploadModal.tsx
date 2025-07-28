import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PodcastService } from '@/lib/podcastService'
import { Upload, Video, X, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface VideoUploadModalProps {
  episodeId: string
  episodeTitle: string
  hasVideo: boolean
  onVideoUploaded: () => void
}

export function VideoUploadModal({ episodeId, episodeTitle, hasVideo, onVideoUploaded }: VideoUploadModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate video file type
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg']
      if (validTypes.includes(file.type)) {
        setVideoFile(file)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a valid video file (MP4, WebM, or OGG)",
          variant: "destructive"
        })
      }
    }
  }

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate image file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (validTypes.includes(file.type)) {
        setThumbnailFile(file)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file (JPEG, PNG, or WebP)",
          variant: "destructive"
        })
      }
    }
  }

  const handleUpload = async () => {
    if (!videoFile) {
      toast({
        title: "No video file selected",
        description: "Please select a video file to upload",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 500)

      await PodcastService.uploadEpisodeVideo(episodeId, videoFile, thumbnailFile || undefined)
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      toast({
        title: "Video uploaded successfully",
        description: "The video has been uploaded and is now available for streaming"
      })

      onVideoUploaded()
      setIsOpen(false)
      
      // Reset form
      setVideoFile(null)
      setThumbnailFile(null)
      setUploadProgress(0)
      
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveVideo = async () => {
    if (!hasVideo) return

    setUploading(true)
    try {
      await PodcastService.removeEpisodeVideo(episodeId)
      
      toast({
        title: "Video removed",
        description: "The video has been removed from this episode"
      })

      onVideoUploaded()
      setIsOpen(false)
      
    } catch (error) {
      console.error('Remove error:', error)
      toast({
        title: "Failed to remove video",
        description: error instanceof Error ? error.message : "Failed to remove video",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={hasVideo ? "secondary" : "outline"} 
          size="sm"
          className="flex items-center gap-2"
        >
          <Video className="w-4 h-4" />
          {hasVideo ? "Manage Video" : "Add Video"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            {hasVideo ? "Manage Video" : "Upload Video"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Episode</Label>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{episodeTitle}</p>
          </div>

          {hasVideo && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Video already uploaded</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                This episode has video content available
              </p>
            </div>
          )}

          {!uploading && (
            <>
              <div className="space-y-2">
                <Label htmlFor="video-file">Video File *</Label>
                <Input
                  id="video-file"
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  onChange={handleVideoFileChange}
                  disabled={uploading}
                />
                {videoFile && (
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Selected: {videoFile.name} ({formatFileSize(videoFile.size)})
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail-file">Thumbnail (Optional)</Label>
                <Input
                  id="thumbnail-file"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleThumbnailFileChange}
                  disabled={uploading}
                />
                {thumbnailFile && (
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Selected: {thumbnailFile.name} ({formatFileSize(thumbnailFile.size)})
                  </div>
                )}
              </div>
            </>
          )}

          {uploading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                <span className="text-sm">Uploading video to Cloudflare R2...</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                {uploadProgress}% complete
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {!hasVideo ? (
              <Button 
                onClick={handleUpload} 
                disabled={!videoFile || uploading}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {uploading ? "Uploading..." : "Upload Video"}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleUpload} 
                  disabled={!videoFile || uploading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {uploading ? "Updating..." : "Update Video"}
                </Button>
                <Button 
                  onClick={handleRemoveVideo} 
                  disabled={uploading}
                  variant="destructive"
                >
                  Remove
                </Button>
              </>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>• Supported video formats: MP4, WebM, OGG</p>
            <p>• Supported thumbnail formats: JPEG, PNG, WebP</p>
            <p>• Videos are stored in Cloudflare R2 for optimal streaming</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}