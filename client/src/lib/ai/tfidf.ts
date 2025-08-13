// TF-IDF with bigrams + business keyword boost (from specification)
import { TrainingExample } from './types'

type TermCounts = Map<string, number>;

const StopWords = new Set([
  'the','and','for','with','that','this','have','has','but','are','was','were',
  'you','your','our','from','into','about','not','too','very','just','also',
  'been','will','would','could','should','can','had','what','when','where'
]);

const DOMAIN_TERMS = new Map<string, number>([
  ['cash flow', 1.5], ['revenue', 1.3], ['gross margin', 1.4],
  ['customer', 1.2], ['client', 1.2], ['churn', 1.5], ['mrr', 1.6],
  ['launch', 1.2], ['hiring', 1.3], ['funding', 1.4], ['kpi', 1.4],
  ['roadmap', 1.3], ['onboarding', 1.3], ['retention', 1.5],
  ['partnership', 1.3], ['competitor', 1.3], ['expansion', 1.2],
  ['strategic', 1.4], ['planning', 1.3], ['milestone', 1.3],
  ['achievement', 1.3], ['challenge', 1.2], ['growth', 1.3],
  ['market', 1.2], ['business', 1.1], ['product', 1.2], ['team', 1.2]
]);

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !StopWords.has(w));
}

function ngrams(tokens: string[], n=2): string[] {
  const grams: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    grams.push(tokens[i]); // unigrams
    if (n >= 2 && i < tokens.length - 1) {
      grams.push(tokens[i] + ' ' + tokens[i + 1]); // bigrams
    }
  }
  return grams;
}

export class TFIDF {
  private df = new Map<string, number>();
  private docs: string[][] = [];
  private N = 0;

  addDocument(text: string) {
    const terms = new Set(ngrams(tokenize(text)));
    this.docs.push([...terms]);
    for (const t of terms) {
      this.df.set(t, (this.df.get(t) || 0) + 1);
    }
    this.N++;
  }

  vectorize(text: string): TermCounts {
    const tokens = ngrams(tokenize(text));
    const tf = new Map<string, number>();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }

    const vec = new Map<string, number>();
    for (const [t, f] of tf) {
      const idf = Math.log((this.N + 1) / ((this.df.get(t) || 0) + 1)) + 1;
      const domainBoost = DOMAIN_TERMS.get(t) || 1;
      vec.set(t, f * idf * domainBoost);
    }
    return vec;
  }

  static cosine(a: TermCounts, b: TermCounts): number {
    let dot = 0, na = 0, nb = 0;
    const keys = new Set([...a.keys(), ...b.keys()]);
    for (const k of keys) {
      const va = a.get(k) || 0;
      const vb = b.get(k) || 0;
      dot += va * vb;
      na += va * va;
      nb += vb * vb;
    }
    return (na === 0 || nb === 0) ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
  }
}