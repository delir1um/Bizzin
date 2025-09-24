// Anti-generic validation utilities for insight generation

const BANNED_PHRASES = [
  "stay positive",
  "embrace challenges", 
  "keep pushing",
  "keep going",
  "work hard",
  "synergy",
  "unlock potential",
  "transformative journey",
  "leverage opportunities",
  "think outside the box",
  "paradigm shift",
  "circle back",
  "move the needle",
  "low-hanging fruit",
  "boil the ocean"
];

/**
 * Check if text contains any banned generic phrases
 */
export function hasBannedPhrases(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BANNED_PHRASES.some(phrase => lowerText.includes(phrase));
}

/**
 * Extract meaningful keywords from journal entry text
 * Focus on concrete nouns, numbers, proper nouns, and business terms
 */
export function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  
  // Extract numbers (revenue figures, percentages, dates, etc.)
  const numbers = text.match(/\$[\d,]+|\d+%|\d+[km]?|\d{1,2}\/\d{1,2}|\d{4}/g) || [];
  keywords.push(...numbers);
  
  // Extract proper nouns (names, companies, products)
  const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  keywords.push(...properNouns);
  
  // Extract business terms and concrete nouns
  const businessTerms = text.match(/\b(?:revenue|profit|client|customer|product|deal|contract|team|hire|launch|funding|investor|competitor|market|patent|database|demo|presentation|quarter|month|week|project|deadline|resignation|burnout|cash flow|runway|growth|scaling|infrastructure)\b/gi) || [];
  keywords.push(...businessTerms.map(term => term.toLowerCase()));
  
  // Extract metrics and measurable terms
  const metrics = text.match(/\b(?:downloads|users|retention|stars|rating|hours|weeks|months|years|employees|developers|engineers)\b/gi) || [];
  keywords.push(...metrics.map(term => term.toLowerCase()));
  
  return Array.from(new Set(keywords)); // Remove duplicates
}

/**
 * Check if insight summary has specific overlap with entry content
 * Requires at least one concrete keyword match
 */
export function hasSpecificOverlap(entryText: string, insightSummary: string): boolean {
  const entryKeywords = extractKeywords(entryText);
  const summaryKeywords = extractKeywords(insightSummary);
  
  // Check for direct keyword overlap
  const hasOverlap = entryKeywords.some(keyword => 
    summaryKeywords.some(summaryKeyword => 
      keyword.toLowerCase() === summaryKeyword.toLowerCase() ||
      summaryKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(summaryKeyword.toLowerCase())
    )
  );
  
  return hasOverlap;
}

/**
 * Validate that actions contain specific, actionable language
 */
export function validateActionSpecificity(actions: string[]): boolean {
  const specificityIndicators = [
    /\bby\s+\w+day\b/i,  // "by Friday", "by Monday"
    /\bwithin\s+\d+\s+\w+/i,  // "within 2 weeks"
    /\b(?:schedule|set up|contact|review|analyze|implement|create|update|send|call|meet with)\b/i,  // Action verbs
    /\b(?:today|tomorrow|this week|next week|by end of)\b/i,  // Time bounds
    /\$\d+/,  // Monetary amounts
    /\d+%/,   // Percentages
    /\b\w+@\w+\.\w+\b/,  // Email addresses
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/  // Proper nouns (names, companies)
  ];
  
  return actions.every(action => 
    specificityIndicators.some(indicator => indicator.test(action))
  );
}

/**
 * Extract context for debugging validation failures
 */
export function getValidationContext(entryText: string, insightSummary: string, actions: string[]) {
  return {
    entryKeywords: extractKeywords(entryText),
    summaryKeywords: extractKeywords(insightSummary),
    hasBannedPhrases: hasBannedPhrases(insightSummary),
    hasOverlap: hasSpecificOverlap(entryText, insightSummary),
    actionSpecificity: validateActionSpecificity(actions),
    entryLength: entryText.length,
    summaryLength: insightSummary.length
  };
}