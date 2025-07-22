export interface Document {
  id: string
  user_id: string
  name: string
  original_name: string
  file_path: string
  file_type: string
  file_size: number
  category: string
  tags: string[]
  is_shared: boolean
  shared_with?: string[]
  description?: string
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  description?: string
  parent_id?: string
  created_at: string
  updated_at: string
}

export interface CreateDocumentRequest {
  name: string
  file: File
  category: string
  tags?: string[]
  description?: string
}

export interface CreateFolderRequest {
  name: string
  description?: string
  parent_id?: string
}

export interface StorageStats {
  total_documents: number
  storage_used: number
  storage_limit: number
}

export const DOCUMENT_CATEGORIES = [
  'Business Plans',
  'Legal Documents', 
  'Financial Reports',
  'Contracts',
  'Marketing Materials',
  'HR Documents',
  'Tax Documents',
  'Invoices',
  'Presentations',
  'Other'
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif'
]