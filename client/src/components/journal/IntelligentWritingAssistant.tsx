// Simplified IntelligentWritingAssistant - Disabled during AI system streamlining

interface IntelligentWritingAssistantProps {
  userId: string
  currentContent: string
  currentTitle: string
  onSuggestionApply?: (suggestion: string, type: 'title' | 'content') => void
  className?: string
}

export function IntelligentWritingAssistant({
  userId,
  currentContent,
  currentTitle,
  onSuggestionApply,
  className = ""
}: IntelligentWritingAssistantProps) {
  // Assistant disabled while using streamlined AI system
  // All AI analysis now happens server-side via Hugging Face API
  return null
}