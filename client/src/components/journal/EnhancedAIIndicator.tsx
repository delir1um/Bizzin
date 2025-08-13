// Enhanced AI indicator component to show improved AI features
import { Badge } from "@/components/ui/badge"
import { Sparkles, Brain, Zap } from "lucide-react"

interface EnhancedAIIndicatorProps {
  confidence: number
  userLearned?: boolean
  rulesMatched?: string[]
  className?: string
}

export function EnhancedAIIndicator({ 
  confidence, 
  userLearned, 
  rulesMatched = [], 
  className = "" 
}: EnhancedAIIndicatorProps) {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return "bg-green-100 text-green-700 border-green-200"
    if (conf >= 60) return "bg-blue-100 text-blue-700 border-blue-200"
    return "bg-orange-100 text-orange-700 border-orange-200"
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant="outline" 
        className={`${getConfidenceColor(confidence)} text-xs`}
      >
        <Brain className="w-3 h-3 mr-1" />
        AI v2.0 {confidence}%
      </Badge>
      
      {userLearned && (
        <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
          <Sparkles className="w-3 h-3 mr-1" />
          Learned
        </Badge>
      )}
      
      {rulesMatched.length > 0 && (
        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
          <Zap className="w-3 h-3 mr-1" />
          Rules: {rulesMatched.length}
        </Badge>
      )}
    </div>
  )
}