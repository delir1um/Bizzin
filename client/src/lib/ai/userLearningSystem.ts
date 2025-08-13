// Production-safe user learning system
// Implements advanced user feedback learning from the improvement spec

import type { UserFeedback, Category } from './types';
import { TFIDF } from './similarity';
import { contrastPenalty } from './negationHandling';

export class UserLearningSystem {
  private static userCorrections: UserFeedback[] = [];
  private static readonly MAX_CORRECTIONS = 1000;
  private static initialized = false;

  static recordUserFeedback(feedback: UserFeedback): void {
    this.ensureInitialized();
    
    // Add timestamp if not provided
    if (!feedback.timestamp_iso) {
      feedback.timestamp_iso = new Date().toISOString();
    }
    
    this.userCorrections.push(feedback);
    
    // Maintain size limit
    if (this.userCorrections.length > this.MAX_CORRECTIONS) {
      this.userCorrections.shift();
    }
    
    this.persistToStorage();
  }

  static loadUserFeedback(): void {
    if (this.initialized) return;
    
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('ai_user_corrections');
        if (stored) {
          const corrections = JSON.parse(stored);
          if (Array.isArray(corrections)) {
            this.userCorrections = corrections;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load user feedback from storage:', error);
      this.userCorrections = [];
    }
    
    this.initialized = true;
  }

  private static ensureInitialized(): void {
    if (!this.initialized) {
      this.loadUserFeedback();
    }
  }

  private static persistToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('ai_user_corrections', JSON.stringify(this.userCorrections));
      }
    } catch (error) {
      console.warn('Failed to persist user feedback to storage:', error);
    }
  }

  static getUserPatterns(userId: string): UserFeedback[] {
    this.ensureInitialized();
    return this.userCorrections.filter(f => f.user_id === userId);
  }

  static adjustPredictionBasedOnHistory(
    text: string,
    predicted: { 
      primary_mood: string; 
      business_category: string;
      confidence: number; 
    },
    userId: string
  ): { 
    primary_mood: string; 
    business_category: string;
    confidence: number;
    user_learned?: boolean;
  } {
    this.ensureInitialized();
    
    const patterns = this.getUserPatterns(userId);
    if (!patterns.length) return predicted;

    // Focus on most recent corrections
    const recent = patterns.slice(-200);
    let best: { fb: UserFeedback; sim: number } | null = null;
    
    // Find most similar correction
    for (const fb of recent) {
      const sim = TFIDF.calculateSimilarity(
        text.toLowerCase(),
        fb.text_content.toLowerCase()
      );
      if (!best || sim > best.sim) {
        best = { fb, sim };
      }
    }

    // Apply correction if similarity is high enough
    if (!best || best.sim < 0.40) return predicted;

    const adj = { ...predicted };
    
    // Apply category correction
    if (best.fb.feedback_type !== 'mood_correction') {
      adj.business_category = best.fb.corrected_category.toLowerCase();
    }
    
    // Apply mood correction
    if (best.fb.feedback_type !== 'category_correction' && best.fb.corrected_mood) {
      adj.primary_mood = best.fb.corrected_mood;
    }

    // Confidence adjustment based on similarity and contrast
    const penalty = contrastPenalty(text);
    const similarityBoost = Math.round(best.sim * 20);
    const penaltyReduction = Math.round(penalty * 100);
    
    adj.confidence = Math.min(95, Math.max(40, 
      predicted.confidence + similarityBoost - penaltyReduction
    ));
    
    (adj as any).user_learned = true;
    return adj;
  }

  // Get learning statistics for user
  static getUserLearningStats(userId: string): {
    totalCorrections: number;
    categoryCorrections: number;
    moodCorrections: number;
    avgConfidenceImprovement: number;
    mostCorrectedCategory: string | null;
  } {
    this.ensureInitialized();
    
    const patterns = this.getUserPatterns(userId);
    const categoryCorrections = patterns.filter(f => 
      f.feedback_type === 'category_correction' || f.feedback_type === 'both'
    );
    const moodCorrections = patterns.filter(f => 
      f.feedback_type === 'mood_correction' || f.feedback_type === 'both'
    );
    
    // Calculate most corrected category
    const categoryMap = new Map<string, number>();
    categoryCorrections.forEach(c => {
      const key = c.corrected_category;
      categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
    });
    
    const mostCorrected = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalCorrections: patterns.length,
      categoryCorrections: categoryCorrections.length,
      moodCorrections: moodCorrections.length,
      avgConfidenceImprovement: 15, // Estimated improvement
      mostCorrectedCategory: mostCorrected ? mostCorrected[0] : null
    };
  }

  // Analyze correction patterns to improve AI
  static analyzeCorrectionTrends(): {
    commonCategoryMistakes: Array<{from: Category, to: Category, count: number}>;
    commonMoodMistakes: Array<{from: string, to: string, count: number}>;
    improvementAreas: string[];
  } {
    this.ensureInitialized();
    
    const categoryMistakes = new Map<string, number>();
    const moodMistakes = new Map<string, number>();
    
    for (const correction of this.userCorrections) {
      if (correction.feedback_type !== 'mood_correction') {
        const key = `${correction.original_category}->${correction.corrected_category}`;
        categoryMistakes.set(key, (categoryMistakes.get(key) || 0) + 1);
      }
      
      if (correction.feedback_type !== 'category_correction') {
        const key = `${correction.original_mood}->${correction.corrected_mood}`;
        moodMistakes.set(key, (moodMistakes.get(key) || 0) + 1);
      }
    }
    
    const commonCategoryMistakes = Array.from(categoryMistakes.entries())
      .map(([key, count]) => {
        const [from, to] = key.split('->');
        return { from: from as Category, to: to as Category, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const commonMoodMistakes = Array.from(moodMistakes.entries())
      .map(([key, count]) => {
        const [from, to] = key.split('->');
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Identify improvement areas
    const improvementAreas: string[] = [];
    if (commonCategoryMistakes.length > 0) {
      improvementAreas.push(`Category classification (most confused: ${commonCategoryMistakes[0].from} -> ${commonCategoryMistakes[0].to})`);
    }
    if (commonMoodMistakes.length > 0) {
      improvementAreas.push(`Mood detection (most confused: ${commonMoodMistakes[0].from} -> ${commonMoodMistakes[0].to})`);
    }
    
    return {
      commonCategoryMistakes,
      commonMoodMistakes,
      improvementAreas
    };
  }

  // Clear user corrections (for testing or reset)
  static clearUserCorrections(): void {
    this.userCorrections = [];
    this.persistToStorage();
  }

  // Export user corrections for analysis
  static exportUserCorrections(userId?: string): UserFeedback[] {
    this.ensureInitialized();
    
    if (userId) {
      return this.getUserPatterns(userId);
    }
    
    return [...this.userCorrections];
  }
}