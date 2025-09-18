/**
 * Speech Text Formatter Utility
 * Automatically adds punctuation and proper capitalization to voice-transcribed text
 */

export interface FormatOptions {
  enablePunctuation?: boolean // default: true
  enableCapitalization?: boolean // default: true
  addEndPeriod?: boolean // default: true
}

/**
 * Mapping of spoken punctuation keywords to actual punctuation marks
 */
const PUNCTUATION_MAP: Record<string, string> = {
  // Periods - keep safe commands only
  'period': '.',
  'full stop': '.',
  
  // Commas
  'comma': ',',
  
  // Question marks - only unambiguous commands
  'question mark': '?',
  
  // Exclamation marks - only unambiguous commands
  'exclamation mark': '!',
  'exclamation point': '!',
  
  // Line breaks
  'new line': '\n',
  'newline': '\n',
  'new paragraph': '\n\n',
  
  // Other punctuation
  'semicolon': ';',
  'colon': ':',
  'dash': '-',
  'hyphen': '-',
  'apostrophe': "'",
  'quote': '"',
  'open quote': '"',
  'close quote': '"',
  'open parenthesis': '(',
  'close parenthesis': ')',
  'left parenthesis': '(',
  'right parenthesis': ')'
}

/**
 * Common contractions that need capitalization fixes
 */
const CONTRACTIONS_MAP: Record<string, string> = {
  "i'm": "I'm",
  "i've": "I've",
  "i'll": "I'll",
  "i'd": "I'd",
  "i'ma": "I'ma",
  "i'mma": "I'mma",
  "i was": "I was",
  "i am": "I am",
  "i have": "I have",
  "i will": "I will",
  "i would": "I would",
  "i can": "I can",
  "i could": "I could",
  "i should": "I should",
  "i might": "I might",
  "i think": "I think",
  "i believe": "I believe",
  "i feel": "I feel",
  "i know": "I know"
}

/**
 * Replace spoken punctuation keywords with actual punctuation marks
 */
