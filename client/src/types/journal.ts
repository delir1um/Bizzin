export type JournalEntry = {
  id: string
  title: string
  content: string
  entry_date?: string // optional custom date for the entry
  mood?: string
  tags: string[]
  category?: string
  created_at: string
  updated_at: string
  user_id: string
  reading_time?: number // estimated reading time in minutes
  related_goal_id?: string // linked goal for cross-feature integration
  sentiment_data?: {
    primary_mood: string
    confidence: number
    energy: string
    emotions: string[]
    insights: string[]
    business_category: string
  }
}

export type CreateJournalEntry = Omit<JournalEntry, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'reading_time'>

export type UpdateJournalEntry = Partial<Omit<JournalEntry, 'id' | 'created_at' | 'updated_at' | 'user_id'>>

export const JOURNAL_MOODS = [
  'Optimistic',
  'Thoughtful', 
  'Inspired',
  'Focused',
  'Frustrated',
  'Excited',
  'Reflective',
  'Motivated',
  'Neutral',
  'Confident',
  'Determined',
  'Conflicted',
  'Curious',
  'Sad',
  'Tired',
  'Stressed',
  'Uncertain',
  'Accomplished'
] as const

export type JournalMood = typeof JOURNAL_MOODS[number]

export const JOURNAL_CATEGORIES = [
  'Research',
  'Planning',
  'Strategy',
  'Feedback',
  'Milestone',
  'Learning',
  'Challenge',
  'Team',
  'Product',
  'Marketing',
  'Finance',
  'Personal'
] as const

export type JournalCategory = typeof JOURNAL_CATEGORIES[number]