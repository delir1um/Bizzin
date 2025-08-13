// Mood normalization and energy inference system
// Implements controlled mood mapping and intensity analysis from the improvement spec

import type { MoodPolarity, Energy } from './types';
import { Intensifiers, Dampeners } from './negationHandling';

// Comprehensive mood mapping to normalized polarities
const MoodMap = new Map<string, MoodPolarity>([
  // Positive moods
  ['excited', 'Positive'],
  ['confident', 'Positive'],
  ['proud', 'Positive'],
  ['optimistic', 'Positive'],
  ['grateful', 'Positive'],
  ['relieved', 'Positive'],
  ['accomplished', 'Positive'],
  ['energized', 'Positive'],
  ['motivated', 'Positive'],
  ['inspired', 'Positive'],
  ['enthusiastic', 'Positive'],
  ['hopeful', 'Positive'],
  ['satisfied', 'Positive'],
  ['pleased', 'Positive'],
  ['delighted', 'Positive'],
  ['thrilled', 'Positive'],
  ['joyful', 'Positive'],
  ['elated', 'Positive'],
  
  // Negative moods
  ['stressed', 'Negative'],
  ['worried', 'Negative'],
  ['overwhelmed', 'Negative'],
  ['frustrated', 'Negative'],
  ['uncertain', 'Negative'],
  ['guilty', 'Negative'],
  ['anxious', 'Negative'],
  ['disappointed', 'Negative'],
  ['discouraged', 'Negative'],
  ['exhausted', 'Negative'],
  ['defeated', 'Negative'],
  ['concerned', 'Negative'],
  ['troubled', 'Negative'],
  ['upset', 'Negative'],
  ['angry', 'Negative'],
  ['annoyed', 'Negative'],
  ['irritated', 'Negative'],
  ['sad', 'Negative'],
  
  // Neutral moods
  ['reflective', 'Neutral'],
  ['analytical', 'Neutral'],
  ['thoughtful', 'Neutral'],
  ['determined', 'Neutral'],
  ['contemplative', 'Neutral'],
  ['focused', 'Neutral'],
  ['strategic', 'Neutral'],
  ['methodical', 'Neutral'],
  ['systematic', 'Neutral'],
  ['organized', 'Neutral'],
  ['planned', 'Neutral'],
  ['practical', 'Neutral'],
  ['realistic', 'Neutral'],
  ['calm', 'Neutral'],
  ['steady', 'Neutral'],
  ['balanced', 'Neutral'],
  ['composed', 'Neutral'],
  ['measured', 'Neutral']
]);

// Business-specific mood patterns
const BusinessMoodPatterns = new Map<string, { mood: string; polarity: MoodPolarity; confidence: number }>([
  // Achievement patterns
  ['hit our target', { mood: 'Accomplished', polarity: 'Positive', confidence: 0.9 }],
  ['exceeded expectations', { mood: 'Proud', polarity: 'Positive', confidence: 0.9 }],
  ['closed the deal', { mood: 'Excited', polarity: 'Positive', confidence: 0.8 }],
  ['reached milestone', { mood: 'Satisfied', polarity: 'Positive', confidence: 0.8 }],
  
  // Challenge patterns
  ['cash flow issues', { mood: 'Stressed', polarity: 'Negative', confidence: 0.9 }],
  ['losing customers', { mood: 'Worried', polarity: 'Negative', confidence: 0.8 }],
  ['behind schedule', { mood: 'Frustrated', polarity: 'Negative', confidence: 0.7 }],
  ['budget constraints', { mood: 'Concerned', polarity: 'Negative', confidence: 0.7 }],
  
  // Growth patterns
  ['scaling up', { mood: 'Optimistic', polarity: 'Positive', confidence: 0.8 }],
  ['expanding team', { mood: 'Confident', polarity: 'Positive', confidence: 0.7 }],
  ['new opportunities', { mood: 'Excited', polarity: 'Positive', confidence: 0.8 }],
  
  // Planning patterns
  ['strategic review', { mood: 'Analytical', polarity: 'Neutral', confidence: 0.8 }],
  ['planning session', { mood: 'Focused', polarity: 'Neutral', confidence: 0.7 }],
  ['roadmap planning', { mood: 'Methodical', polarity: 'Neutral', confidence: 0.7 }]
]);

export function normalizeMood(raw: string): { norm: string; polarity: MoodPolarity } {
  const key = raw.trim().toLowerCase();
  const polarity = MoodMap.get(key) || 'Neutral';
  
  // Keep original label but use polarity downstream
  return { norm: raw.trim(), polarity };
}

