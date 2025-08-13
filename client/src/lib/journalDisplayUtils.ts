import type { JournalEntry } from "@/types/journal"

// Centralized utility functions for consistent journal entry display across all components

export function getMoodEmoji(mood: string | null | undefined): string {
  if (!mood) return '😐'
  
  const moodEmojis: Record<string, string> = {
    // All emotional facial expressions - no objects
    // Lowercase versions
    'optimistic': '😊',
    'frustrated': '😤',
    'focused': '😌',        // Changed from 🎯 to calm/focused face
    'reflective': '🤔',
    'confident': '😎',      // Changed from 💪 to confident/cool face
    'excited': '😃',        // Changed from ⚡ to excited face
    'determined': '😤',     // Changed from 🔥 to determined face
    'accomplished': '😊',   // Changed from 🏆 to proud/happy face
    'thoughtful': '🤔',
    'curious': '🤨',        // Changed to raised eyebrow curious face
    'sad': '😢',
    'tired': '😴',
    'conflicted': '😔',
    'stressed': '😰',
    'uncertain': '😕',      // Changed from 🤔 to uncertain face
    'neutral': '😐',
    'inspired': '😍',       // Changed from ✨ to inspired face
    'motivated': '😤',      // Changed from 🚀 to motivated face
    'analytical': '🤔',     // Changed from 🧠 to analytical face
    'strategic': '🤔',      // Changed from 📊 to strategic thinking face
    'planning': '🤔',       // Changed from 📋 to planning face
    'growth': '😊',         // Changed from 📈 to happy growth face
    'worried': '😟',
    'proud': '😌',
    'pleased': '😊',
    'relieved': '😌',
    'energised': '😃',
    'encouraged': '😊',
    'hopeful': '🙂',
    'positive': '😊',
    'methodical': '😌',
    'organised': '😊',
    'practical': '🙂',
    'prepared': '😌',
    'resolved': '😌',
    'insightful': '🤔',
    'humbled': '😔',
    'balanced': '😌',
    'observant': '🤨',
    'inquisitive': '🤔',
    'investigative': '🤔',
    'exploratory': '🤔',
    'pragmatic': '😌',
    'open-minded': '🙂',
    // Capitalized versions (from AI)
    'Optimistic': '😊',
    'Frustrated': '😤',
    'Focused': '😌',
    'Reflective': '🤔',
    'Confident': '😎',
    'Excited': '😃',
    'Determined': '😤',
    'Accomplished': '😊',
    'Thoughtful': '🤔',
    'Curious': '🤨',
    'Sad': '😢',
    'Tired': '😴',
    'Conflicted': '😔',
    'Stressed': '😰',
    'Uncertain': '😕',
    'Inspired': '😍',
    'Motivated': '😤',
    'Analytical': '🤔',
    'Strategic': '🤔',
    'Planning': '🤔',
    'Growth': '😊',
    'Worried': '😟',
    'Proud': '😌',
    'Pleased': '😊',
    'Relieved': '😌',
    'Energised': '😃',
    'Encouraged': '😊',
    'Hopeful': '🙂',
    'Positive': '😊',
    'Methodical': '😌',
    'Organised': '😊',
    'Practical': '🙂',
    'Prepared': '😌',
    'Resolved': '😌',
    'Insightful': '🤔',
    'Humbled': '😔',
    'Balanced': '😌',
    'Observant': '🤨',
    'Inquisitive': '🤔',
    'Investigative': '🤔',
    'Exploratory': '🤔',
    'Pragmatic': '😌',
    'Open-minded': '🙂'
  }
  
  return moodEmojis[mood] || moodEmojis[mood.toLowerCase()] || '😐'
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
    'tired': 'Tired',
    'strategic': 'Strategic'
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
  // Prioritize manual user edits over AI sentiment data
  return entry.mood || (entry.sentiment_data?.primary_mood 
    ? mapAIMoodToJournal(entry.sentiment_data.primary_mood) 
    : '')
}

export function getDisplayCategory(entry: JournalEntry): string {
  // Prioritize manual user edits over AI sentiment data
  return entry.category || (entry.sentiment_data?.business_category 
    ? mapBusinessCategoryToJournal(entry.sentiment_data.business_category) 
    : '')
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