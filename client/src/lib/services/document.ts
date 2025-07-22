import { supabase } from '@/lib/supabase'
import type { Document, Folder, CreateDocumentRequest, CreateFolderRequest, StorageStats } from '@/types/document'

export class DocumentService {
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
        folder_id: request.folder_id || null,
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
  static async getUserDocuments(userId: string, folderId?: string): Promise<Document[]> {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (folderId) {
      query = query.eq('folder_id', folderId)
    } else {
      query = query.is('folder_id', null)
    }

    const { data, error } = await query

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
      // Get document counts and sizes
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('file_size, is_shared')
        .eq('user_id', userId)

      if (docsError) {
        throw new Error(`Failed to fetch document stats: ${docsError.message}`)
      }

      // Get folder count
      const { data: folders, error: foldersError } = await supabase
        .from('folders')
        .select('id')
        .eq('user_id', userId)

      if (foldersError) {
        throw new Error(`Failed to fetch folder stats: ${foldersError.message}`)
      }

      const totalDocuments = documents?.length || 0
      const sharedDocuments = documents?.filter(doc => doc.is_shared).length || 0
      const storageUsed = documents?.reduce((total, doc) => total + (doc.file_size || 0), 0) || 0
      const totalFolders = folders?.length || 0

      return {
        total_documents: totalDocuments,
        total_folders: totalFolders,
        shared_documents: sharedDocuments,
        storage_used: storageUsed,
        storage_limit: 1024 * 1024 * 1024 // 1GB limit
      }

    } catch (err: any) {
      console.error('Error getting storage stats:', err)
      throw err
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
}