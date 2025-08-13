import { supabase } from '@/lib/supabase'
import { analyzeJournalEntry, initializeEnhancedAI } from '@/lib/ai'
import type { JournalEntry } from '@/types/journal'
import { getVersionDisplayText } from '@/lib/ai/version'

export class AIMigrationService {
  private static readonly MIGRATION_VERSION_KEY = 'ai_migration_version'
  private static readonly CURRENT_VERSION = 30 // ENHANCED AI v2.0: TF-IDF similarity, negation handling, mood normalization, user learning, business rules

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
      // Initialize the enhanced AI system first
      const initialized = initializeEnhancedAI()
      if (!initialized) {
        console.warn('Enhanced AI system initialization failed, continuing with basic functionality')
      }
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
              // Re-analyze the entry with enhanced AI system
              const aiAnalysis = await analyzeJournalEntry(entry.content, entry.user_id)
              
              // Format sentiment data for database storage
              const sentimentData = {
                primary_mood: aiAnalysis.primary_mood,
                confidence: aiAnalysis.confidence,
                energy: aiAnalysis.energy,
                mood_polarity: aiAnalysis.mood_polarity,
                emotions: [aiAnalysis.primary_mood],
                insights: [
                  `This entry reflects ${aiAnalysis.mood_polarity.toLowerCase()} business momentum and ${aiAnalysis.energy} energy`,
                  `AI analysis shows ${aiAnalysis.confidence >= 80 ? 'high' : aiAnalysis.confidence >= 60 ? 'medium' : 'low'} confidence in mood and category detection`,
                  `Business pattern recognition applied (${aiAnalysis.rules_matched?.length || 0} rules matched)`
                ],
                business_category: aiAnalysis.business_category,
                rules_matched: aiAnalysis.rules_matched || [],
                user_learned: aiAnalysis.user_learned,
                similarity_score: aiAnalysis.similarity_score,
                contrast_penalty: aiAnalysis.contrast_penalty
              }
              
              // Update the entry with new enhanced AI analysis
              const updateData: any = {
                sentiment_data: sentimentData,
                // Update category and mood with new AI analysis (allow AI to override for better accuracy)
                category: this.mapBusinessCategoryToJournal(aiAnalysis.business_category),
                mood: this.mapAIMoodToJournal(aiAnalysis.primary_mood)
              }
              
              // Generate improved title from content if current title is generic
              const isGenericTitle = !entry.title || 
                entry.title.toLowerCase().includes('journal entry') ||
                entry.title.toLowerCase().includes('untitled') ||
                entry.title.trim().length < 5
              
              if (isGenericTitle) {
                const suggestedTitle = this.generateSmartTitle(entry.content, aiAnalysis.business_category, aiAnalysis.primary_mood)
                if (suggestedTitle && suggestedTitle !== entry.title) {
                  updateData.title = suggestedTitle
                  console.log(`📝 Enhanced title: "${entry.title}" → "${suggestedTitle}"`)
                }
              }
              
              const { error: updateError } = await supabase
                .from('journal_entries')
                .update(updateData)
                .eq('id', entry.id)
              
              if (updateError) {
                throw new Error(`Update failed: ${updateError.message}`)
              }
              
