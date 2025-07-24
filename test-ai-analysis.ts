// Test AI analysis to debug title generation
// Mock localStorage for Node.js environment
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null
}

// Import just the function we need
import { generateBusinessTitle } from './client/src/lib/aiTitleGenerator'

const testContent = "I feel sad today and dont have the energy"

console.log('Testing title generation...')
console.log('Content:', testContent)

const title = generateBusinessTitle(testContent, 'Challenge', 'Reflective', 'low')
console.log('Generated title:', title)

// Test analysis
try {
  const { analyzeBusinessSentimentAI } = require('./client/src/lib/aiSentimentAnalysis')
  
  console.log('\nTesting full AI analysis...')
  analyzeBusinessSentimentAI(testContent).then(result => {
    console.log('AI Result:', {
      mood: result.primary_mood,
      category: result.business_category,
      suggested_title: result.suggested_title || 'NO TITLE GENERATED',
      confidence: result.confidence
    })
  }).catch(error => {
    console.error('AI Analysis failed:', error.message)
  })
} catch (error) {
  console.error('Import failed:', error.message)
}