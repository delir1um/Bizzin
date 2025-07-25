import type { JournalEntry } from "@/types/journal"

// Centralized utility functions for consistent journal entry display across all components

export function getMoodEmoji(mood: string | null | undefined): string {
  if (!mood) return '📝'
  
  const moodEmojis: Record<string, string> = {
    // Lowercase versions
    'optimistic': '😊',
    'frustrated': '😤',
    'focused': '🎯',
    'reflective': '🤔',
    'confident': '💪',
    'excited': '⚡',
    'determined': '🔥',
    'accomplished': '🏆',
    'thoughtful': '🤔',
    'curious': '🤔',
    'sad': '😢',
    'tired': '😴',
    'conflicted': '😔',
    'stressed': '😰',
    'uncertain': '🤔',
    'neutral': '😐',
    'inspired': '✨',
    'motivated': '🚀',
    'analytical': '🧠',
    // Capitalized versions (from AI)
    'Optimistic': '😊',
    'Frustrated': '😤',
    'Focused': '🎯',
    'Reflective': '🤔',
    'Confident': '💪',
    'Excited': '⚡',
    'Determined': '🔥',
    'Accomplished': '🏆',
    'Thoughtful': '🤔',
    'Curious': '🤔',
    'Sad': '😢',
    'Tired': '😴',
    'Conflicted': '😔',
    'Stressed': '😰',
    'Uncertain': '🤔',
    'Inspired': '✨',
    'Motivated': '🚀',
    'Analytical': '🧠'
  }
  
  return moodEmojis[mood] || moodEmojis[mood.toLowerCase()] || '📝'
}

export function mapAIMoodToJournal(aiMood: string): string {
  const mapping: Record<string, string> = {
    'optimistic': 'Optimistic',
    'excited': 'Excited',
    'focused': 'Focused',
    'frustrated': 'Frustrated',
    'reflective': 'Reflective', 
    'confident': 'Confident',
    'determined': 'Determined',
    'accomplished': 'Accomplished',
    'uncertain': 'Thoughtful',
    'stressed': 'Stressed',
    'neutral': 'Neutral',
    'inspired': 'Inspired',
    'conflicted': 'Conflicted',
    'thoughtful': 'Thoughtful',
    'curious': 'Curious',
    'sad': 'Sad',
    'tired': 'Tired'
  }
  
  const mapped = mapping[aiMood.toLowerCase()]
  if (mapped) return mapped
  
  return aiMood.charAt(0).toUpperCase() + aiMood.slice(1).toLowerCase()
}

export function mapBusinessCategoryToJournal(businessCategory: string): string {
  const mapping: Record<string, string> = {
    'growth': 'Growth',
    'challenge': 'Challenge', 
    'achievement': 'Achievement',
    'planning': 'Planning',
    'reflection': 'Learning',
    'learning': 'Learning',
    'research': 'Research'
  }
  return mapping[businessCategory.toLowerCase()] || 'Learning'
}

export function getDisplayMood(entry: JournalEntry): string {
  return entry.sentiment_data?.primary_mood 
    ? mapAIMoodToJournal(entry.sentiment_data.primary_mood) 
    : entry.mood || ''
}

export function getDisplayCategory(entry: JournalEntry): string {
  return entry.sentiment_data?.business_category 
    ? mapBusinessCategoryToJournal(entry.sentiment_data.business_category) 
    : entry.category || ''
}

export function getDisplayEnergy(entry: JournalEntry): string {
  return entry.sentiment_data?.energy || 'medium'
}

export function getDisplayMoodEmoji(entry: JournalEntry): string {
  const displayMood = getDisplayMood(entry)
  return getMoodEmoji(displayMood)
}

// Single source of truth for all entry display data
export function getEntryDisplayData(entry: JournalEntry) {
  return {
    mood: getDisplayMood(entry),
    category: getDisplayCategory(entry),
    energy: getDisplayEnergy(entry),
    moodEmoji: getDisplayMoodEmoji(entry)
  }
}