// Advanced mood normalization + energy inference (from specification)

const MoodMap = new Map<string, 'Positive'|'Negative'|'Neutral'>([
  ['excited','Positive'], ['confident','Positive'], ['proud','Positive'],
  ['optimistic','Positive'], ['grateful','Positive'], ['relieved','Positive'],
  ['stressed','Negative'], ['worried','Negative'], ['overwhelmed','Negative'],
  ['frustrated','Negative'], ['uncertain','Negative'], ['guilty','Negative'],
  ['reflective','Neutral'], ['analytical','Neutral'], ['thoughtful','Neutral'],
  ['determined','Neutral'], ['contemplative','Neutral']
]);

const Intensifiers = new Set(['very','extremely','incredibly','so','really','totally','absolutely','highly']);
const Dampeners = new Set(['slightly','somewhat','a bit','kinda','fairly','moderately']);

export function normalizeMoodAdvanced(raw: string): {norm: string, polarity: 'Positive'|'Negative'|'Neutral'} {
  const key = raw.trim().toLowerCase();
  const polarity = MoodMap.get(key) || 'Neutral';
  // Keep original label but use polarity downstream
  return { norm: raw.trim(), polarity };
}

export function inferEnergyAdvanced(text: string): 'high'|'medium'|'low' {
  const t = text.toLowerCase();
  const exclam = (t.match(/!/g) || []).length;
  const intArray = Array.from(Intensifiers);
  const ints = intArray.reduce((a,k)=>a+(t.includes(k)?1:0),0);
  const damArray = Array.from(Dampeners);
  const dams = damArray.reduce((a,k)=>a+(t.includes(k)?1:0),0);
  const score = exclam*0.6 + ints*0.5 - dams*0.4;
  return score >= 0.8 ? 'high' : score <= -0.2 ? 'low' : 'medium';
}