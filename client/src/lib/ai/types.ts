// Enhanced AI types with strict schema validation
// Implements the advanced typing system from the improvement spec

export const Categories = [
  'Growth', 'Challenge', 'Achievement', 'Planning', 'Learning', 'Research'
] as const;
export type Category = typeof Categories[number];

export const Energies = ['high', 'medium', 'low'] as const;
export type Energy = typeof Energies[number];

export const MoodPolarities = ['Positive', 'Negative', 'Neutral'] as const;
export type MoodPolarity = typeof MoodPolarities[number];

export const FeedbackTypes = ['category_correction', 'mood_correction', 'both'] as const;
export type FeedbackType = typeof FeedbackTypes[number];

export const SourceTypes = ['handwritten', 'synthetic', 'user_correction'] as const;
export type SourceType = typeof SourceTypes[number];

export interface TrainingExample {
  id: string;                       // e.g., "GROWTH_001"
  version: number;                  // bump when edited
  text: string;
  expected_category: Category;
  expected_mood: string;            // normalized mood
  expected_energy: Energy;
  confidence_range: [number, number]; // 0–100
  business_context: string;
  source?: SourceType;
  normalized_mood_polarity?: MoodPolarity; // derived at build time
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
  feedback_type: FeedbackType;
}

export interface AIAnalysisResult {
  primary_mood: string;
  business_category: string;
  confidence: number;
  energy: Energy;
  mood_polarity: MoodPolarity;
  user_learned?: boolean;
  rules_matched?: string[];
  similarity_score?: number;
  contrast_penalty?: number;
}

// Runtime validation (fail fast)
export function validateDataset(ds: TrainingExample[]): void {
  const seen = new Set<string>();
  
  for (const ex of ds) {
    // Validate ID
    if (!ex.id) {
      throw new Error(`Missing id for: ${ex.text.slice(0, 60)}`);
    }
    if (seen.has(ex.id)) {
      throw new Error(`Duplicate id: ${ex.id}`);
    }
    seen.add(ex.id);

    // Validate category
    if (!Categories.includes(ex.expected_category)) {
      throw new Error(`Bad category ${ex.expected_category} in ${ex.id}`);
    }

    // Validate energy
    if (!Energies.includes(ex.expected_energy)) {
      throw new Error(`Bad energy ${ex.expected_energy} in ${ex.id}`);
    }

    // Validate confidence range
    const [lo, hi] = ex.confidence_range;
    if (!(lo >= 0 && hi <= 100 && lo <= hi)) {
      throw new Error(`Bad confidence_range in ${ex.id}`);
    }

    // Validate version
    if (!ex.version || ex.version < 1) {
      throw new Error(`Invalid version ${ex.version} in ${ex.id}`);
    }

    // Validate text content
    if (!ex.text || ex.text.trim().length === 0) {
      throw new Error(`Empty text content in ${ex.id}`);
    }
  }
}

// Validation for user feedback
export function validateUserFeedback(feedback: UserFeedback): void {
  if (!feedback.entry_id) {
    throw new Error('Missing entry_id in user feedback');
  }
  
  if (!Categories.includes(feedback.original_category)) {
    throw new Error(`Invalid original_category: ${feedback.original_category}`);
  }
  
  if (!Categories.includes(feedback.corrected_category)) {
    throw new Error(`Invalid corrected_category: ${feedback.corrected_category}`);
  }
  
  if (!FeedbackTypes.includes(feedback.feedback_type)) {
    throw new Error(`Invalid feedback_type: ${feedback.feedback_type}`);
  }
  
  if (!feedback.user_id) {
    throw new Error('Missing user_id in feedback');
  }
  
  // Validate ISO timestamp
  try {
    new Date(feedback.timestamp_iso).toISOString();
  } catch {
    throw new Error(`Invalid timestamp_iso: ${feedback.timestamp_iso}`);
  }
}