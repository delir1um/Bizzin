import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, X, Tag, Target } from "lucide-react"

interface FilterBarProps {
  onFiltersChange: (filters: JournalFilters) => void
  activeFilters: JournalFilters
  allEntries: any[] // To extract available tags
  userGoals?: any[] // To show available goals for filtering
}

export interface JournalFilters {
  categories: string[]
  moods: string[]
  tags: string[]
  goals: string[] // Goal IDs for filtering
}

const JOURNAL_CATEGORIES = [
  'Research', 'Planning', 'Strategy', 'Feedback', 'Milestone',
  'Learning', 'Team', 'Product', 'Marketing', 'Finance', 'Personal'
]

const JOURNAL_MOODS = [
  'Excited', 'Motivated', 'Focused', 'Challenged', 'Reflective',
  'Optimistic', 'Grateful', 'Stressed', 'Confident', 'Overwhelmed'
]

export function FilterBar({ onFiltersChange, activeFilters, allEntries, userGoals = [] }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [tagSearch, setTagSearch] = useState("")
  const [availableTags, setAvailableTags] = useState<string[]>([])

  // Extract all unique tags from entries
  useEffect(() => {
    const tagSet = new Set<string>()
    if (allEntries && Array.isArray(allEntries)) {
      allEntries.forEach(entry => {
        if (entry.tags && Array.isArray(entry.tags)) {
          entry.tags.forEach((tag: string) => tagSet.add(tag))
        }
      })
    }
    setAvailableTags(Array.from(tagSet).sort())
  }, [allEntries])

  const hasActiveFilters = activeFilters.categories.length > 0 || 
                          activeFilters.moods.length > 0 || 
                          activeFilters.tags.length > 0 ||
                          activeFilters.goals.length > 0

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked 
      ? [...activeFilters.categories, category]
      : activeFilters.categories.filter(c => c !== category)
    
    onFiltersChange({
      ...activeFilters,
      categories: newCategories
    })
  }

  const handleMoodChange = (mood: string, checked: boolean) => {
    const newMoods = checked 
      ? [...activeFilters.moods, mood]
      : activeFilters.moods.filter(m => m !== mood)
    
    onFiltersChange({
      ...activeFilters,
      moods: newMoods
    })
  }

  const handleTagChange = (tag: string, checked: boolean) => {
    const newTags = checked 
      ? [...activeFilters.tags, tag]
      : activeFilters.tags.filter(t => t !== tag)
    
    onFiltersChange({
      ...activeFilters,
      tags: newTags
    })
  }

  const handleGoalChange = (goalId: string, checked: boolean) => {
    const newGoals = checked 
      ? [...activeFilters.goals, goalId]
      : activeFilters.goals.filter(g => g !== goalId)
    
    onFiltersChange({
      ...activeFilters,
      goals: newGoals
    })
  }

  // Filter tags based on search
  const filteredTags = availableTags.filter(tag => 
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  )

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      moods: [],
      tags: [],
      goals: []
    })
  }

  const removeFilter = (type: 'categories' | 'moods' | 'tags' | 'goals', value: string) => {
    onFiltersChange({
      ...activeFilters,
      [type]: activeFilters[type].filter(item => item !== value)
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter Button and Active Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`${hasActiveFilters ? 'bg-orange-50 border-orange-200 text-orange-700' : ''}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800 text-xs">
                  {activeFilters.categories.length + activeFilters.moods.length + activeFilters.tags.length + activeFilters.goals.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900 dark:text-white">Filter Entries</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Categories */}
              <div>
                <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Categories</h5>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {JOURNAL_CATEGORIES.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={activeFilters.categories.includes(category)}
                        onCheckedChange={(checked) => 
                          handleCategoryChange(category, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`category-${category}`}
                        className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moods */}
              <div>
                <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Moods</h5>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {JOURNAL_MOODS.map((mood) => (
                    <div key={mood} className="flex items-center space-x-2">
                      <Checkbox
                        id={`mood-${mood}`}
                        checked={activeFilters.moods.includes(mood)}
                        onCheckedChange={(checked) => 
                          handleMoodChange(mood, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`mood-${mood}`}
                        className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                      >
                        {mood}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {availableTags.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tags</h5>
                  <div className="space-y-2">
                    <Input
                      placeholder="Search tags..."
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      className="text-sm h-8"
                    />
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {filteredTags.map((tag) => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag}`}
                            checked={activeFilters.tags.includes(tag)}
                            onCheckedChange={(checked) => 
                              handleTagChange(tag, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`tag-${tag}`}
                            className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                          >
                            {tag}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Goals */}
              {userGoals.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Related Goals</h5>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {userGoals.map((goal) => (
                      <div key={goal.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`goal-${goal.id}`}
                          checked={activeFilters.goals.includes(goal.id)}
                          onCheckedChange={(checked) => 
                            handleGoalChange(goal.id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`goal-${goal.id}`}
                          className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer flex items-center"
                        >
                          <Target className="w-3 h-3 mr-1 text-orange-600" />
                          {goal.title.length > 25 ? `${goal.title.substring(0, 25)}...` : goal.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filter Chips */}
        {activeFilters.categories.map((category) => (
          <Badge
            key={`cat-${category}`}
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            📁 {category}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilter('categories', category)}
              className="h-auto p-0 ml-1 text-blue-600 hover:text-blue-800"
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        ))}

        {activeFilters.moods.map((mood) => (
          <Badge
            key={`mood-${mood}`}
            variant="secondary"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          >
            😊 {mood}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilter('moods', mood)}
              className="h-auto p-0 ml-1 text-green-600 hover:text-green-800"
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        ))}

        {activeFilters.tags.map((tag) => (
          <Badge
            key={`tag-${tag}`}
            variant="secondary"
            className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
          >
            <Tag className="w-3 h-3 mr-1" />
            {tag}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilter('tags', tag)}
              className="h-auto p-0 ml-1 text-purple-600 hover:text-purple-800"
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        ))}

        {activeFilters.goals.map((goalId) => {
          const goal = userGoals.find(g => g.id === goalId)
          return goal ? (
            <Badge
              key={`goal-${goalId}`}
              variant="secondary"
              className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
            >
              <Target className="w-3 h-3 mr-1" />
              {goal.title.length > 20 ? `${goal.title.substring(0, 20)}...` : goal.title}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter('goals', goalId)}
                className="h-auto p-0 ml-1 text-orange-600 hover:text-orange-800"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ) : null
        })}
      </div>

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Showing entries matching {activeFilters.categories.length + activeFilters.moods.length + activeFilters.tags.length + activeFilters.goals.length} filter
          {(activeFilters.categories.length + activeFilters.moods.length + activeFilters.tags.length + activeFilters.goals.length) !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}