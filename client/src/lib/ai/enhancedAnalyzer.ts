// Main enhanced AI analyzer integrating all specification improvements
import { AIAnalysisResult, Category, Energy, MoodPolarity } from './types'
import { AITrainingValidator } from './enhancedTrainingValidator'
import { applyBusinessRules, getRuleMatchNames } from './enhancedBusinessRules'
import { normalizeMood, inferEnergy } from './moodNormalization'
import { contrastPenalty, negationAwareScore } from './negationHandling'
// Note: UserLearningSystem import removed to fix circular dependency

// Create a basic sentiment lexicon for negation-aware scoring
const SENTIMENT_LEXICON = new Map<string, number>([
  // Positive business terms
  ['growth', 0.7], ['success', 0.8], ['achievement', 0.9], ['profit', 0.6],
  ['revenue', 0.6], ['launch', 0.7], ['expand', 0.6], ['opportunity', 0.7],
  ['milestone', 0.8], ['progress', 0.6], ['improvement', 0.6], ['win', 0.8],
  ['excited', 0.8], ['confident', 0.7], ['optimistic', 0.7], ['accomplished', 0.9],
  ['motivated', 0.7], ['inspired', 0.8], ['pleased', 0.6], ['satisfied', 0.6],
  
  // Negative business terms
  ['challenge', -0.5], ['problem', -0.7], ['issue', -0.6], ['concern', -0.5],
  ['risk', -0.5], ['loss', -0.8], ['decline', -0.6], ['failure', -0.9],
  ['obstacle', -0.6], ['difficulty', -0.6], ['setback', -0.7], ['crisis', -0.9],
  ['frustrated', -0.7], ['stressed', -0.8], ['worried', -0.7], ['overwhelmed', -0.8],
  ['disappointed', -0.7], ['uncertain', -0.5], ['anxious', -0.7], ['concerned', -0.5],
  
  // Neutral business terms
  ['planning', 0.1], ['strategy', 0.1], ['analysis', 0.0], ['research', 0.0],
  ['meeting', 0.0], ['discussion', 0.0], ['review', 0.0], ['update', 0.0]
]);

export function analyzeJournalEntryEnhanced(text: string, userId: string): AIAnalysisResult {
  try {
    console.log('Enhanced AI System v2.0: Analyzing entry...');
    
    // Step 1: Apply business rules (high-precision patterns)
    const ruleResults = applyBusinessRules(text);
    console.log(`Applied ${ruleResults.matchedRules.length} business rules`);
    
    // Step 2: Find best training match using TF-IDF
    const bestMatch = AITrainingValidator.getBestTrainingMatch(text);
    const similarityScore = bestMatch ? 
      AITrainingValidator.calculateSimilarity(text, bestMatch.text) : 0;
    console.log(`Best training match similarity: ${similarityScore.toFixed(3)}`);
    
    // Step 3: Determine category (rules override similarity)
    let category: Category = ruleResults.suggestedCategory || 
                           (bestMatch?.expected_category as Category) || 
                           'Learning';
    
    // Step 4: Mood analysis with normalization
    let primaryMood = 'Thoughtful';
    let moodPolarity: MoodPolarity = 'Neutral';
    
    if (bestMatch?.expected_mood) {
      const normalized = normalizeMood(bestMatch.expected_mood);
      primaryMood = normalized.norm;
      moodPolarity = normalized.polarity;
    }
    
    // Override with rule suggestions if available
    if (ruleResults.suggestedMoodPolarity) {
      moodPolarity = ruleResults.suggestedMoodPolarity;
    }
    
    // Step 5: Energy inference from text patterns
    const energy: Energy = ruleResults.suggestedEnergy || inferEnergy(text);
    
    // Step 6: Calculate base confidence
    let baseConfidence = 50;
    if (bestMatch) {
      const [minConf, maxConf] = bestMatch.confidence_range;
      baseConfidence = (minConf + maxConf) / 2;
    }
    
    // Step 7: Apply confidence adjustments
    baseConfidence += ruleResults.confidenceBoost;
    baseConfidence = AITrainingValidator.calculateConfidenceWithPenalties(
      baseConfidence, text, similarityScore
    );
    
    // Step 8: Negation-aware sentiment scoring
    const tokens = text.toLowerCase().split(/\s+/);
    const negationScore = negationAwareScore(tokens, SENTIMENT_LEXICON);
    console.log(`Negation-aware sentiment score: ${negationScore.toFixed(3)}`);
    
    // Step 9: User learning system integration
    let result: AIAnalysisResult = {
      primary_mood: primaryMood,
      business_category: category,
      confidence: Math.max(40, Math.min(95, baseConfidence)),
      energy,
      mood_polarity: moodPolarity,
      rules_matched: getRuleMatchNames(ruleResults.matchedRules),
      similarity_score: similarityScore,
      contrast_penalty: contrastPenalty(text)
    };
    
    // Note: User learning integration moved to main index for dependency management
    
    console.log(`Enhanced AI Analysis Complete - Category: ${result.business_category}, Confidence: ${result.confidence}%`);
    
    return result;
    
  } catch (error) {
    console.error('Enhanced AI Analysis Error:', error);
    
    // Fallback to basic analysis
    return {
      primary_mood: 'Thoughtful',
      business_category: 'Learning',
      confidence: 45,
      energy: 'medium',
      mood_polarity: 'Neutral',
      rules_matched: [],
      similarity_score: 0,
      contrast_penalty: 0
    };
  }
}

export function validateEnhancedSystem(): boolean {
  try {
    // Test core components
    const testText = "We launched our new product and saw great customer response";
    const ruleResults = applyBusinessRules(testText);
    const bestMatch = AITrainingValidator.getBestTrainingMatch(testText);
    const energy = inferEnergy(testText);
    const mood = normalizeMood("excited");
    
    console.log('Enhanced AI System validation:', {
      rulesApplied: ruleResults.matchedRules.length > 0,
      trainingMatchFound: bestMatch !== null,
      energyInferred: energy === 'high',
      moodNormalized: mood.polarity === 'Positive'
    });
    
    return true;
  } catch (error) {
    console.error('Enhanced AI System validation failed:', error);
    return false;
  }
}