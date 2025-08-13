// Enhanced TF-IDF similarity with business keyword weighting
// Implements advanced similarity calculation from the improvement spec

type Counts = Map<string, number>;

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !StopWords.has(w));
}

const StopWords = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'have', 'has', 'but', 'are', 'was', 'were',
  'you', 'your', 'our', 'from', 'into', 'about', 'not', 'too', 'very', 'just', 'also',
  'can', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'been',
  'being', 'had', 'did', 'does', 'done', 'get', 'got', 'getting', 'make', 'made',
  'making', 'take', 'took', 'taking', 'come', 'came', 'coming', 'go', 'went', 'going'
]);

function ngrams(tokens: string[], n = 2): string[] {
  const grams: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    grams.push(tokens[i]); // unigrams
    if (n >= 2 && i < tokens.length - 1) {
      grams.push(tokens[i] + ' ' + tokens[i + 1]); // bigrams
    }
  }
  return grams;
}

// Business domain terms with importance weights
const DOMAIN_TERMS = new Map<string, number>([
  ['cash flow', 1.5], ['revenue', 1.3], ['gross margin', 1.4],
  ['customer', 1.2], ['client', 1.2], ['churn', 1.5], ['mrr', 1.6],
  ['launch', 1.2], ['hiring', 1.3], ['funding', 1.4], ['kpi', 1.4],
  ['roadmap', 1.3], ['onboarding', 1.3], ['retention', 1.5],
  ['partnership', 1.3], ['competitor', 1.3], ['expansion', 1.2],
  ['startup', 1.3], ['growth', 1.2], ['scale', 1.3], ['pivot', 1.4],
  ['burn rate', 1.5], ['runway', 1.4], ['valuation', 1.3], ['equity', 1.3],
  ['product market fit', 1.6], ['user acquisition', 1.4], ['conversion', 1.3],
  ['metrics', 1.2], ['analytics', 1.2], ['engagement', 1.3], ['activation', 1.3],
  ['milestone', 1.2], ['deadline', 1.2], ['budget', 1.3], ['profit', 1.4],
  ['loss', 1.3], ['investment', 1.3], ['roi', 1.4], ['cac', 1.5],
  ['ltv', 1.5], ['arpu', 1.4], ['market share', 1.3], ['competitive advantage', 1.4]
]);

export class TFIDF {
  private df = new Map<string, number>();
  private docs: string[][] = [];
  private N = 0;

  addDocument(text: string) {
    const terms = new Set(ngrams(tokenize(text)));
    this.docs.push(Array.from(terms));
    terms.forEach(t => {
      this.df.set(t, (this.df.get(t) || 0) + 1);
    });
    this.N++;
  }

  vectorize(text: string): Counts {
    const tokens = ngrams(tokenize(text));
    const tf = new Map<string, number>();
    
    // Calculate term frequency
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }
    
    const vec = new Map<string, number>();
    
    // Calculate TF-IDF with domain boost
    tf.forEach((f, t) => {
      const idf = Math.log((this.N + 1) / ((this.df.get(t) || 0) + 1)) + 1;
      const domainBoost = DOMAIN_TERMS.get(t) || 1;
      vec.set(t, f * idf * domainBoost);
    });
    
    return vec;
  }

  static cosine(a: Counts, b: Counts): number {
    let dot = 0, na = 0, nb = 0;
    const allKeys = new Set();
    a.forEach((_, k) => allKeys.add(k));
    b.forEach((_, k) => allKeys.add(k));
    
    allKeys.forEach((k: string) => {
      const va = a.get(k) || 0;
      const vb = b.get(k) || 0;
      dot += va * vb;
      na += va * va;
      nb += vb * vb;
    });
    
    return (na === 0 || nb === 0) ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  // Calculate similarity between two texts directly
  static calculateSimilarity(text1: string, text2: string): number {
    const tfidf = new TFIDF();
    tfidf.addDocument(text1);
    tfidf.addDocument(text2);
    
    const vec1 = tfidf.vectorize(text1);
    const vec2 = tfidf.vectorize(text2);
    
    return this.cosine(vec1, vec2);
  }

  // Get document frequency for a term
  getDocumentFrequency(term: string): number {
    return this.df.get(term) || 0;
  }

  // Get total number of documents
  getDocumentCount(): number {
    return this.N;
  }

  // Get most important terms in a text
  getImportantTerms(text: string, topN = 10): Array<{term: string, score: number}> {
    const vec = this.vectorize(text);
    const terms = Array.from(vec.entries())
      .map(([term, score]) => ({ term, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
    
    return terms;
  }
}