function replacePunctuationKeywords(text: string): string {
  let result = text

  // Sort keywords by length (longest first) to avoid partial replacements
  const sortedKeywords = Object.keys(PUNCTUATION_MAP).sort((a, b) => b.length - a.length)
  
  for (const keyword of sortedKeywords) {
    const punctuation = PUNCTUATION_MAP[keyword]
    
    // Create regex patterns for different contexts
    // 1. Standalone keyword (surrounded by word boundaries or punctuation)
    // 2. At beginning/end of text
    const patterns = [
      new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'),
      new RegExp(`^${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s`, 'gi'),
      new RegExp(`\\s${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'gi')
    ]
    
    for (const pattern of patterns) {
      result = result.replace(pattern, (match) => {
        // Preserve leading/trailing spaces but replace the keyword
        const leadingSpace = match.match(/^\s+/)?.[0] || ''
        const trailingSpace = match.match(/\s+$/)?.[0] || ''
        
        // For line breaks, handle spacing carefully
        if (punctuation.includes('\n')) {
          // Remove extra spaces around line breaks for clean formatting
          return punctuation
        }
        
        // For other punctuation, add a space after if needed
        const needsTrailingSpace = trailingSpace || (!punctuation.match(/[.!?]/) && match.includes(' '))
        return leadingSpace + punctuation + (needsTrailingSpace ? ' ' : '')
      })
    }
  }
  
  return result
}

/**
 * Fix capitalization for sentences and common words
 */
function fixCapitalization(text: string): string {
  let result = text
  
  // Capitalize first letter of text
  result = result.replace(/^\s*([a-z])/, (match, letter) => 
    match.replace(letter, letter.toUpperCase())
  )
  
  // Capitalize first letter after sentence endings (. ! ?) followed by space(s)
  result = result.replace(/([.!?]\s+)([a-z])/g, (match, punctuation, letter) => 
    punctuation + letter.toUpperCase()
  )
  
  // Capitalize first letter after line breaks
  result = result.replace(/(\n\s*)([a-z])/g, (match, linebreak, letter) => 
    linebreak + letter.toUpperCase()
  )
  
  // Fix standalone "i" to "I" (but not within words)
  result = result.replace(/\b(i)\b/g, 'I')
  
  // Fix common contractions and phrases starting with "i"
  for (const [lowercase, capitalized] of Object.entries(CONTRACTIONS_MAP)) {
    // Handle both with and without apostrophes for voice input
    const escapedLowercase = lowercase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const withoutApostrophe = lowercase.replace(/'/g, ' ')
    const escapedWithoutApostrophe = withoutApostrophe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // Replace original form
    const pattern1 = new RegExp(`\\b${escapedLowercase}\\b`, 'gi')
    result = result.replace(pattern1, capitalized)
    
    // Replace version without apostrophes (common in voice transcription)
    if (withoutApostrophe !== lowercase) {
      const pattern2 = new RegExp(`\\b${escapedWithoutApostrophe}\\b`, 'gi')
      result = result.replace(pattern2, capitalized)
    }
  }
  
  return result
}

/**
 * Normalize whitespace and remove excessive spacing
 */
function normalizeWhitespace(text: string): string {
  return text
    // Replace multiple spaces with single space
    .replace(/[ \t]+/g, ' ')
    // Clean up spaces around punctuation
    .replace(/\s+([,.!?;:])/g, '$1')
    // Ensure single space after punctuation (except at end of text)
    .replace(/([,.!?;:])(?=[A-Za-z])/g, '$1 ')
    // Fix spacing for parentheses and quotes
    .replace(/\(\s+/g, '(') // Remove space after opening parenthesis
    .replace(/\s+\)/g, ')') // Remove space before closing parenthesis
    .replace(/"\s+/g, '"') // Remove space after opening quote
    .replace(/\s+"(?=[\s,.!?;:)]|$)/g, '"') // Remove space before closing quote only
    // Clean up multiple line breaks (max 2 consecutive)
    .replace(/\n{3,}/g, '\n\n')
    // Remove trailing/leading whitespace
    .trim()
}

/**
 * Remove duplicate punctuation marks that might occur when merging chunks
 * Also handle consecutive punctuation commands like "exclamation mark question mark"
 */
function removeDuplicatePunctuation(text: string): string {
  return text
    // Remove duplicate periods
    .replace(/\.{2,}/g, '.')
    // Remove duplicate commas
    .replace(/,{2,}/g, ',')
    // Remove duplicate question marks
    .replace(/\?{2,}/g, '?')
    // Remove duplicate exclamation marks
    .replace(/!{2,}/g, '!')
    // Handle mixed punctuation - question mark always wins
    .replace(/(!\s*\?|\?\s*!)/g, '?')
    // Handle other mixed consecutive punctuation (keep the last one)
    .replace(/([.!?])\s*([.!?])/g, '$2')
    // Remove any remaining duplicate punctuation
    .replace(/([.!?])\s*[.!?]+/g, '$1')
}

/**
 * Add automatic period at end if text doesn't end with punctuation
 */
function addEndPunctuation(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  
  // Check if already ends with sentence-ending punctuation
  const endsWithPunctuation = /[.!?]$/.test(trimmed)
  
  if (!endsWithPunctuation) {
    return trimmed + '.'
  }
  
  return trimmed
}

/**
 * Main function to format speech text with punctuation and capitalization
 * 
 * @param text - The raw speech text to format
 * @param options - Formatting options
 * @returns Formatted text with proper punctuation and capitalization
 */
export function formatSpeechText(text: string, options: FormatOptions = {}): string {
  // Set default options
  const opts: Required<FormatOptions> = {
    enablePunctuation: options.enablePunctuation ?? true,
    enableCapitalization: options.enableCapitalization ?? true,
    addEndPeriod: options.addEndPeriod ?? true
  }
  
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  let result = text
  
  // Step 1: Replace punctuation keywords
  if (opts.enablePunctuation) {
    result = replacePunctuationKeywords(result)
  }
  
  // Step 2: Remove duplicate punctuation
  if (opts.enablePunctuation) {
    result = removeDuplicatePunctuation(result)
  }
  
  // Step 3: Normalize whitespace
  result = normalizeWhitespace(result)
  
  // Step 4: Fix capitalization
  if (opts.enableCapitalization) {
    result = fixCapitalization(result)
  }
  
  // Step 5: Add end period if needed
  if (opts.addEndPeriod && opts.enablePunctuation) {
    result = addEndPunctuation(result)
  }
  
  return result
}

/**
 * Format speech text for appending to existing content
 * Handles proper spacing and prevents duplicate punctuation at boundaries
 * 
 * @param existingContent - The current content
 * @param newSpeechText - New speech text to append
 * @param options - Formatting options
 * @returns Combined formatted text
 */
export function formatAndAppendSpeechText(
  existingContent: string, 
  newSpeechText: string, 
  options: FormatOptions = {}
): string {
  if (!newSpeechText || typeof newSpeechText !== 'string') {
    return existingContent
  }
  
  // Format the new speech text
  const formattedNewText = formatSpeechText(newSpeechText, { ...options, addEndPeriod: false })
  
  if (!formattedNewText.trim()) {
    return existingContent
  }
  
  // If no existing content, just return formatted new text
  if (!existingContent.trim()) {
    return formatSpeechText(formattedNewText, options)
  }
  
  // Combine with proper spacing
  const needsSpace = !existingContent.match(/\s$/) && !formattedNewText.match(/^\s/)
  const combinedText = existingContent + (needsSpace ? ' ' : '') + formattedNewText
  
  // Apply final formatting to the combined text
  return formatSpeechText(combinedText, options)
}

/**
 * Quick test function for development/debugging
 */
export function testSpeechFormatter() {
  const testCases = [
    "hello world period how are you",
    "i think i'm doing well comma actually i've been great",
    "this is great exclamation mark question mark really",
    "i was thinking period period period maybe we should stop",
    "new paragraph this is a new section period",
    "what do you think question mark i'm not sure exclamation mark"
  ]
  
  console.log('Speech Formatter Test Results:')
  testCases.forEach((testCase, index) => {
    const formatted = formatSpeechText(testCase)
    console.log(`${index + 1}. "${testCase}" → "${formatted}"`)
  })
}