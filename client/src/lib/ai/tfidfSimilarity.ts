// Advanced TF-IDF + bigrams + business keywords similarity as per specification
type Counts = Map<string, number>;

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !StopWords.has(w));
}

const StopWords = new Set([
  'the','and','for','with','that','this','have','has','but','are','was','were',
  'you','your','our','from','into','about','not','too','very','just','also'
]);

function ngrams(tokens: string[], n: number = 2): string[] {
  const grams: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    grams.push(tokens[i]); // unigrams
    if (n >= 2 && i < tokens.length-1) grams.push(tokens[i]+' '+tokens[i+1]); // bigrams
  }
  return grams;
}

const DOMAIN_TERMS = new Map<string, number>([
  ['cash flow', 1.5], ['revenue', 1.3], ['gross margin', 1.4],
  ['customer', 1.2], ['client', 1.2], ['churn', 1.5], ['mrr', 1.6],
  ['launch', 1.2], ['hiring', 1.3], ['funding', 1.4], ['kpi', 1.4],
  ['roadmap', 1.3], ['onboarding', 1.3], ['retention', 1.5],
  ['partnership', 1.3], ['competitor', 1.3], ['expansion', 1.2],
  ['supplier', 1.4], ['shipment', 1.3], ['production', 1.3],
  ['accounts', 1.3], ['recurring', 1.4], ['research', 1.2],
  ['published', 1.3], ['paper', 1.2], ['industry', 1.2]
]);

export class TFIDF {
  private df = new Map<string, number>();
  private docs: string[][] = [];
  private N = 0;

  addDocument(text: string) {
    const terms = new Set(ngrams(tokenize(text)));
    this.docs.push([...terms]);
    const termList = Array.from(terms);
    for (const t of termList) this.df.set(t, (this.df.get(t) || 0) + 1);
    this.N++;
  }

  vectorize(text: string): Counts {
    const tokens = ngrams(tokenize(text));
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    const vec = new Map<string, number>();
    const tfEntries = Array.from(tf.entries());
    for (const [t, f] of tfEntries) {
      const idf = Math.log((this.N + 1) / ((this.df.get(t) || 0) + 1)) + 1;
      const domainBoost = DOMAIN_TERMS.get(t) || 1;
      vec.set(t, f * idf * domainBoost);
    }
    return vec;
  }

  static cosine(a: Counts, b: Counts): number {
    let dot = 0, na = 0, nb = 0;
    const keysA = Array.from(a.keys());
    const keysB = Array.from(b.keys());
    const allKeys = new Set([...keysA, ...keysB]);
    for (const k of Array.from(allKeys)) {
      const va = a.get(k) || 0, vb = b.get(k) || 0;
      dot += va * vb; na += va * va; nb += vb * vb;
    }
    return (na === 0 || nb === 0) ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
  }
}