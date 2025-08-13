// Enhanced training validator with TF-IDF similarity (specification compliant)
import { TrainingExample, validateDataset } from './types'
import { TFIDF } from './tfidf'
import { BUSINESS_JOURNAL_TRAINING_DATA } from '../sentimentAnalysis'
import { contrastPenalty } from './negationHandling'

export class AITrainingValidator {
  private static tfidf: TFIDF | null = null;
  private static all: TrainingExample[] | null = null;

  private static getAll(): TrainingExample[] {
    if (!this.all) {
      const base = [...BUSINESS_JOURNAL_TRAINING_DATA];
      validateDataset(base);
      this.all = base;
      this.tfidf = new TFIDF();
      for (const ex of base) {
        this.tfidf!.addDocument(ex.text);
      }
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
    
    return (bestScore >= 0.22) ? best : null; // tuned threshold from spec
  }

  static validateCategoryAccuracy(text: string, predictedCategory: string): number {
    const all = this.getAll();
    const qv = this.tfidf!.vectorize(text);
    const sims = all
      .map(ex => ({ ex, s: TFIDF.cosine(qv, this.tfidf!.vectorize(ex.text)) }))
      .filter(x => x.s >= 0.22)
      .sort((a, b) => b.s - a.s)
      .slice(0, 10); // top-k neighborhood
      
    if (sims.length === 0) return 0.5;
    
    const correct = sims.filter(x => 
      x.ex.expected_category.toLowerCase() === predictedCategory.toLowerCase()
    ).length;
    
    return correct / sims.length;
  }

  static calculateSimilarity(text1: string, text2: string): number {
    if (!this.tfidf) {
      this.getAll(); // Initialize if needed
    }
    
    const v1 = this.tfidf!.vectorize(text1);
    const v2 = this.tfidf!.vectorize(text2);
    return TFIDF.cosine(v1, v2);
  }

  static getTopSimilarExamples(text: string, limit: number = 5): Array<{
    example: TrainingExample;
    similarity: number;
  }> {
    const all = this.getAll();
    const qv = this.tfidf!.vectorize(text);
    
    return all
      .map(ex => ({
        example: ex,
        similarity: TFIDF.cosine(qv, this.tfidf!.vectorize(ex.text))
      }))
      .filter(x => x.similarity >= 0.15)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  static calculateConfidenceWithPenalties(
    baseConfidence: number,
    text: string,
    similarityScore: number
  ): number {
    // Apply contrast penalty from specification
    const penalty = contrastPenalty(text);
    
    // Similarity boost
    const similarityBoost = Math.min(similarityScore * 20, 15);
    
    const adjustedConfidence = Math.min(95, Math.max(40, 
      baseConfidence + similarityBoost - (penalty * 100)
    ));
    
    return Math.round(adjustedConfidence);
  }
}