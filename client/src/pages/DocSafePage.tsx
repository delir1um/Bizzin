import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Upload, FileText, Download, Share2, Lock, Folder, Search, Filter, Trash2, Eye, Edit, FileSpreadsheet, Image as ImageIcon, Presentation, File } from "lucide-react"
import { DocumentService } from "@/lib/services/document"
import { supabase } from "@/lib/supabase"
import type { Document } from "@/types/document"
import { useToast } from "@/hooks/use-toast"
import { UploadModal } from "@/components/docsafe/UploadModal"
import { EditDocumentModal } from "@/components/docsafe/EditDocumentModal"
import { FileViewer } from "@/components/docsafe/FileViewer"
import { PlanLimitBanner } from "@/components/plans/PlanLimitBanner"
import { UpgradeModal } from "@/components/plans/UpgradeModal"
import { usePlans } from "@/hooks/usePlans"
import { format } from "date-fns"
import { StandardPageLayout, createStatCard } from "@/components/layout/StandardPageLayout"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedCard, AnimatedGrid, AnimatedItem } from "@/components/ui/animated-card"

export function DocSafePage() {
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null)
  const [documentToView, setDocumentToView] = useState<Document | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { usageStatus, canUploadDocument, hasStorageSpace } = usePlans()

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getCurrentUser()
  }, [])

  // Fetch storage stats
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['storage-stats', user?.id],
    queryFn: () => user ? DocumentService.getStorageStats(user.id) : null,
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  })

  // Fetch documents
  const { data: allDocuments = [], isLoading: docsLoading, refetch: refetchDocs } = useQuery({
    queryKey: ['documents', user?.id],
    queryFn: () => user ? DocumentService.getUserDocuments(user.id) : [],
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 10000, // 10 seconds
  })

  // Filter documents by category if selected
  const documents = selectedCategory 
    ? allDocuments.filter(doc => doc.category === selectedCategory)
    : allDocuments

  // Search documents
  const { data: searchResults = [] } = useQuery({
    queryKey: ['document-search', user?.id, searchTerm],
    queryFn: () => user && searchTerm ? DocumentService.searchDocuments(user.id, searchTerm) : [],
    enabled: !!user && !!searchTerm,
  })

  // Delete document mutation
  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => DocumentService.deleteDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] })
      setDocumentToDelete(null)
      toast({
        title: "Document deleted",
        description: "Document has been successfully deleted.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      })
    },
  })

  // Download document mutation
  const downloadMutation = useMutation({
    mutationFn: (doc: Document) => DocumentService.downloadDocument(doc),
    onError: (error: any) => {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download document",
        variant: "destructive",
      })
    },
  })

  const displayDocs = searchTerm ? searchResults : documents

  const handleDeleteDocument = (doc: Document) => {
    setDocumentToDelete(doc)
  }

  const handleEditDocument = (doc: Document) => {
    setDocumentToEdit(doc)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setDocumentToEdit(null)
  }

  const handleViewDocument = (doc: Document) => {
    setDocumentToView(doc)
    setShowViewModal(true)
  }

  const closeViewModal = () => {
    setShowViewModal(false)
    setDocumentToView(null)
  }

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteDocMutation.mutate(documentToDelete.id)
    }
  }

  const handleDownload = (doc: Document) => {
    downloadMutation.mutate(doc)
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Please sign in to access DocSafe</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Document Safe</h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
              Securely store and manage your business documents
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Button 
              onClick={() => {
                refetchDocs()
                refetchStats()
              }}
              variant="outline"
              size="sm"
              className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/20"
            >
              Refresh
            </Button>
            <Button 
              onClick={() => {
                // Check storage limit: use plan system if available, otherwise fallback to 50MB limit
                const storageExceeded = usageStatus ? 
                  !canUploadDocument : 
                  stats && stats.storage_used > (50 * 1024 * 1024) // 50MB fallback limit
                
                if (storageExceeded) {
                  setShowUpgradeModal(true)
                } else {
                  setShowUploadModal(true)
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>
      </div>

      {/* Storage Limit Warning for fallback system */}
      {!usageStatus && stats && stats.storage_used > (50 * 1024 * 1024) && (
        <div className="mb-8">
          <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 p-4 rounded-r-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Free Storage Limit Exceeded
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  You've used {DocumentService.formatFileSize(stats.storage_used)} of 50MB free storage. 
                  Upgrade to premium for 10GB storage and unlimited features.
                </p>
              </div>
              <Button 
                onClick={() => setShowUpgradeModal(true)}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Limit Banners */}
      {usageStatus && (
        <div className="space-y-4 mb-8">
          <PlanLimitBanner 
            usageStatus={usageStatus} 
            limitType="storage" 
            onUpgrade={() => setShowUpgradeModal(true)}
          />
          <PlanLimitBanner 
            usageStatus={usageStatus} 
            limitType="documents" 
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        </div>
      )}

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats?.total_documents || allDocuments.length || 0}
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500 rounded-lg shadow-sm">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {stats?.storage_used ? DocumentService.formatFileSize(stats.storage_used) : 
                   allDocuments.length > 0 ? DocumentService.formatFileSize(allDocuments.reduce((total, doc) => total + doc.file_size, 0)) : '0 B'}
                </div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Storage Used</p>
                {((stats && stats.storage_used > 0) || allDocuments.length > 0) && (
                  <div className="mt-2 w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div 
                      className="bg-orange-600 h-1.5 rounded-full" 
                      style={{ 
                        width: `${Math.min(((stats?.storage_used || allDocuments.reduce((total, doc) => total + doc.file_size, 0)) / (50*1024*1024)) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                <Folder className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {Array.from(new Set(allDocuments.map(doc => doc.category))).length || 0}
                </div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setSelectedCategory("")}
          className={`w-full sm:w-auto ${!selectedCategory ? 'bg-orange-50 border-orange-200' : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          All Categories
        </Button>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Browse by Category</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === '' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory('')}
            className={selectedCategory === '' ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}
          >
            All ({allDocuments.length})
          </Button>
          {['Business Plans', 'Legal Documents', 'Financial Reports', 'Contracts', 'Presentations', 'Marketing Materials'].map((category) => {
            const categoryCount = allDocuments.filter(doc => doc.category === category).length
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                className={selectedCategory === category ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}
              >
                {category} ({categoryCount})
              </Button>
            )
          })}
        </div>
      </div>

      {/* Documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {searchTerm ? `Search Results (${displayDocs.length})` : `Your Documents (${displayDocs.length})`}
          </h2>
          {searchTerm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </Button>
          )}
        </div>

        {docsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="animate-pulse flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayDocs.length === 0 ? (
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {searchTerm ? "No documents found" : "No documents yet"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {searchTerm 
                  ? "Try adjusting your search terms or clear the search to see all documents."
                  : "Upload your first document to get started with DocSafe."
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowUploadModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {/* Desktop table view */}
            <div className="hidden md:block">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                <div className="col-span-5">Name</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Modified</div>
                <div className="col-span-3">Category</div>
              </div>
              
              {/* Document rows */}
              <AnimatedGrid stagger={0.05}>
                {displayDocs.map((doc, index) => (
                  <AnimatedItem key={doc.id}>
                    <div className="group grid grid-cols-12 gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0 cursor-pointer transition-colors"
                         onClick={() => handleViewDocument(doc)}>
                      {/* Name column */}
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0">
                          {doc.file_type.includes('pdf') ? (
                            <FileText className="w-5 h-5 text-red-500" />
                          ) : doc.file_type.includes('word') ? (
                            <FileText className="w-5 h-5 text-blue-500" />
                          ) : doc.file_type.includes('excel') || doc.file_type.includes('sheet') ? (
                            <FileSpreadsheet className="w-5 h-5 text-green-500" />
                          ) : doc.file_type.includes('image') ? (
                            <ImageIcon className="w-5 h-5 text-purple-500" />
                          ) : doc.file_type.includes('presentation') || doc.file_type.includes('powerpoint') ? (
                            <Presentation className="w-5 h-5 text-orange-500" />
                          ) : (
                            <File className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-900 dark:text-white truncate">
                            {doc.name}
                          </div>
                          {doc.description && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {doc.description}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Size column */}
                      <div className="col-span-2 flex items-center text-sm text-slate-600 dark:text-slate-400">
                        {DocumentService.formatFileSize(doc.file_size)}
                      </div>
                      
                      {/* Modified column */}
                      <div className="col-span-2 flex items-center text-sm text-slate-600 dark:text-slate-400">
                        {format(new Date(doc.created_at), 'MMM d, yyyy')}
                      </div>
                      
                      {/* Category column with actions */}
                      <div className="col-span-3 flex items-center justify-between min-w-0">
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {doc.category}
                        </Badge>
                        
                        {/* Action buttons - appear on hover */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDocument(doc)
                            }}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="View document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditDocument(doc)
                            }}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-orange-600 hover:bg-orange-50"
                            title="Edit document"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadMutation.mutate(doc)
                            }}
                            disabled={downloadMutation.isPending}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                            title="Download document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteDocument(doc)
                            }}
                            disabled={deleteDocMutation.isPending}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AnimatedItem>
                ))}
              </AnimatedGrid>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden">
              <AnimatedGrid className="divide-y divide-slate-200 dark:divide-slate-700" stagger={0.05}>
                {displayDocs.map((doc, index) => (
                  <AnimatedItem key={doc.id}>
                    <div className="group p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                         onClick={() => handleViewDocument(doc)}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {doc.file_type.includes('pdf') ? (
                            <FileText className="w-5 h-5 text-red-500" />
                          ) : doc.file_type.includes('word') ? (
                            <FileText className="w-5 h-5 text-blue-500" />
                          ) : doc.file_type.includes('excel') || doc.file_type.includes('sheet') ? (
                            <FileSpreadsheet className="w-5 h-5 text-green-500" />
                          ) : doc.file_type.includes('image') ? (
                            <ImageIcon className="w-5 h-5 text-purple-500" />
                          ) : doc.file_type.includes('presentation') || doc.file_type.includes('powerpoint') ? (
                            <Presentation className="w-5 h-5 text-orange-500" />
                          ) : (
                            <File className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white truncate">
                            {doc.name}
                          </div>
                          {doc.description && (
                            <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                              {doc.description}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{DocumentService.formatFileSize(doc.file_size)}</span>
                            <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {doc.category}
                            </Badge>
                            {/* Action buttons - always visible on mobile */}
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewDocument(doc)
                                }}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                title="View document"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditDocument(doc)
                                }}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-orange-600 hover:bg-orange-50"
                                title="Edit document"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  downloadMutation.mutate(doc)
                                }}
                                disabled={downloadMutation.isPending}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                title="Download document"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteDocument(doc)
                                }}
                                disabled={deleteDocMutation.isPending}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                title="Delete document"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AnimatedItem>
                ))}
              </AnimatedGrid>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDocMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteDocMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteDocMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)}
        stats={stats}
      />

      {/* Edit Document Modal */}
      <EditDocumentModal 
        isOpen={showEditModal}
        onClose={closeEditModal}
        document={documentToEdit}
      />

      {/* File Viewer Modal */}
      <FileViewer
        document={documentToView}
        isOpen={showViewModal}
        onClose={closeViewModal}
        onEdit={handleEditDocument}
        onDelete={handleDeleteDocument}
      />

      {/* Upgrade Modal */}
      {user && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          userId={user.id}
        />
      )}
    </div>
  )
}