import { supabase } from '@/lib/supabase'
import type { JournalEntry, CreateJournalEntry, UpdateJournalEntry } from '@/types/journal'
import { analyzeJournalEntry } from '@/lib/ai'
import { aiBusinessCoach } from '@/lib/aiBusinessCoach'
import type { AIAnalysisResult } from '@/lib/ai/types'

// Generate contextual business insights based on AI analysis results
function generateContextualInsights(aiAnalysis: AIAnalysisResult, content: string): string[] {
  const insights: string[] = [];
  const lowerContent = content.toLowerCase();
  const category = aiAnalysis.business_category.toLowerCase();
  const mood = aiAnalysis.primary_mood.toLowerCase();
  const confidence = aiAnalysis.confidence;
  
  // Financial/funding-related insights (most specific)
  if (lowerContent.includes('funding') || lowerContent.includes('investment') || lowerContent.includes('investor') || 
      lowerContent.includes('funds') || lowerContent.includes('capital') || lowerContent.includes('money') || 
      lowerContent.includes('cash flow') || lowerContent.includes('financial') || lowerContent.includes('budget')) {
    
    if (lowerContent.includes('worried') || lowerContent.includes('concern') || lowerContent.includes('trouble')) {
      insights.push("Financial concerns are normal for entrepreneurs. Create a detailed cash flow forecast and identify your 3 most critical revenue drivers to focus on.");
      insights.push("Turn financial pressure into operational clarity. The businesses that survive cash crunches emerge stronger and more efficient.");
    } else if (lowerContent.includes('series a') || lowerContent.includes('seed') || lowerContent.includes('raised')) {
      insights.push("Fundraising is a full-time job that pauses building. Set clear timelines, prepare thoroughly, and get back to customers fast.");
      insights.push("New funding means new accountability. Use this capital to prove your business model works at scale, not just to extend runway.");
    } else {
      insights.push("Funding is fuel, not validation. Stay focused on unit economics and customer satisfaction - investors bet on execution, not ideas.");
      insights.push("Smart money management separates successful startups from failures. Every dollar should drive measurable business growth.");
    }
  }
  
  // Team/hiring-related insights
  else if (lowerContent.includes('team') || lowerContent.includes('hiring') || lowerContent.includes('employees') || 
           lowerContent.includes('staff') || lowerContent.includes('onboard')) {
    if (category === 'growth') {
      insights.push("Growth creates new problems - this is progress, not failure. Scale your systems before scaling your team.");
      insights.push("Great teams aren't built by hiring fast - they're built by hiring intentionally. Culture scales harder than code.");
    } else if (category === 'planning') {
      insights.push("Strategic thinking separates entrepreneurs from operators. Your planning today determines your opportunities tomorrow.");
      insights.push("Hiring roadmaps reveal business strategy. Who you hire next shows where you're betting the company will grow.");
    } else {
      insights.push("Team building is product building. The people you choose determine the solutions you can create.");
      insights.push("Every hire changes company DNA. Choose people who elevate the team's collective ability to solve hard problems.");
    }
  }
  
  // Product/launch-related insights
  else if (lowerContent.includes('product') || lowerContent.includes('launch') || lowerContent.includes('feature') || 
           lowerContent.includes('release') || lowerContent.includes('build')) {
    if (category === 'achievement') {
      insights.push("Celebrate wins, then dissect them. Understanding why things work is more valuable than the success itself.");
      insights.push("Product launches are learning experiments. The real work begins after customers start using what you built.");
    } else {
      insights.push("Product decisions compound over time. What feels like a small choice today becomes infrastructure tomorrow.");
      insights.push("Build for the problem, not the solution you fell in love with. Customer feedback should reshape your roadmap continuously.");
    }
  }
  
  // Category-specific insights (fallback)
  else if (category === 'challenge') {
    if (confidence >= 85) {
      insights.push("Every challenge is market research disguised as a problem that your competitors haven't solved yet. Document what you're learning and how you're solving these issues - these insights become your competitive advantage. The businesses that emerge stronger from difficulties often capture market share from those that struggle.");
    } else {
      insights.push("Obstacles reveal critical gaps between your vision and current execution capabilities. Use this tension to build stronger systems, clearer processes, and more resilient operations. The challenges you face today predict the competitive advantages you'll need tomorrow.");
    }
  }
  
  else if (category === 'growth') {
    if (confidence >= 85) {
      insights.push("Growth creates new problems - this is progress, not failure, and signals market demand for your solution. Scale your systems, processes, and team capacity before you desperately need them. The companies that scale successfully automate operations before they accelerate growth initiatives.");
    } else {
      insights.push("Sustainable growth comes from repeatable processes and clear operational discipline rather than heroic individual efforts. Focus intensely on what's working and systematically eliminate what isn't contributing to results. Growth without proper systems creates chaos that limits your future potential.");
    }
  }
  
  else if (category === 'achievement') {
    insights.push("Celebrate wins briefly, then dissect them thoroughly to understand the underlying success patterns. Understanding why things work and what conditions enabled success is more valuable than the achievement itself. These insights become the foundation for repeating and scaling future victories.");
  }
  
  else if (category === 'planning') {
    insights.push("Strategic thinking separates successful entrepreneurs from busy operators who react rather than lead. Your planning decisions today directly determine the opportunities and challenges you'll face tomorrow. Build comprehensive frameworks that adapt to changing market conditions rather than rigid predictions that break under pressure.");
  }
  
  else if (category === 'learning') {
    insights.push("Learning velocity accelerates decision-making quality and reduces the cost of future mistakes. Every insight you gain today shortens tomorrow's learning curve and improves your strategic judgment. Continuous learning becomes sustainable competitive advantage when properly documented and applied across your organization.");
  }
  
  else if (category === 'research') {
    insights.push("Research transforms dangerous assumptions into data-driven decisions that reduce risk and improve success rates. The time you invest in understanding your market, customers, and competition compounds over time into better strategic judgment. Market research isn't academic exercise - it's competitive intelligence that informs better resource allocation and strategic positioning.");
  }
  
  else {
    insights.push("Your business experience is valuable data that becomes strategic advantage when properly analyzed and applied. Document these moments and the lessons they contain to build stronger strategic thinking and more confident decision-making abilities. Entrepreneurial intuition develops through careful pattern recognition - each experience you document strengthens your business judgment and competitive positioning.");
  }
  
  return insights;
}

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

      // Analyze with enhanced AI system (Hugging Face first, then autonomous fallback)
      const aiAnalysis = await analyzeJournalEntry(entry.content, user.id)
      
      console.log('Using production AI analysis results:', {
        category: aiAnalysis.business_category,
        mood: aiAnalysis.primary_mood,
        energy: aiAnalysis.energy,
        confidence: aiAnalysis.confidence,
        rulesMatched: aiAnalysis.rules_matched?.length || 0,
        aiHeading: aiAnalysis.ai_heading || 'No AI heading generated'
      });
      
      // Use AI-generated heading if no title provided, otherwise use user title
      const finalTitle = entry.title && entry.title.trim() ? entry.title : (aiAnalysis.ai_heading || 'Business journal entry');
      
      // Use insights directly from AI analysis (already generated by Hugging Face server)
      const insights = aiAnalysis.insights && aiAnalysis.insights.length > 0 ? 
        aiAnalysis.insights : generateContextualInsights(aiAnalysis, entry.content);
      
      const sentimentData = {
        primary_mood: aiAnalysis.primary_mood,
        confidence: aiAnalysis.confidence,
        energy: aiAnalysis.energy,
        mood_polarity: aiAnalysis.mood_polarity,
        emotions: [aiAnalysis.primary_mood],
        insights: insights,
        business_category: aiAnalysis.business_category,
        rules_matched: aiAnalysis.rules_matched || [],
        user_learned: aiAnalysis.user_learned || false,
        analysis_method: aiAnalysis.analysis_source === 'hugging-face-server' ? 'hugging-face-ai' : 'fallback-analysis'
      }

      // Create entry data with AI-enhanced title
      const entryWithUserId = {
        title: finalTitle,
        content: entry.content,
        // entry_date: entry.entry_date || null, // Commented out until database migration
        user_id: user.id,
        mood: entry.mood || aiAnalysis.primary_mood, // Use AI mood if no manual mood set
        category: entry.category || null,
        tags: entry.tags || null,

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

      // Initialize and analyze with AI Business Coach
      try {
        await aiBusinessCoach.initializeMemory(user.id)
        await aiBusinessCoach.analyzeEntry(data)
        console.log('AI Business Coach analysis completed')
      } catch (coachError) {
        console.warn('AI Business Coach analysis failed:', coachError)
        // Don't fail the entry creation if coaching analysis fails
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
          const aiAnalysis = await analyzeJournalEntry(content, user.id)
          
          // Use AI-generated heading if title is being updated but left empty
          if (updates.title === '' && content) {
            updateData.title = aiAnalysis.ai_heading || 'Business journal entry';
          }
          
          // Use insights directly from AI analysis (already generated by Hugging Face server)
          const insights = aiAnalysis.insights && aiAnalysis.insights.length > 0 ? 
            aiAnalysis.insights : generateContextualInsights(aiAnalysis, content);
          
          updateData.sentiment_data = {
            primary_mood: aiAnalysis.primary_mood,
            confidence: aiAnalysis.confidence,
            energy: aiAnalysis.energy,
            mood_polarity: aiAnalysis.mood_polarity,
            emotions: [aiAnalysis.primary_mood],
            insights: insights,
            business_category: aiAnalysis.business_category,
            rules_matched: aiAnalysis.rules_matched || [],
            user_learned: aiAnalysis.user_learned || false,
            analysis_method: aiAnalysis.analysis_source === 'hugging-face-server' ? 'hugging-face-ai' : 'fallback-analysis'
          }
          
          // Update mood if not manually set
          if (!updates.mood) {
            updateData.mood = aiAnalysis.primary_mood
          }
        }
      }

      // Remove any undefined fields, but keep null values (needed for unlinking goals)
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

  // Re-analyze all journal entries with latest AI logic
  static async reAnalyzeAllEntries(): Promise<{
    total: number
    updated: number
    errors: number
    status: string
  }> {
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('Starting bulk re-analysis for user:', user.id)

      // Get all user entries
      const { data: entries, error: fetchError } = await supabase
        .from('journal_entries')
        .select('id, content, title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw new Error(`Failed to fetch entries: ${fetchError.message}`)
      }

      if (!entries || entries.length === 0) {
        return {
          total: 0,
          updated: 0,
          errors: 0,
          status: 'No entries found to re-analyze'
        }
      }

      let updated = 0
      let errors = 0

      console.log(`Re-analyzing ${entries.length} journal entries with enhanced AI v3.0...`)

      // Process entries in batches to avoid overwhelming the system
      const batchSize = 5
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (entry) => {
          try {
            // Analyze with enhanced AI system
            const aiAnalysis = await analyzeJournalEntry(entry.content, user.id)
            
            // Generate contextual business insights based on AI analysis
            const insights = generateContextualInsights(aiAnalysis, entry.content);
            
            // Create updated sentiment data with enhanced insights
            const sentimentData = {
              primary_mood: aiAnalysis.primary_mood,
              confidence: aiAnalysis.confidence,
              energy: aiAnalysis.energy,
              mood_polarity: aiAnalysis.mood_polarity,
              emotions: [aiAnalysis.primary_mood],
              insights: insights,
              business_category: aiAnalysis.business_category,
              rules_matched: aiAnalysis.rules_matched || [],
              user_learned: aiAnalysis.user_learned || false
            }

            // Update entry with new analysis
            const { error: updateError } = await supabase
              .from('journal_entries')
              .update({
                sentiment_data: sentimentData,
                mood: aiAnalysis.primary_mood
              })
              .eq('id', entry.id)
              .eq('user_id', user.id)

            if (updateError) {
              console.error(`Failed to update entry ${entry.id}:`, updateError)
              errors++
            } else {
              updated++
              console.log(`✓ Re-analyzed entry ${entry.id}: ${aiAnalysis.business_category}/${aiAnalysis.primary_mood} (${aiAnalysis.confidence}%)`)
            }
          } catch (analysisError) {
            console.error(`Error analyzing entry ${entry.id}:`, analysisError)
            errors++
          }
        })

        // Wait for batch to complete
        await Promise.all(batchPromises)
        
        // Small delay between batches to be gentle on the system
        if (i + batchSize < entries.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      console.log(`Re-analysis complete: ${updated} entries updated, ${errors} errors`)
      
      const result = {
        total: entries.length,
        updated,
        errors,
        status: errors > 0 ? 'Completed with some errors' : 'Successfully completed'
      }
      
      console.log('Returning re-analysis result:', result)
      return result

    } catch (err) {
      console.error('Error in bulk re-analysis:', err)
      // Return a proper error result instead of throwing
      return {
        total: 0,
        updated: 0,
        errors: 1,
        status: `Failed: ${(err as Error).message || 'Unknown error'}`
      }
    }
  }

  static async clearAllEntries(): Promise<void> {
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('Clearing all journal entries for user:', user.id)

      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Error clearing all journal entries:', error)
        throw new Error(`Failed to clear journal entries: ${error.message}`)
      }
    } catch (err) {
      console.error('Error in clearAllEntries:', err)
      throw err
    }
  }
}