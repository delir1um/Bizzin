import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, ZoomIn, ZoomOut, FileText, Image as ImageIcon, FileSpreadsheet, Presentation, File } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DocumentService } from "@/lib/services/document"
import type { Document } from "@/types/document"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface FileViewerProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
}

export function FileViewer({ document, isOpen, onClose }: FileViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
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

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))

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

    // PDF files - iframe preview with fallback
    if (document.file_type === 'application/pdf' && fileUrl) {
      return (
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                PDF Preview
              </span>
            </div>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          
          <div className="w-full h-96 border rounded-md overflow-hidden bg-slate-50 dark:bg-slate-900">
            <iframe
              src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
              title={document.name}
              onError={(e) => {
                console.error('PDF iframe error:', e)
                // Show fallback content
                const iframe = e.target as HTMLIFrameElement
                if (iframe.parentElement) {
                  iframe.parentElement.innerHTML = `
                    <div class="flex items-center justify-center h-full">
                      <div class="text-center max-w-md px-6">
                        <svg class="h-16 w-16 text-orange-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">PDF Preview Unavailable</h3>
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">Browser security settings prevent PDF preview. Click download to view.</p>
                        <button onclick="window.location.reload()" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md">Download PDF</button>
                      </div>
                    </div>
                  `
                }
              }}
            />
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
          </div>
          
          {/* Document metadata */}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary">{document.category}</Badge>
            {document.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          {document.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {document.description}
            </p>
          )}
        </DialogHeader>

        <Separator className="my-4" />

        {/* Viewer controls */}
        {(document.file_type === 'application/pdf' || 
          document.file_type.startsWith('image/') || 
          document.file_type.startsWith('text/')) && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        )}

        {/* File content */}
        <div className="flex-1 min-h-0">
          {renderFileContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}