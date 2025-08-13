// Advanced training validator with TF-IDF (from specification)
import { TrainingExample, validateDataset } from './strictTypes';
import { TFIDF } from './tfidfSimilarity';
import { BUSINESS_JOURNAL_TRAINING_DATA } from '../sentimentAnalysis';

export class AdvancedTrainingValidator {
  private static tfidf: TFIDF | null = null;
  private static all: TrainingExample[] | null = null;

  private static getAll(): TrainingExample[] {
    if (!this.all) {
      // Convert existing data to new format
      const converted: TrainingExample[] = BUSINESS_JOURNAL_TRAINING_DATA.map(item => ({
        id: item.id,
        version: item.version || 1,
        text: item.text,
        expected_category: item.expected_category as any,
        expected_mood: item.expected_mood,
        expected_energy: item.expected_energy,
        confidence_range: item.confidence_range,
        business_context: item.business_context,
        source: item.source || 'handwritten'
      }));
      
      validateDataset(converted);
      this.all = converted;
      this.tfidf = new TFIDF();
      for (const ex of converted) this.tfidf!.addDocument(ex.text);
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
      if (s > bestScore) { bestScore = s; best = ex; }
    }
    return (bestScore >= 0.22) ? best : null; // tuned threshold
  }

  static calculateSimilarity(text1: string, text2: string): number {
    if (!this.tfidf) this.getAll(); // Initialize if needed
    const v1 = this.tfidf!.vectorize(text1);
    const v2 = this.tfidf!.vectorize(text2);
    return TFIDF.cosine(v1, v2);
  }

  static validateCategoryAccuracy(text: string, predictedCategory: string): number {
    const all = this.getAll();
    const qv = this.tfidf!.vectorize(text);
    const sims = all
      .map(ex => ({ ex, s: TFIDF.cosine(qv, this.tfidf!.vectorize(ex.text)) }))
      .filter(x => x.s >= 0.22)
      .sort((a,b) => b.s - a.s)
      .slice(0, 10); // top-k neighborhood
    if (sims.length === 0) return 0.5;
    const correct = sims.filter(x => x.ex.expected_category.toLowerCase() === predictedCategory.toLowerCase()).length;
    return correct / sims.length;
  }

  static calculateConfidenceWithPenalties(baseConfidence: number, text: string, similarityScore: number): number {
    // Import contrast penalty function here
    const contrastPenaltyAmount = this.getContrastPenalty(text);
    const adjustedConfidence = baseConfidence - (contrastPenaltyAmount * 100);
    return Math.max(40, Math.min(95, adjustedConfidence));
  }

  private static getContrastPenalty(text: string): number {
    const lower = text.toLowerCase();
    const contrast = ['but','however','though','yet','although'];
    let hits = 0;
    for (const c of contrast) if (lower.includes(` ${c} `)) hits++;
    return Math.min(hits * 0.05, 0.15);
  }
}