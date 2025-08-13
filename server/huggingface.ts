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

    // Map sentiment to business mood
    let primaryMood = 'focused';
    let energy: 'high' | 'medium' | 'low' = 'medium';
    
    if (topSentiment.label === 'LABEL_2' || topSentiment.label === 'POSITIVE') {
      primaryMood = 'optimistic';
      energy = 'high';
    } else if (topSentiment.label === 'LABEL_0' || topSentiment.label === 'NEGATIVE') {
      primaryMood = 'frustrated';
      energy = 'low';
    }

    // Enhance with emotion data
    if (topEmotion.label === 'joy') primaryMood = 'excited';
    else if (topEmotion.label === 'anger') primaryMood = 'frustrated';
    else if (topEmotion.label === 'sadness') primaryMood = 'sad';
    else if (topEmotion.label === 'fear') primaryMood = 'uncertain';

    // Determine business category based on content analysis
    const lowerText = text.toLowerCase();
    let category = 'reflection';
    
    if (lowerText.includes('revenue') || lowerText.includes('growth') || lowerText.includes('expand')) {
      category = 'growth';
    } else if (lowerText.includes('problem') || lowerText.includes('challenge') || lowerText.includes('difficult')) {
      category = 'challenge';
    } else if (lowerText.includes('completed') || lowerText.includes('achieved') || lowerText.includes('success')) {
      category = 'achievement';
    } else if (lowerText.includes('plan') || lowerText.includes('strategy')) {
      category = 'planning';
    } else if (lowerText.includes('learned') || lowerText.includes('feedback')) {
      category = 'learning';
    }

    const result = {
      primary_mood: primaryMood,
      confidence: Math.round((topSentiment.score + topEmotion.score) * 50), // Average and scale to 0-100
      energy,
      emotions: [primaryMood],
      business_category: category,
      insights: [`AI-powered analysis: ${primaryMood} sentiment with ${energy} energy in ${category} context`],
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