// Negation and contrastive cue handling for improved sentiment accuracy
// Implements advanced linguistic processing from the improvement spec

const NEGATORS = ['not', 'no', 'never', 'hardly', 'barely', 'without', 'none', 'nothing', 'nobody', 'nowhere'];
const CONTRAST = ['but', 'however', 'though', 'yet', 'although', 'despite', 'nevertheless', 'nonetheless', 'whereas', 'while'];

// Intensifiers and dampeners for energy inference
export const Intensifiers = new Set([
  'very', 'extremely', 'incredibly', 'so', 'really', 'totally', 'absolutely', 'highly',
  'tremendously', 'exceptionally', 'remarkably', 'significantly', 'substantially', 'considerably'
]);

export const Dampeners = new Set([
  'slightly', 'somewhat', 'a bit', 'kinda', 'fairly', 'moderately', 'rather', 'quite',
  'relatively', 'partially', 'mildly', 'barely', 'hardly', 'scarcely'
]);

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

export function negationAwareScore(tokens: string[], sentimentLex: Map<string, number>): number {
  let score = 0;
  let negateWindow = 0; // negate next 3 tokens
  
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    
    if (NEGATORS.includes(t)) {
      negateWindow = 3;
      continue;
    }
    
    let w = sentimentLex.get(t) || 0;
    
    if (negateWindow > 0) {
      w = -w * 0.9; // Flip and slightly dampen
      negateWindow--;
    }
    
    score += w;
  }
  
  return score;
}

export function contrastPenalty(text: string): number {
  const lower = text.toLowerCase();
  let hits = 0;
  
  for (const c of CONTRAST) {
    if (lower.includes(` ${c} `)) {
      hits++;
    }
  }
  
  return Math.min(hits * 0.05, 0.15); // reduce confidence up to 15%
}

export function detectNegationContext(text: string): {
  hasNegation: boolean;
  hasContrast: boolean;
  negationStrength: number;
  contrastStrength: number;
} {
  const tokens = tokenize(text);
  const lower = text.toLowerCase();
  
  // Count negators
  const negationCount = tokens.filter(t => NEGATORS.includes(t)).length;
  const hasNegation = negationCount > 0;
  const negationStrength = Math.min(negationCount * 0.2, 1.0);
  
  // Count contrast words
  const contrastCount = CONTRAST.filter(c => lower.includes(` ${c} `)).length;
  const hasContrast = contrastCount > 0;
  const contrastStrength = Math.min(contrastCount * 0.15, 0.6);
  
  return {
    hasNegation,
    hasContrast,
    negationStrength,
    contrastStrength
  };
}

export function inferEnergy(text: string): 'high' | 'medium' | 'low' {
  const t = text.toLowerCase();
  
  // Count exclamation marks
  const exclam = (t.match(/!/g) || []).length;
  
  // Count intensifiers
  const ints = Array.from(Intensifiers).reduce((a, k) => a + (t.includes(k) ? 1 : 0), 0);
  
  // Count dampeners
  const dams = Array.from(Dampeners).reduce((a, k) => a + (t.includes(k) ? 1 : 0), 0);
  
  // Calculate energy score
  const score = exclam * 0.6 + ints * 0.5 - dams * 0.4;
  
  if (score >= 0.8) return 'high';
  if (score <= -0.2) return 'low';
  return 'medium';
}

export function analyzeTextComplexity(text: string): {
  sentenceCount: number;
  avgWordsPerSentence: number;
  hasComplexStructure: boolean;
  emotionalIntensity: number;
} {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = tokenize(text);
  
  const sentenceCount = sentences.length;
  const avgWordsPerSentence = words.length / Math.max(sentenceCount, 1);
  
  // Detect complex sentence structures
  const hasComplexConjunctions = /\b(because|since|although|while|whereas|if|unless|when|where)\b/i.test(text);
  const hasMultipleClauses = avgWordsPerSentence > 15;
  const hasComplexStructure = hasComplexConjunctions || hasMultipleClauses;
  
  // Calculate emotional intensity based on various factors
  const exclamationCount = (text.match(/!/g) || []).length;
  const capsCount = (text.match(/[A-Z]{2,}/g) || []).length;
  const intensifierCount = Array.from(Intensifiers).filter(i => text.toLowerCase().includes(i)).length;
  
  const emotionalIntensity = Math.min(
    (exclamationCount * 0.3 + capsCount * 0.2 + intensifierCount * 0.4) / words.length * 100,
    1.0
  );
  
  return {
    sentenceCount,
    avgWordsPerSentence,
    hasComplexStructure,
    emotionalIntensity
  };
}