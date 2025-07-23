import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Search, 
  X, 
  Filter, 
  Calendar, 
  Tag, 
  Brain,
  TrendingUp,
  Sparkles
} from "lucide-react"
import type { JournalEntry } from "@/types/journal"

interface SmartSearchProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  entries: JournalEntry[]
  onQuickFilter: (filter: {
    type: 'mood' | 'category' | 'energy' | 'recent'
    value?: string
  }) => void
}

export function SmartSearch({ 
  searchTerm, 
  onSearchChange, 
  entries, 
  onQuickFilter 
}: SmartSearchProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return []
    
    const term = searchTerm.toLowerCase()
    const suggestions: Array<{
      type: 'entry' | 'tag' | 'category' | 'mood'
      text: string
      entry?: JournalEntry
      count?: number
    }> = []
    
    // Entry title matches
    entries.forEach(entry => {
      if (entry.title.toLowerCase().includes(term) || 
          entry.content.toLowerCase().includes(term)) {
        suggestions.push({
          type: 'entry',
          text: entry.title,
          entry
        })
      }
    })
    
    // Tag matches
    const allTags = new Set<string>()
    entries.forEach(entry => {
      entry.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(term)) {
          allTags.add(tag)
        }
      })
    })
    allTags.forEach(tag => {
      const count = entries.filter(e => e.tags?.includes(tag)).length
      suggestions.push({
        type: 'tag',
        text: tag,
        count
      })
    })
    
    // Category matches
    const categories = new Set<string>()
    entries.forEach(entry => {
      if (entry.category?.toLowerCase().includes(term)) {
        categories.add(entry.category)
      }
    })
    categories.forEach(category => {
      const count = entries.filter(e => e.category === category).length
      suggestions.push({
        type: 'category',
        text: category,
        count
      })
    })
    
    // Mood matches
    const moods = new Set<string>()
    entries.forEach(entry => {
      if (entry.sentiment_data?.primary_mood?.toLowerCase().includes(term)) {
        moods.add(entry.sentiment_data.primary_mood)
      }
    })
    moods.forEach(mood => {
      const count = entries.filter(e => e.sentiment_data?.primary_mood === mood).length
      suggestions.push({
        type: 'mood',
        text: mood,
        count
      })
    })
    
    return suggestions.slice(0, 8) // Limit suggestions
  }, [searchTerm, entries])
  
  const quickFilters = useMemo(() => {
    const moodCounts = entries.reduce((acc, entry) => {
      if (entry.sentiment_data?.primary_mood) {
        acc[entry.sentiment_data.primary_mood] = (acc[entry.sentiment_data.primary_mood] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const topMoods = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
    
    const categoryCounts = entries.reduce((acc, entry) => {
      if (entry.category) {
        acc[entry.category] = (acc[entry.category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const topCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
    
    const highEnergyCount = entries.filter(e => 
      e.sentiment_data?.energy === 'High'
    ).length
    
    return {
      topMoods,
      topCategories,
      highEnergyCount,
      recentCount: entries.filter(e => {
        const daysDiff = Math.floor((Date.now() - new Date(e.created_at).getTime()) / (1000 * 60 * 60 * 24))
        return daysDiff <= 7
      }).length
    }
  }, [entries])
  
  const getMoodEmoji = (mood: string) => {
    const moodEmojis: Record<string, string> = {
      'Excited': '🚀',
      'Motivated': '💪',
      'Focused': '🎯',
      'Confident': '⭐',
      'Optimistic': '🌟',
      'Grateful': '🙏',
      'Reflective': '🤔',
      'Challenged': '⚡',
      'Stressed': '😤',
      'Overwhelmed': '🌀',
      'Frustrated': '😠'
    }
    return moodEmojis[mood] || '💭'
  }
  
  const getCategoryEmoji = (category: string) => {
    const categoryEmojis: Record<string, string> = {
      'Research': '🔍',
      'Planning': '📋',
      'Strategy': '🎯',
      'Feedback': '💬',
      'Milestone': '🏆',
      'Learning': '📚',
      'Team': '👥',
      'Product': '🛠️',
      'Marketing': '📈',
      'Finance': '💰',
      'Personal': '👤'
    }
    return categoryEmojis[category] || '📁'
  }
  
  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search entries, tags, moods, or categories..."
          value={searchTerm}
          onChange={(e) => {
            onSearchChange(e.target.value)
            setShowSuggestions(e.target.value.length > 0)
          }}
          onFocus={() => setShowSuggestions(searchTerm.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="pl-10 pr-10 focus:ring-orange-500 focus:border-orange-500"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange("")
              setShowSuggestions(false)
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {/* Search Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border border-slate-200 dark:border-slate-700">
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (suggestion.type === 'entry') {
                      onSearchChange(suggestion.text)
                    } else {
                      onQuickFilter({
                        type: suggestion.type as any,
                        value: suggestion.text
                      })
                    }
                    setShowSuggestions(false)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-700 last:border-b-0 flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {suggestion.type === 'entry' && <Search className="w-3 h-3 text-slate-500" />}
                    {suggestion.type === 'tag' && <Tag className="w-3 h-3 text-blue-500" />}
                    {suggestion.type === 'category' && <span className="text-xs">{getCategoryEmoji(suggestion.text)}</span>}
                    {suggestion.type === 'mood' && <span className="text-xs">{getMoodEmoji(suggestion.text)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 dark:text-white truncate">
                      {suggestion.text}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">
                      {suggestion.type === 'entry' ? 'Entry' : suggestion.type}
                      {suggestion.count && ` • ${suggestion.count} entries`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Quick Filters */}
      {!searchTerm && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Quick Filters
          </h4>
          
          <div className="flex flex-wrap gap-2">
            {/* Recent entries */}
            {quickFilters.recentCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickFilter({ type: 'recent' })}
                className="text-xs border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950"
              >
                <Calendar className="w-3 h-3 mr-1" />
                Recent ({quickFilters.recentCount})
              </Button>
            )}
            
            {/* High energy */}
            {quickFilters.highEnergyCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickFilter({ type: 'energy', value: 'High' })}
                className="text-xs border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-800 dark:text-yellow-300 dark:hover:bg-yellow-950"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                High Energy ({quickFilters.highEnergyCount})
              </Button>
            )}
            
            {/* Top moods */}
            {quickFilters.topMoods.map(([mood, count]) => (
              <Button
                key={mood}
                variant="outline"
                size="sm"
                onClick={() => onQuickFilter({ type: 'mood', value: mood })}
                className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950"
              >
                <span className="mr-1">{getMoodEmoji(mood)}</span>
                {mood} ({count})
              </Button>
            ))}
            
            {/* Top categories */}
            {quickFilters.topCategories.map(([category, count]) => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                onClick={() => onQuickFilter({ type: 'category', value: category })}
                className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950"
              >
                <span className="mr-1">{getCategoryEmoji(category)}</span>
                {category} ({count})
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}