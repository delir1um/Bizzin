import { Badge } from "@/components/ui/badge"
import { Brain, Zap, Shield, Clock } from "lucide-react"

interface AIAnalysisIndicatorProps {
  isAnalyzing?: boolean
  confidence?: number
  source?: 'ai' | 'cache' | 'local'
  className?: string
}

export function AIAnalysisIndicator({ 
  isAnalyzing = false, 
  confidence = 0, 
  source = 'ai',
  className = "" 
}: AIAnalysisIndicatorProps) {
  
  const getSourceIcon = () => {
    switch (source) {
      case 'ai': return <Brain className="w-3 h-3" />
      case 'cache': return <Zap className="w-3 h-3" />
      case 'local': return <Shield className="w-3 h-3" />
      default: return <Brain className="w-3 h-3" />
    }
  }
  
  const getSourceLabel = () => {
    switch (source) {
      case 'ai': return 'AI Analyzed'
      case 'cache': return 'Cached Analysis'
      case 'local': return 'Local Analysis'
      default: return 'AI Analyzed'
    }
  }
  
  const getSourceColor = () => {
    switch (source) {
      case 'ai': return 'bg-green-100 text-green-700 border-green-200'
      case 'cache': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'local': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }
  
  if (isAnalyzing) {
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        <Clock className="w-3 h-3 mr-1 animate-spin" />
        Analyzing...
      </Badge>
    )
  }
  
  return (
    <Badge 
      variant="outline" 
      className={`text-xs ${getSourceColor()} ${className}`}
    >
      {getSourceIcon()}
      <span className="ml-1">{getSourceLabel()}</span>
      {confidence > 0 && (
        <span className="ml-1">• {Math.round(confidence)}%</span>
      )}
    </Badge>
  )
}