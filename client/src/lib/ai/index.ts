// Simplified AI System - Hugging Face Primary with Basic Fallback
// Streamlined architecture using only the working server-side Hugging Face API

import type { AIAnalysisResult } from './types';

// Main AI analysis function - Server-side Hugging Face API with simple fallback
export async function analyzeJournalEntry(text: string, userId: string): Promise<AIAnalysisResult> {
  try {
    // Primary analysis: Call Hugging Face API endpoint directly
    console.log('🚀 Calling server-side Hugging Face API for:', text.substring(0, 50) + '...')
    
    const response = await fetch('/api/huggingface/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    })

    if (response.ok) {
      const hfResult = await response.json()
      console.log('✅ Server-side Hugging Face analysis successful:', hfResult)
      
      // Convert Hugging Face server result to our expected format
      const result: AIAnalysisResult = {
        primary_mood: hfResult.primary_mood,
        confidence: hfResult.confidence,
        energy: hfResult.energy,
        mood_polarity: hfResult.primary_mood === 'excited' || hfResult.primary_mood === 'confident' || hfResult.primary_mood === 'optimistic' ? 'Positive' : 
                       hfResult.primary_mood === 'frustrated' || hfResult.primary_mood === 'stressed' || hfResult.primary_mood === 'concerned' ? 'Negative' : 'Neutral',
        emotions: hfResult.emotions || [hfResult.primary_mood],
        business_category: hfResult.business_category,
        insights: hfResult.insights || [],
        ai_heading: hfResult.ai_heading,
        analysis_source: hfResult.analysis_source,
        rules_matched: [],
        user_learned: false,
        analysis_method: 'hugging-face-ai'
      }
      
      console.log('Hugging Face AI analysis successful:', result)
      return result
    } else {
      console.warn('Hugging Face API failed, using simple fallback')
    }
  } catch (error) {
    console.warn('Hugging Face server analysis failed:', error)
  }
  
  // Simple fallback analysis
  console.log('Using simple fallback analysis');
  return generateSimpleFallback(text);
}

// Simple fallback that mirrors the server-side fallback logic
function generateSimpleFallback(text: string): AIAnalysisResult {
  const lowerText = text.toLowerCase();
  
  // Basic mood detection
  let primary_mood = 'focused';
  let energy: 'high' | 'medium' | 'low' = 'medium';
  let business_category = 'reflection';
  
  // Positive indicators
  if (lowerText.includes('success') || lowerText.includes('excited') || lowerText.includes('achievement')) {
    primary_mood = 'excited';
    energy = 'high';
    business_category = 'achievement';
  }
  // Negative indicators
  else if (lowerText.includes('problem') || lowerText.includes('challenge') || lowerText.includes('difficult')) {
    primary_mood = 'concerned';
    energy = 'low';
    business_category = 'challenge';
  }
  // Planning indicators
  else if (lowerText.includes('plan') || lowerText.includes('strategy') || lowerText.includes('funding') || lowerText.includes('investment')) {
    primary_mood = 'focused';
    energy = 'high';
    business_category = 'planning';
  }
  
  // Generate basic heading
  let ai_heading = 'Business reflection';
  if (lowerText.includes('funding') || lowerText.includes('investment')) ai_heading = 'Funding discussion';
  else if (lowerText.includes('team') || lowerText.includes('hiring')) ai_heading = 'Team update';
  else if (lowerText.includes('product') || lowerText.includes('launch')) ai_heading = 'Product progress';
  else if (lowerText.includes('sales') || lowerText.includes('revenue')) ai_heading = 'Sales update';
  
  return {
    primary_mood,
    confidence: 60, // Lower confidence for fallback
    energy,
    mood_polarity: primary_mood === 'excited' ? 'Positive' : primary_mood === 'concerned' ? 'Negative' : 'Neutral',
    emotions: [primary_mood],
    business_category,
    insights: ['Basic analysis available. Full AI insights will resume when server connection is restored.'],
    ai_heading,
    analysis_source: 'simple-fallback',
    rules_matched: [],
    user_learned: false,
    analysis_method: 'simple-fallback'
  };
}

// Initialize AI system (simplified)
export function initializeAISystem(): boolean {
  console.log('Simplified AI System initialized - using server-side Hugging Face analysis');
  return true;
}

// Compatibility aliases
export const initializeEnhancedAI = initializeAISystem;

// Simplified feedback recording (just logs for now)
export function recordUserCorrection(feedback: any): void {
  console.log('User feedback recorded:', feedback);
  // Could implement localStorage persistence here if needed
}