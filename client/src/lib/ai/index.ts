// Autonomous AI System v3.0 - Specification Compliant (Main Entry Point)
// Implements full PDF specification: TF-IDF+bigrams, rules, negation, mood normalization, production-safe learning

export * from './types';
export * from './negationHandling';  
export * from './tfidfSimilarity';
export * from './advancedMoodNormalizer';
export * from './productionSafeLearning';

import { analyzeJournalEntryAutonomous, validateAutonomousSystem } from './autonomousAnalyzer';
import { ProductionSafeLearningSystem } from './productionSafeLearning';
import type { UserFeedback, AIAnalysisResult } from './types';

// Main AI analysis function - Hugging Face server API first, then autonomous fallback
export async function analyzeJournalEntry(text: string, userId: string): Promise<AIAnalysisResult> {
  try {
    // Primary analysis: Call Hugging Face API endpoint directly
    console.log('🚀 Calling server-side Hugging Face API for:', text.substring(0, 50) + '...')
    
    const response = await fetch('/api/huggingface/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    })

    if (response.ok) {
      const hfResult = await response.json()
      console.log('✅ Server-side Hugging Face analysis successful:', hfResult)
      
      // Convert Hugging Face server result to our expected format
      const result: AIAnalysisResult = {
        primary_mood: hfResult.primary_mood,
        confidence: hfResult.confidence,
        energy: hfResult.energy,
        mood_polarity: hfResult.primary_mood === 'excited' || hfResult.primary_mood === 'confident' || hfResult.primary_mood === 'optimistic' ? 'Positive' : 
                       hfResult.primary_mood === 'frustrated' || hfResult.primary_mood === 'stressed' || hfResult.primary_mood === 'concerned' ? 'Negative' : 'Neutral',
        emotions: hfResult.emotions || [hfResult.primary_mood],
        business_category: hfResult.business_category,
        insights: hfResult.insights || [], // Use server-generated insights directly
        rules_matched: [],
        user_learned: false,
        analysis_method: 'hugging-face-ai'
      }
      
      console.log('Hugging Face AI analysis successful:', result)
      console.log('Hugging Face analysis complete:', result)
      
      return result
    } else {
      console.warn('Hugging Face API failed, falling back to local analysis')
    }
  } catch (error) {
    console.warn('Hugging Face server analysis failed:', error)
  }
  
  // Fallback to autonomous analyzer with basic insights
  console.log('Using autonomous analyzer as fallback');
  const fallbackResult = analyzeJournalEntryAutonomous(text, userId);
  
  // Add basic insights for fallback
  if (!fallbackResult.insights || fallbackResult.insights.length === 0) {
    fallbackResult.insights = [
      "Your business experience is valuable data. Document these moments to build stronger strategic thinking.",
      "Entrepreneurial intuition develops through pattern recognition. Each experience strengthens your judgment."
    ]
  }
  
  return fallbackResult;
}

// System validation
export { validateAutonomousSystem };

// Record user feedback for learning
export function recordUserCorrection(feedback: UserFeedback): void {
  ProductionSafeLearningSystem.recordUserFeedback(feedback);
}

// Initialize autonomous AI system v3.0
export function initializeEnhancedAI(): boolean {
  console.log('Autonomous AI System v3.0 initialized with full specification compliance');
  ProductionSafeLearningSystem.loadUserFeedback();
  
  // Run validation to ensure system is working
  const isValid = validateAutonomousSystem();
  if (!isValid) {
    console.warn('Autonomous AI v3.0: System validation detected issues');
  }
  
  return isValid;
}

// Alias for compatibility (exact case match)
export const initializeAISystem = initializeEnhancedAI;