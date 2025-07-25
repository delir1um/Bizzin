import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, ZoomIn, ZoomOut, FileText, Image as ImageIcon, FileSpreadsheet, Presentation, File, ChevronLeft, ChevronRight } from "lucide-react"
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import { supabase } from "@/lib/supabase"
import { DocumentService } from "@/lib/services/document"
import type { Document } from "@/types/document"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

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
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const { toast } = useToast()

  // Reset state when document changes
  useEffect(() => {
    if (!document || !isOpen) {
      setFileUrl(null)
      setFileContent(null)
      setError(null)
      setZoom(100)
      setNumPages(null)
      setPageNumber(1)
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

  // PDF-specific functions
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF loading error:', error)
    setError('Failed to load PDF document')
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset
      return Math.max(1, Math.min(newPageNumber, numPages || 1))
    })
  }

  const previousPage = () => changePage(-1)
  const nextPage = () => changePage(1)

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

    // PDF files using react-pdf
    if (document.file_type === 'application/pdf' && fileUrl) {
      return (
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={previousPage}
                disabled={pageNumber <= 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page {pageNumber} of {numPages || '?'}
              </span>
              <Button
                onClick={nextPage}
                disabled={pageNumber >= (numPages || 1)}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          
          <div 
            className="flex justify-center border rounded-md overflow-auto max-h-96"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            <PDFDocument
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Loading PDF...</p>
                  </div>
                </div>
              }
            >
              <Page 
                pageNumber={pageNumber}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={600}
              />
            </PDFDocument>
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