              results.success++
              console.log(`✓ Migrated entry: ${updateData.title || entry.title?.substring(0, 50)}...`)
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
      // Lowercase versions (from AI analysis)
      'growth': 'Growth',
      'challenge': 'Challenge', 
      'achievement': 'Achievement',
      'planning': 'Planning',
      'learning': 'Learning',
      'research': 'Research',
      'reflection': 'Learning',
      // Capitalized versions (for consistency)
      'Growth': 'Growth',
      'Challenge': 'Challenge',
      'Achievement': 'Achievement', 
      'Planning': 'Planning',
      'Learning': 'Learning',
      'Research': 'Research'
    }
    return mapping[businessCategory] || businessCategory
  }

  private static mapAIMoodToJournal(aiMood: string): string {
    const mapping: Record<string, string> = {
      'Optimistic': 'Optimistic',
      'Excited': 'Excited',
      'Focused': 'Focused',
      'Frustrated': 'Frustrated',
      'Reflective': 'Reflective',
      'Confident': 'Confident',
      'Determined': 'Determined',
      'Accomplished': 'Accomplished',
      'Thoughtful': 'Thoughtful',
      'Curious': 'Curious',
      'Sad': 'Sad',
      'Tired': 'Tired',
      // Lowercase versions for backwards compatibility
      'optimistic': 'Optimistic',
      'excited': 'Excited',
      'focused': 'Focused',
      'frustrated': 'Frustrated',
      'reflective': 'Reflective',
      'confident': 'Confident',
      'determined': 'Determined',
      'accomplished': 'Accomplished',
      'thoughtful': 'Thoughtful',
      'curious': 'Curious',
      'sad': 'Sad',
      'tired': 'Tired'
    }
    return mapping[aiMood] || aiMood
  }

  // Generate smart titles from content using enhanced logic
  private static generateSmartTitle(content: string, category: string, mood: string): string {
    if (!content?.trim()) return "Journal Entry"
    
    // Remove extra whitespace and get first sentence
    const cleanText = content.trim().replace(/\s+/g, ' ')
    const firstSentence = cleanText.split(/[.!?]/)[0]
    
    // Business context keywords for better titles
    const businessKeywords = {
      growth: ['expanding', 'scaling', 'growing', 'opportunity', 'market'],
      challenge: ['problem', 'issue', 'difficulty', 'obstacle', 'concern'],
      achievement: ['completed', 'finished', 'accomplished', 'success', 'milestone'],
      planning: ['strategy', 'plan', 'roadmap', 'vision', 'goals'],
      learning: ['learned', 'insight', 'understanding', 'discovered', 'realized'],
      research: ['analyzing', 'investigating', 'studying', 'exploring', 'researching']
    }
    
    // Find meaningful words that relate to business context
    const words = firstSentence.toLowerCase().split(' ')
    const categoryKey = category.toLowerCase()
    const relevantKeywords = businessKeywords[categoryKey as keyof typeof businessKeywords] || []
    
    // Look for business-relevant terms
    const hasBusinessContext = words.some(word => 
      relevantKeywords.includes(word) ||
      ['client', 'customer', 'revenue', 'profit', 'team', 'product', 'service', 'business'].includes(word)
    )
    
    // If first sentence is too long, take meaningful part
    if (firstSentence.length > 50) {
      const meaningfulWords = firstSentence.split(' ').filter(word => 
        word.length > 2 && 
        !['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should'].includes(word.toLowerCase())
      )
      
      if (meaningfulWords.length >= 3) {
        const title = meaningfulWords.slice(0, 6).join(' ')
        return hasBusinessContext ? title : `${category}: ${title}`
      }
      
      const title = words.slice(0, 8).join(' ')
      return hasBusinessContext ? title : `${category}: ${title}`
    }
    
    // Return first sentence if reasonable length
    if (firstSentence.length >= 10) {
      return hasBusinessContext ? firstSentence : `${category}: ${firstSentence}`
    }
    
    // Fallback to first few words with category context
    const title = cleanText.split(' ').slice(0, 6).join(' ')
    return hasBusinessContext ? title : `${category}: ${title}`
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
    const aiAnalysis = await analyzeJournalEntry(entry.content, entry.user_id)
    
    const sentimentData = {
      primary_mood: aiAnalysis.primary_mood,
      confidence: aiAnalysis.confidence,
      energy: aiAnalysis.energy,
      mood_polarity: aiAnalysis.mood_polarity,
      emotions: [aiAnalysis.primary_mood],
      insights: [`${getVersionDisplayText()} - Confidence: ${aiAnalysis.confidence}%`],
      business_category: aiAnalysis.business_category,
      rules_matched: aiAnalysis.rules_matched || [],
      user_learned: aiAnalysis.user_learned
    }
    
    const updates = {
      sentiment_data: sentimentData,
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