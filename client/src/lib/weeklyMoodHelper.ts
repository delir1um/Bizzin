import { isThisWeek } from 'date-fns'
import type { JournalEntry } from '@/types/journal'

/**
 * Calculates the weekly dominant mood from journal entries
 * Uses consistent logic across dashboard and journal page components
 */
export function getWeeklyDominantMood(entries: JournalEntry[]): string {
  // Filter entries from this week - use entry_date first, fallback to created_at
  const thisWeekEntries = entries.filter(entry => 
    isThisWeek(new Date(entry.entry_date || entry.created_at))
  )
  
  // Extract moods - try AI sentiment first, fallback to manual mood
  const weeklyMoods = thisWeekEntries
    .map(entry => entry.sentiment_data?.primary_mood || entry.mood)
    .filter(Boolean)
  
  // Count mood occurrences
  const moodCounts = weeklyMoods.reduce((acc: Record<string, number>, mood) => {
    acc[mood!] = (acc[mood!] || 0) + 1
    return acc
  }, {})
  
  // Get the most common mood, default to 'Neutral' if no moods found
  const dominantMood = Object.entries(moodCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Neutral'
  
  return dominantMood
}