export function detectBusinessMood(text: string): { mood: string; polarity: MoodPolarity; confidence: number } | null {
  const lowerText = text.toLowerCase();
  
  // Look for business-specific mood patterns
  let result: { mood: string; polarity: MoodPolarity; confidence: number } | null = null;
  BusinessMoodPatterns.forEach((moodData, pattern) => {
    if (!result && lowerText.includes(pattern)) {
      result = moodData;
    }
  });
  return result;
}

export function inferEnergyFromText(text: string): Energy {
  const t = text.toLowerCase();
  
  // Count exclamation marks
  const exclam = (t.match(/!/g) || []).length;
  
  // Count intensifiers
  const ints = Array.from(Intensifiers).reduce((a, k) => a + (t.includes(k) ? 1 : 0), 0);
  
  // Count dampeners
  const dams = Array.from(Dampeners).reduce((a, k) => a + (t.includes(k) ? 1 : 0), 0);
  
  // Business energy indicators
  const highEnergyWords = ['launched', 'breakthrough', 'milestone', 'success', 'achievement', 'growth', 'expansion'];
  const lowEnergyWords = ['exhausted', 'overwhelmed', 'stuck', 'blocked', 'setback', 'problem', 'crisis'];
  
  const highEnergyCount = highEnergyWords.filter(word => t.includes(word)).length;
  const lowEnergyCount = lowEnergyWords.filter(word => t.includes(word)).length;
  
  // Calculate energy score
  const score = exclam * 0.6 + ints * 0.5 - dams * 0.4 + highEnergyCount * 0.3 - lowEnergyCount * 0.4;
  
  if (score >= 0.8) return 'high';
  if (score <= -0.2) return 'low';
  return 'medium';
}

export function analyzeMoodIntensity(text: string, mood: string): {
  intensity: number;
  modifiers: string[];
  confidence: number;
} {
  const lowerText = text.toLowerCase();
  const tokens = lowerText.split(/\s+/);
  
  let intensity = 0.5; // baseline
  const modifiers: string[] = [];
  
  // Check for intensifiers near the mood word
  const moodIndex = tokens.indexOf(mood.toLowerCase());
  if (moodIndex !== -1) {
    // Look at words around the mood word
    const contextWindow = 3;
    const start = Math.max(0, moodIndex - contextWindow);
    const end = Math.min(tokens.length, moodIndex + contextWindow + 1);
    const context = tokens.slice(start, end);
    
    // Count intensifiers and dampeners in context
    for (const word of context) {
      if (Intensifiers.has(word)) {
        intensity += 0.2;
        modifiers.push(word);
      } else if (Dampeners.has(word)) {
        intensity -= 0.15;
        modifiers.push(word);
      }
    }
  }
  
  // Global text analysis
  const exclamationCount = (text.match(/!/g) || []).length;
  const capsWords = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
  
  intensity += exclamationCount * 0.1 + capsWords * 0.05;
  
  // Clamp intensity between 0 and 1
  intensity = Math.max(0, Math.min(1, intensity));
  
  // Calculate confidence based on number of indicators
  const indicators = modifiers.length + exclamationCount + capsWords;
  const confidence = Math.min(0.9, 0.5 + indicators * 0.1);
  
  return {
    intensity,
    modifiers,
    confidence
  };
}

export function getMoodColor(mood: string, polarity: MoodPolarity): string {
  // Color mapping based on mood polarity and specific moods
  const colorMap: Record<string, string> = {
    // Positive moods - variations of green/blue
    'Excited': '#10B981',
    'Confident': '#3B82F6', 
    'Proud': '#8B5CF6',
    'Optimistic': '#06B6D4',
    'Accomplished': '#059669',
    'Grateful': '#84CC16',
    'Relieved': '#22C55E',
    
    // Negative moods - variations of red/orange
    'Stressed': '#EF4444',
    'Worried': '#F59E0B',
    'Overwhelmed': '#DC2626',
    'Frustrated': '#EA580C',
    'Uncertain': '#6B7280',
    'Anxious': '#F97316',
    
    // Neutral moods - variations of gray/purple
    'Reflective': '#7C3AED',
    'Analytical': '#6366F1',
    'Thoughtful': '#8B5CF6',
    'Determined': '#EA580C',
    'Focused': '#0F172A',
    'Strategic': '#374151'
  };
  
  // Fallback to polarity-based colors
  const polarityColors = {
    'Positive': '#10B981',
    'Negative': '#EF4444', 
    'Neutral': '#6B7280'
  };
  
  return colorMap[mood] || polarityColors[polarity] || '#6B7280';
}