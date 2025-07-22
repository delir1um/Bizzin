import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { DocumentService } from "@/lib/services/document"
import { useToast } from "@/hooks/use-toast"
import type { Document } from "@/types/document"

interface EditDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  document: Document | null
}

export function EditDocumentModal({ isOpen, onClose, document }: EditDocumentModalProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Initialize form with document data
  useEffect(() => {
    if (document) {
      setName(document.name)
      setCategory(document.category)
      setDescription(document.description || "")
      setTags(document.tags || [])
    }
  }, [document])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("")
      setCategory("")
      setDescription("")
      setTags([])
      setNewTag("")
    }
  }, [isOpen])

  const updateDocumentMutation = useMutation({
    mutationFn: (updateData: { id: string; name: string; category: string; description: string; tags: string[] }) =>
      DocumentService.updateDocument(updateData.id, {
        name: updateData.name,
        category: updateData.category,
        description: updateData.description,
        tags: updateData.tags
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] })
      toast({
        title: "Document updated",
        description: "Document details have been successfully updated.",
      })
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update document",
        variant: "destructive",
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!document || !name.trim()) return

    updateDocumentMutation.mutate({
      id: document.id,
      name: name.trim(),
      category,
      description: description.trim(),
      tags: tags.filter(tag => tag.trim().length > 0)
    })
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
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

  const categories = [
    "Business Plans",
    "Financial Reports",
    "Marketing Materials",
    "Legal Documents",
    "Presentations",
    "Contracts",
    "Research",
    "Other"
  ]

  if (!document) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>
            Update document information and organization details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Document Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter document name"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this document"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag"
                className="flex-1"
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={updateDocumentMutation.isPending}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || updateDocumentMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {updateDocumentMutation.isPending ? "Updating..." : "Update Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}