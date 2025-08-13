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

// Main AI analysis function - Hugging Face first, then autonomous fallback
export async function analyzeJournalEntry(text: string, userId: string): Promise<AIAnalysisResult> {
  // Import the Hugging Face integration
  const { analyzeBusinessSentiment } = await import('../aiSentimentAnalysis');
  
  try {
    console.log('✅ CALLING REAL HUGGING FACE AI MODELS');
    console.log('🚀 Starting AI business sentiment analysis with Hugging Face integration...');
    
    // Try Hugging Face AI models first for actual content understanding
    const huggingFaceResult = await analyzeBusinessSentiment(text, '');
    
    if (huggingFaceResult && huggingFaceResult.confidence >= 70) {
      console.log('✅ REAL HUGGING FACE AI ANALYSIS COMPLETE');
      console.log('Hugging Face AI analysis successful, converting to AIAnalysisResult format');
      
      // Convert BusinessSentiment to AIAnalysisResult format
      const aiResult: AIAnalysisResult = {
        business_category: huggingFaceResult.business_category,
        primary_mood: huggingFaceResult.primary_mood,
        confidence: huggingFaceResult.confidence,
        energy: huggingFaceResult.energy,
        mood_polarity: huggingFaceResult.energy === 'high' ? 'Positive' : 
                      huggingFaceResult.energy === 'low' ? 'Negative' : 'Neutral',
        emotions: huggingFaceResult.emotions || [huggingFaceResult.primary_mood],
        suggested_title: huggingFaceResult.suggested_title,
        rules_matched: [], // Hugging Face doesn't use rules
        user_learned: false,
        analysis_method: 'hugging-face-ai' as const
      };
      
      console.log('Hugging Face analysis complete:', aiResult);
      return aiResult;
    }
    
    console.log('Hugging Face unavailable or low confidence, falling back to autonomous analysis');
  } catch (error) {
    console.warn('Hugging Face analysis failed:', error);
  }
  
  // Fallback to autonomous analyzer
  console.log('Using autonomous analyzer as fallback');
  return analyzeJournalEntryAutonomous(text, userId);
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