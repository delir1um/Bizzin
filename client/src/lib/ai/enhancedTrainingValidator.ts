// Enhanced AI Training Validator with TF-IDF similarity matching
// Implements the advanced validation system from the improvement spec

import type { TrainingExample, Category } from './types';
import { validateDataset } from './types';
import { TFIDF } from './similarity';
import { BusinessRuleEngine } from './businessRules';
import { contrastPenalty } from './negationHandling';
import { normalizeMood, detectBusinessMood } from './moodNormalization';

// Import existing training data
import { BUSINESS_JOURNAL_TRAINING_DATA } from '../aiTrainingData';
import { ENHANCED_BUSINESS_TRAINING_DATA } from '../advancedTrainingGenerator';

export class AITrainingValidator {
  private static tfidf: TFIDF | null = null;
  private static all: TrainingExample[] | null = null;
  private static initialized = false;

  private static getAll(): TrainingExample[] {
    if (!this.all) {
      // Convert existing training data to new format
      const convertedBase = BUSINESS_JOURNAL_TRAINING_DATA.map((item, index) => ({
        id: `BASE_${String(index + 1).padStart(3, '0')}`,
        version: 1,
        text: item.text,
        expected_category: item.expected_category as Category,
        expected_mood: item.expected_mood,
        expected_energy: item.expected_energy,
        confidence_range: item.confidence_range,
        business_context: item.business_context,
        source: 'handwritten' as const
      }));

      const convertedEnhanced = ENHANCED_BUSINESS_TRAINING_DATA.map((item, index) => ({
        id: `ENH_${String(index + 1).padStart(3, '0')}`,
        version: 1,
        text: item.text,
        expected_category: item.expected_category as Category,
        expected_mood: item.expected_mood,
        expected_energy: item.expected_energy,
        confidence_range: item.confidence_range,
        business_context: item.business_context,
        source: 'synthetic' as const
      }));

      const base = [...convertedBase, ...convertedEnhanced];
      
      // Validate dataset integrity
      validateDataset(base);
      
      this.all = base;
      this.tfidf = new TFIDF();
      
      // Build TF-IDF index
      for (const ex of base) {
        this.tfidf.addDocument(ex.text);
      }
      
      this.initialized = true;
    }
    return this.all!;
  }

  static getBestTrainingMatch(text: string): TrainingExample | null {
    const all = this.getAll();
    const qv = this.tfidf!.vectorize(text);
    let best: TrainingExample | null = null;
    let bestScore = 0;
    
    for (const ex of all) {
      const dv = this.tfidf!.vectorize(ex.text);
      const s = TFIDF.cosine(qv, dv);
      if (s > bestScore) {
        bestScore = s;
        best = ex;
      }
    }
    
    return (bestScore >= 0.22) ? best : null; // tuned threshold
  }

  static validateCategoryAccuracy(text: string, predictedCategory: string): number {
    const all = this.getAll();
    const qv = this.tfidf!.vectorize(text);
    
    const sims = all
      .map(ex => ({
        ex,
        s: TFIDF.cosine(qv, this.tfidf!.vectorize(ex.text))
      }))
      .filter(x => x.s >= 0.22)
      .sort((a, b) => b.s - a.s)
      .slice(0, 10); // top-k neighborhood
    
    if (sims.length === 0) return 0.5;
    
    const correct = sims.filter(x => 
      x.ex.expected_category.toLowerCase() === predictedCategory.toLowerCase()
    ).length;
    
    return correct / sims.length;
  }

