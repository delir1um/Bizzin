// Server-side Hugging Face API integration
import express from 'express';

const router = express.Router();

interface HuggingFaceResponse {
  label: string;
  score: number;
}

// Hugging Face model endpoints
const HF_MODELS = {
  sentiment: 'cardiffnlp/twitter-roberta-base-sentiment',
  emotion: 'j-hartmann/emotion-english-distilroberta-base'
};

async function callHuggingFaceAPI(text: string, model: string): Promise<HuggingFaceResponse[]> {
  const apiKey = process.env.HUGGING_FACE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Hugging Face API key not configured');
  }

  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  return response.json();
}

// Analyze sentiment using Hugging Face models
router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('🚀 Server-side Hugging Face analysis starting for:', text.substring(0, 50) + '...');

    // Get sentiment and emotion analysis
    const [sentimentData, emotionData] = await Promise.all([
      callHuggingFaceAPI(text, HF_MODELS.sentiment),
      callHuggingFaceAPI(text, HF_MODELS.emotion)
    ]);

    console.log('✅ Hugging Face API calls successful');

    // Process results
    const topSentiment = sentimentData[0];
    const topEmotion = emotionData[0];

    console.log('Processing Hugging Face results:', { topSentiment, topEmotion });

    // Map sentiment to business mood with proper label handling
    let primaryMood = 'focused';
    let energy: 'high' | 'medium' | 'low' = 'medium';
    
    // Handle different sentiment label formats
    const sentimentLabel = topSentiment.label;
    const sentimentScore = topSentiment.score;
    
    if (sentimentLabel === 'LABEL_2' || sentimentLabel === 'POSITIVE' || sentimentLabel.includes('positive')) {
      primaryMood = 'optimistic';
      energy = 'high';
    } else if (sentimentLabel === 'LABEL_0' || sentimentLabel === 'NEGATIVE' || sentimentLabel.includes('negative')) {
      primaryMood = 'frustrated';
      energy = 'low';
    }

    // Enhance with emotion data - check if emotion data exists and has valid content
    if (topEmotion && topEmotion.label && topEmotion.score > 0.3) {
      const emotionLabel = topEmotion.label.toLowerCase();
      if (emotionLabel === 'joy') {
        primaryMood = 'excited';
        energy = 'high';
      } else if (emotionLabel === 'anger') {
        primaryMood = 'frustrated';
        energy = 'low';
      } else if (emotionLabel === 'sadness') {
        primaryMood = 'sad';
        energy = 'low';
      } else if (emotionLabel === 'fear') {
        primaryMood = 'uncertain';
        energy = 'low';
      }
    }

    // Enhanced business category detection with better pattern matching
    const lowerText = text.toLowerCase();
    let category = 'reflection';
    
    // Achievement patterns - contracts, deals, success
    if (lowerText.includes('contract') || lowerText.includes('deal') || lowerText.includes('signed') || 
        lowerText.includes('closed') || lowerText.includes('won') || lowerText.includes('achieved') || 
        lowerText.includes('completed') || lowerText.includes('milestone') || lowerText.includes('breakthrough') ||
        lowerText.includes('success') || lowerText.includes('record') || lowerText.includes('incredible')) {
      category = 'achievement';
    }
    // Growth patterns - revenue, scaling, expansion
    else if (lowerText.includes('revenue') || lowerText.includes('growth') || lowerText.includes('expand') ||
             lowerText.includes('scaling') || lowerText.includes('clients') || lowerText.includes('customers') ||
             lowerText.includes('funding') || lowerText.includes('investment') || lowerText.includes('series')) {
      category = 'growth';
    }
    // Challenge patterns - problems, issues, outages
    else if (lowerText.includes('problem') || lowerText.includes('challenge') || lowerText.includes('difficult') ||
             lowerText.includes('down') || lowerText.includes('outage') || lowerText.includes('issue') ||
             lowerText.includes('error') || lowerText.includes('failed') || lowerText.includes('quit') ||
             lowerText.includes('resigned')) {
      category = 'challenge';
    }
    // Planning patterns - strategy, plans, future
    else if (lowerText.includes('plan') || lowerText.includes('strategy') || lowerText.includes('roadmap') ||
             lowerText.includes('timeline') || lowerText.includes('future') || lowerText.includes('prepare')) {
      category = 'planning';
    }
    // Learning patterns - feedback, insights, learned
    else if (lowerText.includes('learned') || lowerText.includes('feedback') || lowerText.includes('insight') ||
             lowerText.includes('understand') || lowerText.includes('realize') || lowerText.includes('suggestion')) {
      category = 'learning';
    }

    // Calculate confidence properly, handling cases where emotion might be missing
    const sentimentConfidence = topSentiment.score || 0.5;
    const emotionConfidence = (topEmotion && topEmotion.score) || 0.5;
    const finalConfidence = Math.round(Math.max(sentimentConfidence, emotionConfidence) * 100);
    
    // Generate contextual business insights
    const insights = [`Real AI analysis: ${primaryMood} sentiment in ${category} context - ${finalConfidence}% confidence`];
    if (category === 'achievement' && energy === 'high') {
      insights.push('Channel this success momentum into tackling bigger challenges while confidence is high');
    } else if (category === 'challenge' && energy === 'low') {
      insights.push('Challenges reveal areas for growth - document lessons learned for future problem-solving');
    }

    const result = {
      primary_mood: primaryMood,
      confidence: finalConfidence,
      energy,
      emotions: [primaryMood],
      business_category: category,
      insights,
      analysis_source: 'hugging-face-server'
    };

    console.log('✅ Server-side analysis complete:', result);
    res.json(result);

  } catch (error) {
    console.error('❌ Hugging Face analysis failed:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;