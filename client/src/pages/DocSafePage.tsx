import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Upload, FileText, Download, Share2, Lock, Folder, Search, Filter, Trash2, Eye, Edit } from "lucide-react"
import { DocumentService } from "@/lib/services/document"
import { supabase } from "@/lib/supabase"
import type { Document } from "@/types/document"
import { useToast } from "@/hooks/use-toast"
import { UploadModal } from "@/components/docsafe/UploadModal"
import { EditDocumentModal } from "@/components/docsafe/EditDocumentModal"
import { PlanLimitBanner } from "@/components/plans/PlanLimitBanner"
import { UpgradeModal } from "@/components/plans/UpgradeModal"
import { usePlans } from "@/hooks/usePlans"
import { format } from "date-fns"

export function DocSafePage() {
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null)
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
            >
              Refresh
            </Button>
            <Button 
              onClick={() => {
                if (canUploadDocument) {
                  setShowUploadModal(true)
                } else {
                  setShowUpgradeModal(true)
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.total_documents || allDocuments.length || 0}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.storage_used ? DocumentService.formatFileSize(stats.storage_used) : 
                   allDocuments.length > 0 ? DocumentService.formatFileSize(allDocuments.reduce((total, doc) => total + doc.file_size, 0)) : '0 B'}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Storage Used</p>
                {((stats && stats.storage_used > 0) || allDocuments.length > 0) && (
                  <div className="mt-2 w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div 
                      className="bg-orange-600 h-1.5 rounded-full" 
                      style={{ 
                        width: `${Math.min(((stats?.storage_used || allDocuments.reduce((total, doc) => total + doc.file_size, 0)) / (1024*1024*1024)) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                )}
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
          <div className="space-y-4">
            {displayDocs.map((doc) => (
              <Card key={doc.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                        <span className="text-lg">{doc.file_type.includes('pdf') ? '📄' : doc.file_type.includes('word') ? '📝' : doc.file_type.includes('excel') ? '📊' : doc.file_type.includes('image') ? '🖼️' : '📁'}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{doc.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {format(new Date(doc.created_at), 'MMM d, yyyy')} • {DocumentService.formatFileSize(doc.file_size)} • {doc.category}
                        </p>
                        {doc.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{doc.description}</p>
                        )}
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditDocument(doc)}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        disabled={downloadMutation.isPending}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteDocument(doc)}
                        disabled={deleteDocMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
      />

      {/* Edit Document Modal */}
      <EditDocumentModal 
        isOpen={showEditModal}
        onClose={closeEditModal}
        document={documentToEdit}
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