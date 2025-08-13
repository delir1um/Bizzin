// Enhanced AI System - Main Entry Point
// Exports all enhanced AI functionality with user learning integration

export * from './types';
export * from './similarity';
export * from './negationHandling';
export * from './moodNormalization';
export * from './userLearningSystem';
export * from './businessRules';
export * from './enhancedTrainingValidator';

import { AITrainingValidator } from './enhancedTrainingValidator';
import { UserLearningSystem } from './userLearningSystem';
import type { UserFeedback } from './types';

// Main AI analysis function with full enhancement pipeline
export async function analyzeJournalEntry(
  text: string,
  userId?: string
): Promise<{
  primary_mood: string;
  business_category: string;
  confidence: number;
  energy: 'high' | 'medium' | 'low';
  mood_polarity: 'Positive' | 'Negative' | 'Neutral';
  rules_matched?: string[];
  similarity_score?: number;
  contrast_penalty?: number;
  user_learned?: boolean;
  training_match_id?: string;
}> {
  // Get base analysis from enhanced validator
  const analysis = AITrainingValidator.analyzeText(text, userId);
  
  // Apply user learning if userId provided
  if (userId) {
    const adjustedAnalysis = UserLearningSystem.adjustPredictionBasedOnHistory(
      text,
      {
        primary_mood: analysis.primary_mood,
        business_category: analysis.business_category,
        confidence: analysis.confidence
      },
      userId
    );
    
    return {
      ...analysis,
      ...adjustedAnalysis,
      training_match_id: analysis.training_match?.id
    };
  }
  
  return {
    ...analysis,
    training_match_id: analysis.training_match?.id
  };
}

// Record user feedback for learning
export function recordUserCorrection(feedback: UserFeedback): void {
  UserLearningSystem.recordUserFeedback(feedback);
}

// Get user learning statistics
export function getUserLearningStats(userId: string) {
  return UserLearningSystem.getUserLearningStats(userId);
}

// Get AI system statistics
export function getAISystemStats() {
  const datasetStats = AITrainingValidator.getDatasetStats();
  const correctionTrends = UserLearningSystem.analyzeCorrectionTrends();
  
  return {
    dataset: datasetStats,
    corrections: correctionTrends,
    systemVersion: '2.0.0' // Enhanced version
  };
}

// Initialize the AI system
export function initializeAISystem(): void {
  // Load user feedback from storage
  UserLearningSystem.loadUserFeedback();
  
  // Pre-warm the training validator
  AITrainingValidator.getDatasetStats();
  
  console.log('Enhanced AI System v2.0 initialized successfully');
}