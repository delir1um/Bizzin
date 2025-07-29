import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Hugging Face models for sentiment analysis
const HF_MODELS = {
  sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
  emotion: 'j-hartmann/emotion-english-distilroberta-base'
};

// Enhanced Hugging Face API call with authentication
async function callHuggingFaceModel(text: string, model: string, retries = 2): Promise<any> {
  const token = process.env.HUGGINGFACE_TOKEN;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          inputs: text,
          options: { wait_for_model: true }
        }),
      });

      if (response.status === 503 && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HF API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`HF API error: ${result.error}`);
      }

      return result;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

function processHuggingFaceResults(sentimentResult: any, emotionResult: any, text: string) {
  // Parse sentiment (POSITIVE/NEGATIVE/NEUTRAL)
  const sentiment = sentimentResult[0];
  const topSentiment = sentiment?.label?.toLowerCase() || 'neutral';
  
  // Parse emotions
  const topEmotion = emotionResult[0];
  const emotion = topEmotion?.label?.toLowerCase() || 'neutral';
  
  // Map to business categories and moods
  const businessCategory = mapTextToBusinessCategory(text);
  const primaryMood = mapEmotionToMood(emotion, topSentiment);
  
  // Calculate confidence (average the two model confidences)
  const confidence = Math.round(((sentiment?.score || 0.5) + (topEmotion?.score || 0.5)) / 2 * 100);
  
  // Generate insights
  const insights = generateBusinessInsights(text, primaryMood, businessCategory, confidence);
  
  return {
    primary_mood: primaryMood,
    confidence: Math.max(45, Math.min(95, confidence)), // Clamp between 45-95%
    energy: getEnergyLevel(primaryMood, topSentiment),
    emotions: [emotion],
    insights: insights,
    business_category: businessCategory,
    analysis_source: 'ai'
  };
}

function mapTextToBusinessCategory(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('growth') || lowerText.includes('scaling') || lowerText.includes('opportunity') || lowerText.includes('next big') || lowerText.includes('cant wait') || lowerText.includes('excited')) {
    return 'Growth';
  }
  if (lowerText.includes('problem') || lowerText.includes('challenge') || lowerText.includes('difficult') || lowerText.includes('expensive') || lowerText.includes('sad') || lowerText.includes('tired')) {
    return 'Challenge';
  }
  if (lowerText.includes('success') || lowerText.includes('accomplished') || lowerText.includes('achieved') || lowerText.includes('milestone')) {
    return 'Achievement';
  }
  if (lowerText.includes('plan') || lowerText.includes('strategy') || lowerText.includes('need') || lowerText.includes('car') || lowerText.includes('computer') || lowerText.includes('equipment')) {
    return 'Planning';
  }
  if (lowerText.includes('learned') || lowerText.includes('feedback') || lowerText.includes('customers') || lowerText.includes('respond')) {
    return 'Learning';
  }
  
  return 'Research';
}

function mapEmotionToMood(emotion: string, sentiment: string): string {
  if (emotion === 'joy' || sentiment === 'positive') return 'Excited';
  if (emotion === 'sadness' || sentiment === 'negative') return 'Reflective';
  if (emotion === 'anger' || emotion === 'fear') return 'Frustrated';
  if (emotion === 'surprise') return 'Curious';
  return 'Confident';
}

function getEnergyLevel(mood: string, sentiment: string): string {
  if (mood === 'Excited' || sentiment === 'positive') return 'high';
  if (mood === 'Reflective' || sentiment === 'negative') return 'low';
  return 'medium';
}

function generateBusinessInsights(text: string, mood: string, category: string, confidence: number): string[] {
  const insights = [];
  
  if (category === 'Challenge') {
    insights.push("This challenge presents an opportunity for creative problem-solving and growth.");
  } else if (category === 'Growth') {
    insights.push("Exciting growth opportunities ahead - consider documenting your strategy and milestones.");
  } else if (category === 'Planning') {
    insights.push("Strategic planning is key to business success - break down your goals into actionable steps.");
  } else if (category === 'Learning') {
    insights.push("Customer feedback and learning experiences are valuable assets for business improvement.");
  } else {
    insights.push("Regular reflection and documentation help track your entrepreneurial journey.");
  }
  
  return insights;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Test API endpoint
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working', timestamp: new Date().toISOString() });
  });

  // Sentiment analysis API endpoint
  app.post('/api/analyze-sentiment', async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ success: false, error: 'Text is required' });
      }

      // Call Hugging Face API with authentication
      const [sentimentResult, emotionResult] = await Promise.all([
        callHuggingFaceModel(text, HF_MODELS.sentiment),
        callHuggingFaceModel(text.substring(0, 500), HF_MODELS.emotion)
      ]);

      if (sentimentResult && emotionResult) {
        const sentiment = processHuggingFaceResults(sentimentResult, emotionResult, text);
        return res.json({ success: true, sentiment });
      }
      
      // Fallback to basic analysis if API fails
      return res.status(500).json({ success: false, error: 'AI analysis failed' });
      
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return res.status(500).json({ success: false, error: 'Analysis failed' });
    }
  });

  // Video upload endpoint that bypasses CORS
  app.post('/api/upload-video', async (req, res) => {
    try {
      const { episodeId, fileName, fileData, contentType } = req.body
      
      if (!episodeId || !fileName || !fileData || !contentType) {
        return res.status(400).json({ error: 'Missing required fields' })
      }
      
      // Cloudflare R2 Configuration
      const R2_CONFIG = {
        region: 'auto',
        endpoint: `https://${process.env.VITE_CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
        },
        forcePathStyle: true,
      }

      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
      const s3Client = new S3Client(R2_CONFIG)
      const BUCKET_NAME = process.env.VITE_CLOUDFLARE_R2_BUCKET_NAME || 'bizzin-podcasts'
      
      // Convert base64 to buffer
      const buffer = Buffer.from(fileData, 'base64')
      const fileExtension = fileName.split('.').pop()
      const key = `videos/${episodeId}.${fileExtension}`
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          'episode-id': episodeId,
          'original-name': fileName,
          'upload-date': new Date().toISOString(),
        }
      })
      
      await s3Client.send(command)
      
      const publicUrl = `https://${process.env.VITE_CLOUDFLARE_R2_PUBLIC_DOMAIN}/${key}`
      
      res.json({ 
        success: true, 
        url: publicUrl,
        message: 'Video uploaded successfully'
      })
      
    } catch (error) {
      console.error('Server video upload error:', error)
      res.status(500).json({ 
        error: 'Upload failed',
        details: error.message 
      })
    }
  })

  const httpServer = createServer(app);
  return httpServer;
}
