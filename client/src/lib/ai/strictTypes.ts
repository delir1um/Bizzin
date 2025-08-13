// Strict typing system as per specification to prevent silent mistakes
export const Categories = ['Growth', 'Challenge', 'Achievement', 'Planning', 'Learning', 'Research'] as const;
export type Category = typeof Categories[number];

export const Energies = ['high', 'medium', 'low'] as const;
export type Energy = typeof Energies[number];

export const MoodPolarities = ['Positive', 'Negative', 'Neutral'] as const;
export type MoodPolarity = typeof MoodPolarities[number];

export interface TrainingExample {
  id: string;                       // e.g., "GROWTH_001"
  version: number;                  // bump when edited
  text: string;
  expected_category: Category;
  expected_mood: string;            // see §4 for normalization
  expected_energy: Energy;
  confidence_range: [number, number]; // 0–100
  business_context: string;
  source?: 'handwritten' | 'synthetic' | 'user_correction';
}

export interface UserFeedback {
  entry_id: string;
  original_category: Category;
  corrected_category: Category;
  original_mood: string;
  corrected_mood: string;
  text_content: string;
  user_id: string;
  timestamp_iso: string;            // ISO8601
  feedback_type: 'category_correction' | 'mood_correction' | 'both';
}

// Runtime validation (fail fast)
export function validateDataset(ds: TrainingExample[]): void {
  const seen = new Set<string>();
  for (const ex of ds) {
    if (!ex.id) throw new Error(`Missing id for: ${ex.text.slice(0,60)}`);
    if (seen.has(ex.id)) throw new Error(`Duplicate id: ${ex.id}`);
    seen.add(ex.id);

    if (!Categories.includes(ex.expected_category))
      throw new Error(`Bad category ${ex.expected_category} in ${ex.id}`);
    if (!Energies.includes(ex.expected_energy))
      throw new Error(`Bad energy ${ex.expected_energy} in ${ex.id}`);
    const [lo, hi] = ex.confidence_range;
    if (!(lo >= 0 && hi <= 100 && lo <= hi))
      throw new Error(`Bad confidence_range in ${ex.id}`);
  }
}