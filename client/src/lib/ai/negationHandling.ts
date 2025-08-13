// Negation & contrastive cue handling for huge accuracy win (from specification)

const NEGATORS = ['not','no','never','hardly','barely','without'];
const CONTRAST = ['but','however','though','yet','although'];

export function negationAwareScore(tokens: string[], sentimentLex: Map<string, number>): number {
  let score = 0;
  let negateWindow = 0; // negate next 3 tokens
  for (let i=0;i<tokens.length;i++){
    const t = tokens[i];
    if (NEGATORS.includes(t)) { negateWindow = 3; continue; }
    let w = sentimentLex.get(t) || 0;
    if (negateWindow > 0) { w = -w * 0.9; negateWindow--; }
    score += w;
  }
  return score;
}

export function contrastPenalty(text: string): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const c of CONTRAST) if (lower.includes(` ${c} `)) hits++;
  return Math.min(hits * 0.05, 0.15); // reduce confidence up to 15%
}