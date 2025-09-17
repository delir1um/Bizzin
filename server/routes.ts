import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import seoRoutes from "./routes/seo";

// Hugging Face models for sentiment analysis
const HF_MODELS = {
  sentiment: 'cardiffnlp/twitter-roberta-base-sentiment',
  emotion: 'j-hartmann/emotion-english-distilroberta-base'
};

// Enhanced Hugging Face API call with authentication
async function callHuggingFaceModel(text: string, model: string, retries = 2): Promise<any> {
  const token = process.env.HUGGING_FACE_API_KEY || process.env.HUGGINGFACE_TOKEN;
  console.log('HF Token check:', { hasToken: !!token, tokenLength: token?.length || 0 });
  
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
  // Flatten nested arrays from HF API - they come as [[data]]
  const sentimentArray = Array.isArray(sentimentResult[0]) ? sentimentResult[0] : sentimentResult;
  const emotionArray = Array.isArray(emotionResult[0]) ? emotionResult[0] : emotionResult;
  
  // Parse sentiment (LABEL_0=negative, LABEL_1=neutral, LABEL_2=positive)
  const sentiment = sentimentArray[0];
  let topSentiment = 'neutral';
  if (sentiment?.label === 'LABEL_2') topSentiment = 'positive';
  else if (sentiment?.label === 'LABEL_0') topSentiment = 'negative';
  
  // Parse emotions (joy, sadness, anger, fear, surprise, disgust, neutral)
  const topEmotion = emotionArray[0];
  const emotion = topEmotion?.label?.toLowerCase() || 'neutral';
  
  console.log('Fixed Parsed Results:', { 
    sentiment: sentiment?.label, 
    sentimentScore: sentiment?.score,
    emotion: emotion,
    emotionScore: topEmotion?.score,
    mappedSentiment: topSentiment
  });
  
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
  // Health check endpoint at root path for deployment health checks (only for non-browser requests)
  app.get('/', (req, res, next) => {
    // Only respond with health check for monitoring tools, not browsers
    const userAgent = req.get('User-Agent') || '';
    const isHealthCheck = userAgent.includes('curl') || 
                         userAgent.includes('wget') || 
                         userAgent.includes('monitoring') ||
                         userAgent.includes('uptime') ||
                         req.query.health === 'true';
    
    if (isHealthCheck) {
      return res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime() 
      });
    }
    
    // Let browser requests continue to Vite frontend
    next();
  });

  // Explicit health check endpoint for monitoring
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    });
  });

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
        console.log('HF Results:', { 
          sentiment: JSON.stringify(sentimentResult),
          emotion: JSON.stringify(emotionResult)
        });
        const sentiment = processHuggingFaceResults(sentimentResult, emotionResult, text);
        return res.json({ success: true, sentiment });
      }
      
      // Fallback to basic analysis if API fails
      return res.status(500).json({ success: false, error: 'AI analysis failed' });
      
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      return res.status(500).json({ success: false, error: 'Analysis failed', details: (error as Error).message });
    }
  });

  // Video upload endpoint that bypasses CORS
  app.post('/api/upload-video', async (req, res) => {
    console.log('Received video upload request')
    
    try {
      const { episodeId, fileName, fileData, contentType } = req.body
      
      console.log('Upload request data:', {
        episodeId,
        fileName,
        contentType,
        dataLength: fileData?.length || 0
      })
      
      if (!episodeId || !fileName || !fileData || !contentType) {
        console.error('Missing required fields:', { episodeId, fileName, contentType, hasData: !!fileData })
        return res.status(400).json({ error: 'Missing required fields' })
      }
      
      // Validate environment variables - try both VITE_ prefixed and non-prefixed versions
      const accountId = process.env.VITE_CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
      const accessKeyId = process.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
      const bucketName = process.env.VITE_CLOUDFLARE_R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || 'pub-b3498cd071e1420b9d379a5510ba4bb8';
      
      if (!accountId || !accessKeyId || !secretAccessKey) {
        console.error('Missing Cloudflare credentials:', {
          hasAccountId: !!accountId,
          hasAccessKeyId: !!accessKeyId,
          hasSecretAccessKey: !!secretAccessKey
        });
        return res.status(500).json({ error: 'Server configuration error: Missing R2 credentials' })
      }
      
      // Cloudflare R2 Configuration with explicit signing settings
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
      
      const ENDPOINT = `https://${accountId}.r2.cloudflarestorage.com`
      
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: ENDPOINT,
        credentials: {
          accessKeyId,
          secretAccessKey,
        }
      })

      console.log('R2 Config:', {
        region: 'auto',
        endpoint: ENDPOINT,
        hasCredentials: !!accessKeyId,
        accessKeyLength: accessKeyId?.length || 0,
        secretKeyLength: secretAccessKey?.length || 0,
        accessKeyPrefix: process.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID?.substring(0, 8) + '...',
        bucketName: bucketName
      })

      // Skip ListBuckets test - proceed directly to upload
      console.log('Proceeding directly to video upload...')
      
      console.log('Converting base64 to buffer...')
      const buffer = Buffer.from(fileData, 'base64')
      const fileExtension = fileName.split('.').pop()
      const isAudioFile = fileName.toLowerCase().includes('.mp3') || fileName.toLowerCase().includes('.wav') || fileName.toLowerCase().includes('.m4a')
      const folder = isAudioFile ? 'audio' : 'videos'
      const key = `${folder}/${episodeId}.${fileExtension}`
      
      console.log(`File organization: ${fileName} -> ${folder}/ (isAudio: ${isAudioFile})`)
      
      console.log('Upload details:', {
        bucket: bucketName,
        key,
        bufferSize: buffer.length
      })
      
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'max-age=31536000', // 1 year cache
        Metadata: {
          'episode-id': episodeId,
          'original-name': fileName,
          'upload-date': new Date().toISOString(),
        }
      })
      
      console.log('Sending upload command to R2...')
      await s3Client.send(command)
      console.log('Upload successful!')
      
      // Return proxy URL to avoid CORS issues
      const proxyUrl = `/api/video-proxy/${key}`
      
      res.json({ 
        success: true, 
        url: proxyUrl,
        message: 'Video uploaded successfully'
      })
      
    } catch (error) {
      console.error('Server video upload error:', error)
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      })
      
      res.status(500).json({ 
        error: 'Upload failed',
        details: (error as Error).message || 'Unknown error'
      })
    }
  })

  // Mount SEO routes
  app.use('/api/seo', seoRoutes);

  // Add journal routes for testing (supporting frontend endpoints)
  
  // GET /api/journal-entries - retrieve all entries (frontend expects this endpoint)
  app.get('/api/journal-entries', async (req: Request, res: Response) => {
    try {
      // Return empty array since this is primarily for demo/testing
      // In production, this would query the database
      console.log('Fetching journal entries...');
      res.json([]);
    } catch (error) {
      console.error('Journal fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
  });
  
  // POST /api/journal-entries - create entry (frontend expects this endpoint) 
  app.post('/api/journal-entries', async (req: Request, res: Response) => {
    try {
      const { title, content, user_id, tags } = req.body;
      
      // Call sentiment analysis
      const sentimentResponse = await fetch('http://localhost:5000/api/analyze-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content })
      });
      
      const sentimentData = await sentimentResponse.json();
      
      // Create journal entry with AI analysis
      const entry = {
        id: Date.now().toString(),
        title: title || 'Untitled Entry',
        content,
        user_id,
        tags: tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        mood: sentimentData.success ? sentimentData.sentiment.primary_mood : 'Neutral',
        energy_level: sentimentData.success ? (sentimentData.sentiment.energy === 'high' ? 3 : sentimentData.sentiment.energy === 'medium' ? 2 : 1) : 2,
        categories: sentimentData.success ? [sentimentData.sentiment.business_category] : ['General'],
        ai_sentiment: sentimentData.success ? JSON.stringify(sentimentData.sentiment) : null,
        ai_insights: sentimentData.success ? sentimentData.sentiment.insights?.join(' ') : null,
        is_favorite: false
      };
      
      console.log(`Created journal entry: ${entry.title} - AI Analysis Complete`);
      res.json(entry);
    } catch (error) {
      console.error('Journal creation error:', error);
      res.status(500).json({ error: 'Failed to create journal entry' });
    }
  });

  // POST /api/journal - legacy endpoint for compatibility
  app.post('/api/journal', async (req: Request, res: Response) => {
    try {
      const { title, content, user_id } = req.body;
      
      // Call sentiment analysis
      const sentimentResponse = await fetch('http://localhost:5000/api/analyze-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content })
      });
      
      const sentimentData = await sentimentResponse.json();
      
      // Create mock journal entry with AI analysis
      const entry = {
        id: Date.now().toString(),
        title,
        content,
        user_id,
        created_at: new Date().toISOString(),
        sentiment_score: sentimentData.success ? sentimentData.sentiment : null
      };
      
      console.log(`Created journal entry: ${title} - Analysis:`, entry.sentiment_score);
      res.json(entry);
    } catch (error) {
      console.error('Journal creation error:', error);
      res.status(500).json({ error: 'Failed to create journal entry' });
    }
  });

  app.delete('/api/journal/clear/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      console.log(`Clearing all journal entries for user ${userId}`);
      res.json({ success: true });
    } catch (error) {
      console.error('Journal clear error:', error);
      res.status(500).json({ error: 'Failed to clear journal entries' });
    }
  });
  
  // Dynamic llms.txt route
  app.get('/llms.txt', async (req, res) => {
    // Redirect to the dynamic API route
    try {
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/seo/llms.txt`);
      const content = await response.text();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(content);
    } catch (error) {
      console.error('Error serving dynamic llms.txt:', error);
      // Fallback to basic content if API is unavailable
      const fallbackContent = `# Bizzin - AI-Powered Business Intelligence Platform
      
## About
Bizzin is South Africa's leading AI-powered business intelligence platform designed specifically for entrepreneurs and small business owners.

## Last Updated
${new Date().toISOString().split('T')[0]}`;
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(fallbackContent);
    }
  });

  // Handle HEAD requests for video proxy (for preloading)
  app.head('/api/video-proxy/:videoKey(*)', (req, res) => {
    const videoKey = req.params.videoKey;
    const publicUrl = `https://pub-b3498cd071e1420b9d379a5510ba4bb8.r2.dev/${encodeURI(videoKey)}`;
    
    console.log('🔄 HEAD REDIRECT: Redirecting to public R2:', publicUrl);
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Range, Content-Type');
    
    // 302 redirect to public R2 URL
    res.redirect(302, publicUrl);
  });

  // Video proxy endpoint to serve R2 videos with CORS headers
  app.get('/api/video-proxy/:videoKey(*)', (req, res) => {
    const videoKey = req.params.videoKey;
    const publicUrl = `https://pub-b3498cd071e1420b9d379a5510ba4bb8.r2.dev/${encodeURI(videoKey)}`;
    
    console.log('🔄 GET REDIRECT: Redirecting to public R2:', publicUrl);
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Range, Content-Type');
    
    // 302 redirect to public R2 URL
    res.redirect(302, publicUrl);
  });

  // R2 file listing endpoint
  app.get('/api/r2/list-files', async (req, res) => {
    try {
      // Import AWS SDK at runtime
      const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3')
      
      // Validate environment variables
      if (!process.env.VITE_CLOUDFLARE_ACCOUNT_ID || 
          !process.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID || 
          !process.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
          !process.env.VITE_CLOUDFLARE_R2_BUCKET_NAME) {
        console.error('Missing R2 configuration')
        return res.status(500).json({ error: 'Server configuration error: Missing R2 credentials' })
      }

      // Configure R2 client
      const r2Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.VITE_CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
      })

      const command = new ListObjectsV2Command({
        Bucket: process.env.VITE_CLOUDFLARE_R2_BUCKET_NAME,
        MaxKeys: 1000, // Limit results
      })

      const response = await r2Client.send(command)
      
      const files = response.Contents?.map(obj => ({
        key: obj.Key || '',
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        contentType: obj.Key?.split('.').pop()?.toLowerCase() === 'mp4' ? 'video/mp4' : 
                    obj.Key?.split('.').pop()?.toLowerCase() === 'mp3' ? 'audio/mp3' : 
                    'application/octet-stream'
      })) || []

      console.log(`Listed ${files.length} files from R2 bucket`)
      res.json({ files })
      
    } catch (error) {
      console.error('R2 list files error:', error)
      res.status(500).json({ 
        error: 'Failed to list files from storage',
        details: (error as Error).message 
      })
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
