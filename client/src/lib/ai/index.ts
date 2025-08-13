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

// Main AI analysis function - fully autonomous and specification compliant
export function analyzeJournalEntry(text: string, userId: string): AIAnalysisResult {
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