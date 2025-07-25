import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Upload, File, Plus } from "lucide-react"
import { DocumentService } from "@/lib/services/document"
import { DOCUMENT_CATEGORIES, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "@/types/document"
import type { CreateDocumentRequest } from "@/types/document"
import { useToast } from "@/hooks/use-toast"
import { usePlans } from "@/hooks/usePlans"

const uploadSchema = z.object({
  name: z.string().min(1, "Document name is required").max(200, "Name must be less than 200 characters"),
  category: z.string().min(1, "Category is required"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
})

type FormData = z.infer<typeof uploadSchema>

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  stats?: any // Storage stats from parent
}

export function UploadModal({ isOpen, onClose, stats }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { hasStorageSpace, usageStatus, isLoading: plansLoading } = usePlans()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
    }
  })

  const uploadMutation = useMutation({
    mutationFn: async (request: CreateDocumentRequest) => {
      setIsUploading(true)
      setUploadProgress(0)
      
      return DocumentService.uploadDocumentWithProgress(request, (progress: number) => {
        setUploadProgress(progress)
      })
    },
    onSuccess: () => {
      setIsUploading(false)
      setUploadProgress(100)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] })
      toast({
        title: "Document uploaded",
        description: "Your document has been successfully uploaded.",
      })
      setTimeout(() => {
        handleClose()
      }, 500) // Small delay to show 100% progress
    },
    onError: (error: any) => {
      setIsUploading(false)
      setUploadProgress(0)
      // Check if it's an RLS policy error
      if (error.message?.includes('row-level security policy') || error.message?.includes('violates row-level security')) {
        toast({
          title: "Database Setup Required",
          description: "DocSafe tables need setup. Check DOCSAFE_SETUP_REQUIRED.md for 2-minute fix.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload document",
          variant: "destructive",
        })
      }
    },
  })

  const handleClose = () => {
    setSelectedFile(null)
    setTags([])
    setNewTag("")
    setUploadProgress(0)
    setIsUploading(false)
    reset()
    onClose()
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a supported file type (PDF, Word, Excel, PowerPoint, images, etc.)",
        variant: "destructive",
      })
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: `File size must be less than ${DocumentService.formatFileSize(MAX_FILE_SIZE)}`,
        variant: "destructive",
      })
      return
    }

    // Check storage space - use plan system if available, otherwise fallback to 50MB limit
    const storageCheckFailed = usageStatus ? 
      !hasStorageSpace(file.size) : 
      stats && (stats.storage_used + file.size) > (50 * 1024 * 1024) // 50MB fallback limit
    
    if (storageCheckFailed) {
      const remainingSpace = usageStatus ? 
        usageStatus.plan_limits.storage_limit - usageStatus.current_usage.storage_used : 
        Math.max(0, (50 * 1024 * 1024) - (stats?.storage_used || 0))
      
      toast({
        title: "Storage limit exceeded",
        description: `Not enough storage space. You have ${DocumentService.formatFileSize(remainingSpace)} remaining. Upgrade to premium for more storage.`,
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    
    // Auto-populate name if not set
    if (!watch("name")) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
      setValue("name", nameWithoutExt)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const onSubmit = (data: FormData) => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    // Final storage check before upload
    const finalStorageCheckFailed = usageStatus ? 
      !hasStorageSpace(selectedFile.size) : 
      stats && (stats.storage_used + selectedFile.size) > (50 * 1024 * 1024) // 50MB fallback limit
    
    if (finalStorageCheckFailed) {
      const remainingSpace = usageStatus ? 
        usageStatus.plan_limits.storage_limit - usageStatus.current_usage.storage_used : 
        Math.max(0, (50 * 1024 * 1024) - (stats?.storage_used || 0))
      
      toast({
        title: "Storage limit exceeded",
        description: `Not enough storage space. You have ${DocumentService.formatFileSize(remainingSpace)} remaining. Upgrade to premium for more storage.`,
        variant: "destructive",
      })
      return
    }

    const request: CreateDocumentRequest = {
      name: data.name,
      file: selectedFile,
      category: data.category,
      description: data.description,
      tags: tags,
    }

    uploadMutation.mutate(request)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Upload Document</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload Area */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Select File *
              </label>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-950' 
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <File className="w-12 h-12 text-orange-600 mx-auto" />
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">
                      {DocumentService.formatFileSize(selectedFile.size)}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Drag and drop your file here, or{" "}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-orange-600 hover:text-orange-700 font-medium"
                        >
                          browse files
                        </button>
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Supports: PDF, Word, Excel, PowerPoint, Images (max {DocumentService.formatFileSize(MAX_FILE_SIZE)})
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                accept={ALLOWED_FILE_TYPES.join(',')}
                className="hidden"
              />
            </div>

            {/* Document Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Document Name *
              </label>
              <Input
                {...register("name")}
                placeholder="Enter document name"
                className="focus:ring-orange-500 focus:border-orange-500"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Category *
              </label>
              <Select onValueChange={(value) => setValue("category", value)}>
                <SelectTrigger className="focus:ring-orange-500 focus:border-orange-500">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <Textarea
                {...register("description")}
                placeholder="Optional description or notes about this document"
                className="min-h-[100px] focus:ring-orange-500 focus:border-orange-500"
                maxLength={500}
              />
              <div className="text-xs text-slate-500 text-right">
                {watch("description")?.length || 0}/500
              </div>
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Tags
              </label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1 focus:ring-orange-500 focus:border-orange-500"
                  maxLength={30}
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                  size="sm"
                  disabled={!newTag.trim() || tags.includes(newTag.trim()) || tags.length >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Display Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(tag)}
                        className="h-4 w-4 p-0 hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-slate-500">
                {tags.length}/10 tags • Press Enter to add a tag
              </p>
            </div>

            {/* Upload Progress Bar */}
            {(isUploading || uploadProgress > 0) && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Upload Progress
                  </span>
                  <span className="text-sm text-slate-500">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                {isUploading && (
                  <p className="text-xs text-slate-500 text-center">
                    {uploadProgress < 25 ? 'Preparing upload...' :
                     uploadProgress < 70 ? 'Uploading file...' :
                     uploadProgress < 100 ? 'Saving document...' :
                     'Upload complete!'}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Uploading... {Math.round(uploadProgress)}%
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}