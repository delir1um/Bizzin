// Enhanced AI System v2.0 - Main Entry Point
// Implements specification-compliant TF-IDF, negation handling, mood normalization, and business rules

export * from './types';
export * from './negationHandling';
export * from './moodNormalization';
export * from './userLearningSystem';
export * from './enhancedAnalyzer';

import { analyzeJournalEntryEnhanced } from './enhancedAnalyzer';
import { UserLearningSystem } from './userLearningSystem';
import type { UserFeedback, AIAnalysisResult } from './types';

// Main AI analysis function with full enhancement pipeline
export async function analyzeJournalEntry(
  text: string,
  userId: string
): Promise<AIAnalysisResult> {
  return analyzeJournalEntryEnhanced(text, userId);
}

// Record user feedback for learning
export function recordUserCorrection(feedback: UserFeedback): void {
  UserLearningSystem.recordUserFeedback(feedback);
}

// Initialize enhanced AI system
export function initializeEnhancedAI(): boolean {
  console.log('Enhanced AI System v2.0 initialized successfully');
  UserLearningSystem.loadUserFeedback();
  return true;
}

// Alias for compatibility (exact case match)
export const initializeAISystem = initializeEnhancedAI;