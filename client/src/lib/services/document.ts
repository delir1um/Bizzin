import { supabase } from '@/lib/supabase'
import type { Document, Folder, CreateDocumentRequest, CreateFolderRequest, StorageStats } from '@/types/document'

export class DocumentService {
  // Upload a new document with progress tracking
  static async uploadDocumentWithProgress(
    request: CreateDocumentRequest, 
    onProgress?: (progress: number) => void
  ): Promise<Document> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // CRITICAL: Check trial expiry before allowing document upload
      const { PlansService } = await import('./plans')
      const usageStatus = await PlansService.getUserUsageStatus(user.id)
      
      if (!usageStatus?.can_upload_document) {
        throw new Error('Document upload requires an active premium subscription. Your trial may have expired.')
      }

      onProgress?.(10) // Starting upload

      // Generate unique file path
      const fileExt = request.file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/documents/${fileName}`

      console.log('Uploading file to:', filePath)
      onProgress?.(25) // File path generated

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, request.file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      onProgress?.(70) // File uploaded

      // Create document record in database
      const documentData = {
        user_id: user.id,
        name: request.name,
        original_name: request.file.name,
        file_path: filePath,
        file_type: request.file.type,
        file_size: request.file.size,
        category: request.category,
        tags: request.tags || [],
        is_shared: false,
        description: request.description || null,
      }

      onProgress?.(85) // Preparing database entry

      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single()

      if (error) {
        // If database insert fails, clean up uploaded file
        await supabase.storage.from('documents').remove([filePath])
        throw new Error(`Failed to save document: ${error.message}`)
      }

      onProgress?.(100) // Complete
      console.log('Document created successfully:', data)
      return data

    } catch (err: any) {
      console.error('Error in uploadDocumentWithProgress:', err)
      throw err
    }
  }

  // Upload a new document
  static async uploadDocument(request: CreateDocumentRequest): Promise<Document> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Generate unique file path
      const fileExt = request.file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/documents/${fileName}`

      console.log('Uploading file to:', filePath)

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, request.file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      // Create document record in database
      const documentData = {
        user_id: user.id,
        name: request.name,
        original_name: request.file.name,
        file_path: filePath,
        file_type: request.file.type,
        file_size: request.file.size,
        category: request.category,
        tags: request.tags || [],
        is_shared: false,
        description: request.description || null,
      }

      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single()

      if (error) {
        // If database insert fails, clean up uploaded file
        await supabase.storage.from('documents').remove([filePath])
        throw new Error(`Failed to save document: ${error.message}`)
      }

      console.log('Document created successfully:', data)
      return data

    } catch (err: any) {
      console.error('Error in uploadDocument:', err)
      throw err
    }
  }

  // Get all documents for a user
  static async getUserDocuments(userId: string): Promise<Document[]> {
    console.log('Fetching documents for user:', userId)
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    console.log('Documents fetch result:', { data, error, count: data?.length })

    if (error) {
      console.error('Error fetching documents:', error)
      throw new Error(`Failed to fetch documents: ${error.message}`)
    }

    return data || []
  }

  // Search documents
  static async searchDocuments(userId: string, searchTerm: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .or(`name.ilike.%${searchTerm}%,original_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching documents:', error)
      throw new Error(`Failed to search documents: ${error.message}`)
    }

    return data || []
  }

  // Get documents by category
  static async getDocumentsByCategory(userId: string, category: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents by category:', error)
      throw new Error(`Failed to fetch documents: ${error.message}`)
    }

    return data || []
  }

  // Download document
  static async downloadDocument(document: Document): Promise<void> {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path)

      if (error) {
        throw new Error(`Failed to download file: ${error.message}`)
      }

      // Create download link
      const url = URL.createObjectURL(data)
      const link = globalThis.document.createElement('a')
      link.href = url
      link.download = document.original_name
      globalThis.document.body.appendChild(link)
      link.click()
      globalThis.document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (err: any) {
      console.error('Error downloading document:', err)
      throw err
    }
  }

  // Delete document
  static async deleteDocument(documentId: string): Promise<void> {
    try {
      // First get the document to get file path
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch document: ${fetchError.message}`)
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_path])

      if (storageError) {
        console.warn('Storage deletion failed:', storageError.message)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (dbError) {
        throw new Error(`Failed to delete document: ${dbError.message}`)
      }

      console.log('Document deleted successfully')

    } catch (err: any) {
      console.error('Error deleting document:', err)
      throw err
    }
  }

  // Get storage stats
  static async getStorageStats(userId: string): Promise<StorageStats> {
    try {
      console.log('Fetching storage stats for user:', userId)
      
      // Get document counts and sizes
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('file_size, is_shared')
        .eq('user_id', userId)

      console.log('Documents query result:', { documents, docsError })

      if (docsError) {
        console.error('Documents query error:', docsError)
        // Don't throw, continue with empty array
      }

      const totalDocuments = documents?.length || 0
      const storageUsed = documents?.reduce((total, doc) => total + (doc.file_size || 0), 0) || 0

      const stats = {
        total_documents: totalDocuments,
        storage_used: storageUsed,
        storage_limit: 1024 * 1024 * 1024 // 1GB limit
      }

      console.log('Calculated stats:', stats)
      return stats

    } catch (err: any) {
      console.error('Error getting storage stats:', err)
      // Return default values instead of throwing to prevent UI errors
      return {
        total_documents: 0,
        storage_used: 0,
        storage_limit: 1024 * 1024 * 1024 // 1GB limit
      }
    }
  }

  // Folder operations
  static async createFolder(request: CreateFolderRequest): Promise<Folder> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const folderData = {
        user_id: user.id,
        name: request.name,
        description: request.description || null,
        parent_id: request.parent_id || null,
      }

      const { data, error } = await supabase
        .from('folders')
        .insert([folderData])
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create folder: ${error.message}`)
      }

      return data

    } catch (err: any) {
      console.error('Error creating folder:', err)
      throw err
    }
  }

  static async getUserFolders(userId: string): Promise<Folder[]> {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching folders:', error)
      throw new Error(`Failed to fetch folders: ${error.message}`)
    }

    return data || []
  }

  // Utility functions
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  static getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'pdf'
    if (fileType.includes('word') || fileType.includes('document')) return 'doc'
    if (fileType.includes('excel') || fileType.includes('sheet')) return 'xls'
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'ppt'
    if (fileType.includes('image')) return 'img'
    return 'file'
  }

  // Update document metadata
  static async updateDocument(documentId: string, updates: {
    name?: string
    category?: string
    description?: string
    tags?: string[]
  }): Promise<Document> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single()

      if (error) {
        console.error('Error updating document:', error)
        throw new Error(`Failed to update document: ${error.message}`)
      }

      return data
    } catch (err: any) {
      console.error('Error in updateDocument:', err)
      throw err
    }
  }
}