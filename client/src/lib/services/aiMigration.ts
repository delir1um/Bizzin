import { supabase } from '@/lib/supabase'
import { analyzeBusinessSentimentAI } from '../aiSentimentAnalysis'
import type { JournalEntry } from '@/types/journal'

export class AIMigrationService {
  private static readonly MIGRATION_VERSION_KEY = 'ai_migration_version'
  private static readonly CURRENT_VERSION = 2 // Enhanced local analysis with better business context

  // Check if migration is needed
  static needsMigration(): boolean {
    const currentVersion = localStorage.getItem(this.MIGRATION_VERSION_KEY)
    return !currentVersion || parseInt(currentVersion) < this.CURRENT_VERSION
  }

  // Migrate all existing entries to use latest AI analysis
  static async migrateAllEntries(
    onProgress?: (current: number, total: number, entry: JournalEntry) => void
  ): Promise<{ success: number; failed: number; total: number }> {
    const results = { success: 0, failed: 0, total: 0 }
    
    try {
      // Get all user entries from Supabase directly
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(`Failed to fetch entries: ${error.message}`)
      }
      results.total = entries?.length || 0

      console.log(`Starting AI migration for ${entries?.length || 0} entries...`)

      // Process entries in batches to avoid overwhelming the API
      const batchSize = 5
      for (let i = 0; i < (entries?.length || 0); i += batchSize) {
        const batch = entries?.slice(i, i + batchSize) || []
        
        await Promise.all(
          batch.map(async (entry: JournalEntry, batchIndex: number) => {
            const currentIndex = i + batchIndex
            onProgress?.(currentIndex + 1, results.total, entry)
            
            try {
              // Re-analyze the entry with latest AI
              const aiAnalysis = await analyzeBusinessSentimentAI(entry.content, entry.title)
              
              // Update the entry with new AI analysis
              const { error: updateError } = await supabase
                .from('journal_entries')
                .update({
                  sentiment_data: aiAnalysis,
                  // Optionally update category/mood if they weren't manually overridden
                  category: entry.category === 'Research' ? this.mapBusinessCategoryToJournal(aiAnalysis.business_category) : entry.category,
                  mood: !entry.mood || entry.mood === 'Thoughtful' ? this.mapAIMoodToJournal(aiAnalysis.primary_mood) : entry.mood
                })
                .eq('id', entry.id)
              
              if (updateError) {
                throw new Error(`Update failed: ${updateError.message}`)
              }
              
              results.success++
              console.log(`✓ Migrated entry: ${entry.title?.substring(0, 50)}...`)
            } catch (error) {
              results.failed++
              console.error(`✗ Failed to migrate entry ${entry.id}:`, error)
            }
          })
        )
        
        // Add small delay between batches to be respectful to the API
        if (i + batchSize < (entries?.length || 0)) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      console.log(`Migration complete: ${results.success} success, ${results.failed} failed`)
      
      // Mark migration as complete for this version
      localStorage.setItem(this.MIGRATION_VERSION_KEY, this.CURRENT_VERSION.toString())
      return results
      
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  // Helper functions for mapping (same as other components for consistency)
  private static mapBusinessCategoryToJournal(businessCategory: string): string {
    const mapping: Record<string, string> = {
      'growth': 'Strategy',
      'challenge': 'Challenge',
      'achievement': 'Milestone',
      'planning': 'Planning',
      'reflection': 'Learning'
    }
    return mapping[businessCategory] || 'Strategy'
  }

  private static mapAIMoodToJournal(aiMood: string): string {
    const mapping: Record<string, string> = {
      'optimistic': 'Optimistic',
      'excited': 'Excited',
      'focused': 'Focused',
      'frustrated': 'Frustrated',
      'reflective': 'Reflective',
      'confident': 'Confident',
      'determined': 'Determined',
      'accomplished': 'Motivated',
      'uncertain': 'Thoughtful',
      'stressed': 'Frustrated',
      'sad': 'Reflective',
      'tired': 'Neutral'
    }
    return mapping[aiMood] || aiMood.charAt(0).toUpperCase() + aiMood.slice(1).toLowerCase()
  }

  // Check specific entry needs migration
  static entryNeedsMigration(entry: JournalEntry): boolean {
    // Check if entry has old-style analysis or inconsistent data
    return !entry.sentiment_data || 
           entry.category === 'Research' || // Old default mapping
           !entry.sentiment_data.business_category ||
           entry.sentiment_data.confidence < 40 // Low confidence suggests old local analysis
  }

  // Migrate a single entry
  static async migrateSingleEntry(entry: JournalEntry): Promise<JournalEntry> {
    const aiAnalysis = await analyzeBusinessSentimentAI(entry.content, entry.title)
    
    const updates = {
      sentiment_data: aiAnalysis,
      category: this.mapBusinessCategoryToJournal(aiAnalysis.business_category),
      mood: this.mapAIMoodToJournal(aiAnalysis.primary_mood)
    }
    
    const { error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', entry.id)
    
    if (error) {
      throw new Error(`Failed to update entry: ${error.message}`)
    }
    
    return { ...entry, ...updates }
  }
}