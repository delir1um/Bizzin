// Production-safe UserLearningSystem (from specification)
import { UserFeedback } from './strictTypes';

export class ProductionSafeLearningSystem {
  private static userCorrections: UserFeedback[] = [];
  private static MAX = 1000;

  static recordUserFeedback(feedback: UserFeedback): void {
    this.userCorrections.push(feedback);
    if (this.userCorrections.length > this.MAX) this.userCorrections.shift();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('ai_user_corrections', JSON.stringify(this.userCorrections));
      }
    } catch { /* ignore */ }
  }

  static loadUserFeedback(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('ai_user_corrections');
        if (stored) this.userCorrections = JSON.parse(stored);
      }
    } catch { /* ignore */ }
  }

  static getUserPatterns(userId: string): UserFeedback[] {
    return this.userCorrections.filter(f => f.user_id === userId);
  }

  static adjustPredictionBasedOnHistory(
    text: string,
    predicted: { primary_mood: string; business_category: string; confidence: number; },
    userId: string,
    calculateSimilarity: (a: string, b: string) => number,
    contrastPenalty: (text: string) => number
  ) {
    const patterns = this.getUserPatterns(userId);
    if (!patterns.length) return predicted;

    // most similar among the most recent N
    const recent = patterns.slice(-200);
    let best: { fb: UserFeedback; sim: number } | null = null;
    for (const fb of recent) {
      const sim = calculateSimilarity(text.toLowerCase(), fb.text_content.toLowerCase());
      if (!best || sim > best.sim) best = { fb, sim };
    }
    if (!best || best.sim < 0.40) return predicted;

    const adj = { ...predicted };
    if (best.fb.feedback_type !== 'mood_correction') {
      adj.business_category = best.fb.corrected_category.toLowerCase();
    }
    if (best.fb.feedback_type !== 'category_correction' && best.fb.corrected_mood) {
      adj.primary_mood = best.fb.corrected_mood;
    }

    // Confidence shaping: similarity + contrast penalty
    const penalty = contrastPenalty(text);
    adj.confidence = Math.min(95, Math.max(40, predicted.confidence + Math.round(best.sim*20) - Math.round(penalty*100)));
    (adj as any).user_learned = true;
    return adj;
  }
}