import { supabase } from '@/lib/supabase'
import type { JournalEntry, CreateJournalEntry, UpdateJournalEntry } from '@/types/journal'
import { analyzeBusinessSentiment } from '@/lib/sentimentAnalysis'

export class JournalService {
  static async getUserEntries(userId: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching journal entries:', error)
      throw new Error(`Failed to fetch journal entries: ${error.message}`)
    }

    return data || []
  }

  static async searchEntries(userId: string, searchTerm: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching journal entries:', error)
      throw new Error(`Failed to search journal entries: ${error.message}`)
    }

    return data || []
  }

  static async getEntriesByDateRange(userId: string, startDate: string, endDate: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching entries by date range:', error)
      throw new Error(`Failed to fetch entries by date: ${error.message}`)
    }

    return data || []
  }

  static async createEntry(entry: CreateJournalEntry): Promise<JournalEntry> {
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Calculate reading time (rough estimate: 200 words per minute)
      const wordCount = entry.content.split(/\s+/).length
      const readingTime = Math.max(1, Math.ceil(wordCount / 200))

      // Analyze business sentiment
      const sentiment = analyzeBusinessSentiment(entry.content, entry.title)
      const sentimentData = {
        primary_mood: sentiment.mood.primary,
        confidence: sentiment.mood.confidence,
        energy: sentiment.mood.energy,
        emotions: sentiment.mood.emotions,
        insights: sentiment.insights,
        business_category: sentiment.category
      }

      // Create entry data with full schema (works after proper database setup)
      const entryWithUserId = {
        title: entry.title,
        content: entry.content,
        user_id: user.id,
        mood: entry.mood || sentiment.mood.primary, // Use AI mood if no manual mood set
        category: entry.category || null,
        tags: entry.tags || null,
        related_goal_id: entry.related_goal_id || null, // Add goal linking support
        reading_time: readingTime,
        sentiment_data: sentimentData,
      }

      console.log('Creating journal entry for user:', user.id)

      const { data, error } = await supabase
        .from('journal_entries')
        .insert([entryWithUserId])
        .select()
        .single()

      if (error) {
        console.error('Error creating journal entry:', error)
        throw new Error(`Failed to create journal entry: ${error.message}`)
      }

      return data
    } catch (err) {
      console.error('Error in createEntry:', err)
      throw err
    }
  }

  static async updateEntry(entryId: string, updates: UpdateJournalEntry): Promise<JournalEntry> {
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('Updating journal entry:', entryId, 'for user:', user.id)

      // Recalculate reading time and sentiment if content is being updated
      let updateData = { ...updates }
      if (updates.content || updates.title) {
        if (updates.content) {
          const wordCount = updates.content.split(/\s+/).length
          updateData.reading_time = Math.max(1, Math.ceil(wordCount / 200))
        }
        
        // Re-analyze sentiment for updated content
        const content = updates.content || ''
        const title = updates.title || ''
        if (content || title) {
          const sentiment = analyzeBusinessSentiment(content, title)
          updateData.sentiment_data = {
            primary_mood: sentiment.mood.primary,
            confidence: sentiment.mood.confidence,
            energy: sentiment.mood.energy,
            emotions: sentiment.mood.emotions,
            insights: sentiment.insights,
            business_category: sentiment.category
          }
          
          // Update mood if not manually set
          if (!updates.mood) {
            updateData.mood = sentiment.mood.primary
          }
        }
      }

      // Remove any undefined fields
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      )

      console.log('Cleaned update data:', cleanUpdateData)

      // Update entry with user authentication - RLS will ensure user can only update their own entries
      const { data, error } = await supabase
        .from('journal_entries')
        .update(cleanUpdateData)
        .eq('id', entryId)
        .eq('user_id', user.id)  // Ensure user can only update their own entries
        .select()
        .single()

      if (error) {
        console.error('Supabase error updating journal entry:', error)
        if (error.code === 'PGRST116') {
          throw new Error('Journal entry not found or you do not have permission to update it.')
        }
        throw new Error(`Failed to update journal entry: ${error.message}`)
      }

      if (!data) {
        throw new Error('No data returned after update')
      }

      return data
    } catch (err) {
      console.error('Error in updateEntry:', err)
      throw err
    }
  }

  static async deleteEntry(entryId: string): Promise<void> {
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('Deleting journal entry:', entryId, 'for user:', user.id)

      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id)  // Ensure user can only delete their own entries

      if (error) {
        console.error('Error deleting journal entry:', error)
        if (error.code === 'PGRST116') {
          throw new Error('Journal entry not found or you do not have permission to delete it.')
        }
        throw new Error(`Failed to delete journal entry: ${error.message}`)
      }
    } catch (err) {
      console.error('Error in deleteEntry:', err)
      throw err
    }
  }

  static async getEntryStats(userId: string): Promise<{
    totalEntries: number
    totalWords: number
    avgEntriesPerWeek: number
    mostUsedTags: string[]
  }> {
    try {
      const entries = await this.getUserEntries(userId)
      
      const totalEntries = entries.length
      const totalWords = entries.reduce((sum, entry) => {
        return sum + entry.content.split(/\s+/).length
      }, 0)

      // Calculate average entries per week (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentEntries = entries.filter(entry => 
        new Date(entry.created_at) > thirtyDaysAgo
      )
      const avgEntriesPerWeek = (recentEntries.length / 30) * 7

      // Get most used tags
      const tagCounts: Record<string, number> = {}
      entries.forEach(entry => {
        entry.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      })
      const mostUsedTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag)

      return {
        totalEntries,
        totalWords,
        avgEntriesPerWeek: Math.round(avgEntriesPerWeek * 10) / 10,
        mostUsedTags
      }
    } catch (err) {
      console.error('Error getting entry stats:', err)
      throw err
    }
  }
}