  // Enhanced analysis with all AI improvements
  static analyzeText(text: string, userId?: string): {
    primary_mood: string;
    business_category: string;
    confidence: number;
    energy: 'high' | 'medium' | 'low';
    mood_polarity: 'Positive' | 'Negative' | 'Neutral';
    rules_matched: string[];
    similarity_score: number;
    contrast_penalty: number;
    training_match: TrainingExample | null;
  } {
    // 1. Apply business rules first (highest precision)
    const ruleResult = BusinessRuleEngine.applyRules(text);
    
    if (ruleResult.bestRule) {
      const { norm: mood, polarity } = normalizeMood(ruleResult.bestRule.moodPolarity || 'Neutral');
      
      return {
        primary_mood: mood,
        business_category: ruleResult.bestRule.category.toLowerCase(),
        confidence: Math.round(ruleResult.ruleConfidence * 100),
        energy: ruleResult.bestRule.energy || 'medium',
        mood_polarity: polarity,
        rules_matched: ruleResult.matchedRules.map(r => r.name),
        similarity_score: 1.0, // Rule-based has perfect similarity
        contrast_penalty: contrastPenalty(text),
        training_match: null
      };
    }

    // 2. Fall back to training data similarity matching
    const trainingMatch = this.getBestTrainingMatch(text);
    
    if (trainingMatch) {
      const penalty = contrastPenalty(text);
      const baseConfidence = (trainingMatch.confidence_range[0] + trainingMatch.confidence_range[1]) / 2;
      const adjustedConfidence = Math.max(40, Math.min(95, 
        baseConfidence - Math.round(penalty * 100)
      ));
      
      // Detect business-specific mood patterns
      const businessMood = detectBusinessMood(text);
      const finalMood = businessMood ? businessMood.mood : trainingMatch.expected_mood;
      const { norm: mood, polarity } = normalizeMood(finalMood);
      
      return {
        primary_mood: mood,
        business_category: trainingMatch.expected_category.toLowerCase(),
        confidence: adjustedConfidence,
        energy: trainingMatch.expected_energy,
        mood_polarity: polarity,
        rules_matched: [],
        similarity_score: this.calculateSimilarityScore(text, trainingMatch.text),
        contrast_penalty: penalty,
        training_match: trainingMatch
      };
    }

    // 3. Default fallback analysis
    const businessMood = detectBusinessMood(text);
    const defaultMood = businessMood ? businessMood.mood : 'Reflective';
    const { norm: mood, polarity } = normalizeMood(defaultMood);
    
    return {
      primary_mood: mood,
      business_category: 'reflection',
      confidence: 50,
      energy: 'medium',
      mood_polarity: polarity,
      rules_matched: [],
      similarity_score: 0,
      contrast_penalty: contrastPenalty(text),
      training_match: null
    };
  }

  static calculateSimilarityScore(text1: string, text2: string): number {
    return TFIDF.calculateSimilarity(text1, text2);
  }

  // Get training dataset statistics
  static getDatasetStats(): {
    totalExamples: number;
    categoryCounts: Record<Category, number>;
    avgConfidence: number;
    sourceBreakdown: Record<string, number>;
  } {
    const all = this.getAll();
    
    const categoryCounts = all.reduce((acc, ex) => {
      acc[ex.expected_category] = (acc[ex.expected_category] || 0) + 1;
      return acc;
    }, {} as Record<Category, number>);
    
    const sourceBreakdown = all.reduce((acc, ex) => {
      const source = ex.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const avgConfidence = all.reduce((sum, ex) => {
      return sum + (ex.confidence_range[0] + ex.confidence_range[1]) / 2;
    }, 0) / all.length;
    
    return {
      totalExamples: all.length,
      categoryCounts,
      avgConfidence: Math.round(avgConfidence),
      sourceBreakdown
    };
  }

  // Test accuracy against validation set
  static validateAccuracy(testCases: Array<{
    text: string;
    expectedCategory: Category;
    expectedMood: string;
  }>): {
    categoryAccuracy: number;
    moodAccuracy: number;
    avgConfidence: number;
    results: Array<{
      text: string;
      expected: { category: Category; mood: string };
      predicted: { category: string; mood: string; confidence: number };
      correct: { category: boolean; mood: boolean };
    }>;
  } {
    const results = testCases.map(testCase => {
      const analysis = this.analyzeText(testCase.text);
      
      return {
        text: testCase.text,
        expected: {
          category: testCase.expectedCategory,
          mood: testCase.expectedMood
        },
        predicted: {
          category: analysis.business_category,
          mood: analysis.primary_mood,
          confidence: analysis.confidence
        },
        correct: {
          category: analysis.business_category.toLowerCase() === testCase.expectedCategory.toLowerCase(),
          mood: analysis.primary_mood.toLowerCase() === testCase.expectedMood.toLowerCase()
        }
      };
    });
    
    const categoryCorrect = results.filter(r => r.correct.category).length;
    const moodCorrect = results.filter(r => r.correct.mood).length;
    const avgConfidence = results.reduce((sum, r) => sum + r.predicted.confidence, 0) / results.length;
    
    return {
      categoryAccuracy: categoryCorrect / results.length,
      moodAccuracy: moodCorrect / results.length,
      avgConfidence: Math.round(avgConfidence),
      results
    };
  }

  // Force re-initialization (for testing)
  static reset(): void {
    this.all = null;
    this.tfidf = null;
    this.initialized = false;
  }
}