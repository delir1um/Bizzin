import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, FileText, Image as ImageIcon, FileSpreadsheet, Presentation, File, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DocumentService } from "@/lib/services/document"
import type { Document } from "@/types/document"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface FileViewerProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (document: Document) => void
  onDelete?: (document: Document) => void
}

export function FileViewer({ document, isOpen, onClose, onEdit, onDelete }: FileViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const { toast } = useToast()

  // Reset state when document changes
  useEffect(() => {
    if (!document || !isOpen) {
      setFileUrl(null)
      setFileContent(null)
      setError(null)
      setZoom(100)
      return
    }

    loadFile()
  }, [document, isOpen])

  const loadFile = async () => {
    if (!document) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path)

      if (error) {
        throw new Error(`Failed to load file: ${error.message}`)
      }

      // Handle different file types
      if (document.file_type.startsWith('text/')) {
        // Text files - read as text
        const text = await data.text()
        setFileContent(text)
      } else {
        // Binary files - create object URL
        const url = URL.createObjectURL(data)
        setFileUrl(url)
      }
    } catch (err: any) {
      console.error('Error loading file:', err)
      setError(err.message || 'Failed to load file')
    } finally {
      setIsLoading(false)
    }
  }

  // Clean up URL when component unmounts or document changes
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl)
      }
    }
  }, [fileUrl])

  const handleDownload = async () => {
    if (!document) return
    
    try {
      await DocumentService.downloadDocument(document)
      toast({
        title: "Download started",
        description: `${document.name} is being downloaded.`,
      })
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download document",
        variant: "destructive",
      })
    }
  }

  const handleEdit = () => {
    if (document && onEdit) {
      onEdit(document)
      onClose()
    }
  }

  const handleDelete = () => {
    if (document && onDelete) {
      onDelete(document)
      onClose()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return ImageIcon
    if (fileType === 'application/pdf') return FileText
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileSpreadsheet
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return Presentation
    return File
  }



  const renderFileContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading file...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download to view
            </Button>
          </div>
        </div>
      )
    }

    if (!document) return null

    // Text files
    if (document.file_type.startsWith('text/') && fileContent) {
      return (
        <ScrollArea className="h-96 w-full rounded-md border p-4">
          <pre className="text-sm whitespace-pre-wrap font-mono" style={{ fontSize: `${zoom}%` }}>
            {fileContent}
          </pre>
        </ScrollArea>
      )
    }

    // PDF files - optimized download experience due to browser limitations
    if (document.file_type === 'application/pdf' && fileUrl) {
      return (
        <div className="w-full rounded-md border bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 py-12 px-8">
          <div className="text-center max-w-lg mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-full p-4 w-20 h-20 mx-auto mb-6 shadow-lg">
              <FileText className="h-12 w-12 text-orange-600 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {document.name}
            </h3>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Size:</span>
                  <span className="ml-2 font-medium">{formatFileSize(document.file_size)}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Type:</span>
                  <span className="ml-2 font-medium">PDF Document</span>
                </div>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-8 text-sm leading-relaxed">
              For security, browsers don't allow PDF preview from cloud storage. 
              Click below to open the document in a new tab or download it to your device.
            </p>
            <div className="space-y-4">
              <Button 
                onClick={() => window.open(fileUrl, '_blank')}
                className="bg-orange-600 hover:bg-orange-700 w-full py-3 text-base"
              >
                <FileText className="h-5 w-5 mr-2" />
                Open in New Tab
              </Button>
              <Button 
                onClick={handleDownload} 
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-50 w-full py-3 text-base"
              >
                <Download className="h-4 w-4 mr-2" />
                Download to Device
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // Image files
    if (document.file_type.startsWith('image/') && fileUrl) {
      return (
        <div className="flex items-center justify-center h-96 w-full rounded-md border overflow-auto">
          <img
            src={fileUrl}
            alt={document.name}
            className="max-w-full max-h-full object-contain"
            style={{ transform: `scale(${zoom / 100})` }}
          />
        </div>
      )
    }

    // Office documents - show download option
    if (
      document.file_type.includes('word') ||
      document.file_type.includes('excel') ||
      document.file_type.includes('powerpoint') ||
      document.file_type.includes('officedocument')
    ) {
      const IconComponent = getFileIcon(document.file_type)
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="h-12 w-12 text-slate-400 mx-auto mb-2 flex items-center justify-center">
              <IconComponent className="h-full w-full" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Office documents require download to view
            </p>
            <Button onClick={handleDownload} className="bg-orange-600 hover:bg-orange-700">
              <Download className="h-4 w-4 mr-2" />
              Download & Open
            </Button>
          </div>
        </div>
      )
    }

    // Fallback for unsupported files
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <File className="h-12 w-12 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Preview not available for this file type
          </p>
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download to view
          </Button>
        </div>
      </div>
    )
  }

  if (!document) return null

  const FileIcon = getFileIcon(document.file_type)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <FileIcon className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-semibold truncate">
                  {document.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-600 dark:text-slate-400">
                  <span>{formatFileSize(document.file_size)}</span>
                  <span>•</span>
                  <span>{format(new Date(document.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
          
          {/* Description with expandable text */}
          {document.description && (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {document.description.length > 150 ? (
                  <div>
                    <p className="leading-relaxed">
                      {showFullDescription 
                        ? document.description 
                        : `${document.description.substring(0, 150)}...`
                      }
                    </p>
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-orange-600 hover:text-orange-700 text-xs font-medium mt-2 flex items-center gap-1"
                    >
                      {showFullDescription ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Read more
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="leading-relaxed">{document.description}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Document metadata */}
          <div className="flex items-center gap-2 mt-4">
            <Badge variant="secondary">{document.category}</Badge>
            {document.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </DialogHeader>

        <Separator className="my-4" />



        {/* File content */}
        <div className="flex-1 min-h-0">
          {renderFileContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}