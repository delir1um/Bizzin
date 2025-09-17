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
  app.head('/api/video-proxy/:videoKey(*)', async (req, res) => {
    try {
      const videoKey = req.params.videoKey;
      const bucketName = process.env.VITE_CLOUDFLARE_R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || 'pub-b3498cd071e1420b9d379a5510ba4bb8';
      
      console.log('🎬 HEAD: Video proxy request for:', videoKey, 'bucketName:', bucketName);
      
      // Fast path for public buckets - no credentials needed
      if (bucketName.startsWith('pub-')) {
        console.log('🚀 HEAD: Public bucket fast path for:', videoKey);
        const upstreamUrl = `https://${bucketName}.r2.dev/${videoKey}`;
        
        const upstreamResponse = await fetch(upstreamUrl, {
          method: 'HEAD',
          headers: {
            'Range': req.headers.range || ''
          }
        });
        
        console.log('HEAD upstream response:', upstreamResponse.status, upstreamResponse.statusText);
        
        // Set CORS headers
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Range, Content-Type');
        res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
        
        // Copy relevant headers from upstream
        const contentType = upstreamResponse.headers.get('content-type') || 'video/mp4';
        const contentLength = upstreamResponse.headers.get('content-length') || '0';
        const acceptRanges = upstreamResponse.headers.get('accept-ranges') || 'bytes';
        const cacheControl = upstreamResponse.headers.get('cache-control') || 'public, max-age=3600, immutable';
        
        res.header('Content-Type', contentType);
        res.header('Content-Length', contentLength);
        res.header('Accept-Ranges', acceptRanges);
        res.header('Cache-Control', cacheControl);
        
        return res.status(upstreamResponse.status).end();
      }
      
      // Fallback to S3 SDK for private buckets
      console.log('📦 HEAD: Private bucket path for:', videoKey);
      const accountId = process.env.VITE_CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
      const accessKeyId = process.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
      
      if (!accountId || !accessKeyId || !secretAccessKey) {
        console.error('Private bucket HEAD request missing credentials');
        return res.status(500).end();
      }
      
      const { S3Client, HeadObjectCommand } = await import('@aws-sdk/client-s3');
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        }
      });
      
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: videoKey,
      });
      
      const response = await s3Client.send(command);
      
      // Set headers for HEAD request
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Content-Type', response.ContentType || 'video/mp4');
      res.header('Content-Length', response.ContentLength?.toString() || '0');
      res.header('Accept-Ranges', 'bytes');
      res.header('Cache-Control', 'public, max-age=3600, immutable');
      res.status(200).end();
      
    } catch (error) {
      console.error('HEAD request error:', error);
      res.status(404).end();
    }
  });

  // Video proxy endpoint to serve R2 videos with CORS headers
  app.get('/api/video-proxy/:videoKey(*)', async (req, res) => {
    let videoKey = '';
    let isVideo = false;
    let isLargeVideo = false; // Define at function scope to fix LSP errors
    
    try {
      videoKey = req.params.videoKey;
      isVideo = videoKey.toLowerCase().includes('.mp4') || videoKey.toLowerCase().includes('.webm') || videoKey.toLowerCase().includes('.mov');
      const bucketName = process.env.VITE_CLOUDFLARE_R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || 'pub-b3498cd071e1420b9d379a5510ba4bb8';
      
      console.log('🎬 GET: Video proxy request for:', videoKey, 'isVideo:', isVideo, 'bucketName:', bucketName, 'environment:', process.env.NODE_ENV, 'timestamp:', new Date().toISOString());
      
      // Fast path for public buckets - no credentials needed, direct proxy
      if (bucketName.startsWith('pub-')) {
        console.log('🚀 GET: Public bucket fast path for:', videoKey);
        const upstreamUrl = `https://${bucketName}.r2.dev/${videoKey}`;
        
        // Build fetch headers
        const upstreamHeaders: Record<string, string> = {};
        if (req.headers.range) {
          upstreamHeaders['Range'] = req.headers.range;
        }
        
        console.log('Proxying to:', upstreamUrl, 'with headers:', upstreamHeaders);
        
        const upstreamResponse = await fetch(upstreamUrl, {
          method: 'GET',
          headers: upstreamHeaders
        });
        
        console.log('Upstream response:', upstreamResponse.status, upstreamResponse.statusText);
        
        // Set CORS headers first
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Range, Content-Type');
        res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
        
        // Copy relevant headers from upstream
        const contentType = upstreamResponse.headers.get('content-type');
        const contentLength = upstreamResponse.headers.get('content-length');
        const contentRange = upstreamResponse.headers.get('content-range');
        const acceptRanges = upstreamResponse.headers.get('accept-ranges');
        const cacheControl = upstreamResponse.headers.get('cache-control');
        const etag = upstreamResponse.headers.get('etag');
        
        if (contentType) res.header('Content-Type', contentType);
        if (contentLength) res.header('Content-Length', contentLength);
        if (contentRange) res.header('Content-Range', contentRange);
        if (acceptRanges) res.header('Accept-Ranges', acceptRanges);
        if (cacheControl) res.header('Cache-Control', cacheControl);
        if (etag) res.header('ETag', etag);
        
        // Set status code from upstream (200, 206 for range, 404 for not found, etc.)
        res.status(upstreamResponse.status);
        
        if (upstreamResponse.body) {
          // Stream the response body
          const reader = upstreamResponse.body.getReader();
          
          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                if (!res.destroyed) {
                  res.write(Buffer.from(value));
                }
              }
              if (!res.destroyed) {
                res.end();
              }
            } catch (streamError) {
              console.error('Stream error for', videoKey, ':', streamError);
              if (!res.destroyed && !res.headersSent) {
                res.status(500).end();
              }
            }
          };
          
          // Handle client disconnect
          req.on('close', () => {
            console.log('🔌 Client disconnected from public bucket proxy:', videoKey);
            reader.cancel();
          });
          
          req.on('error', () => {
            reader.cancel();
          });
          
          await pump();
          return;
        } else {
          res.end();
          return;
        }
      }
      
      // Fallback to S3 SDK for private buckets
      console.log('📦 GET: Private bucket path for:', videoKey);
      const accountId = process.env.VITE_CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
      const accessKeyId = process.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
      
      if (!accountId || !accessKeyId || !secretAccessKey) {
        console.error('Missing Cloudflare credentials for private bucket:', {
          hasAccountId: !!accountId,
          hasAccessKeyId: !!accessKeyId,
          hasSecretAccessKey: !!secretAccessKey
        });
        return res.status(500).json({ error: 'Server configuration error: Missing R2 credentials for private bucket' });
      }
      
      const { S3Client, GetObjectCommand, HeadObjectCommand } = await import('@aws-sdk/client-s3');
      
      // Production-optimized configuration for large video files
      // Check if we should use public R2 dev endpoint based on bucket format
      const isPublicR2 = bucketName.startsWith('pub-') || process.env.CLOUDFLARE_R2_PUBLIC_ENDPOINT;
      const endpoint = isPublicR2 
        ? `https://${bucketName}.r2.dev` 
        : `https://${accountId}.r2.cloudflarestorage.com`;
      
      console.log('🔧 R2 Endpoint configuration:', {
        bucketName,
        isPublicR2,
        endpoint,
        accountId: accountId?.substring(0, 8) + '...',
        credentialsValid: !!(accountId && accessKeyId && secretAccessKey)
      });
      
      const s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        maxAttempts: 3,
        retryMode: 'adaptive'
      });
      
      // Handle large video files differently in production
      isLargeVideo = isVideo && (videoKey.includes('.mp4') || videoKey.includes('.webm'));
      console.log('Video handling setup:', { isVideo, isLargeVideo, videoKey, accountId: accountId?.substring(0, 8) + '...' });
      if (isLargeVideo) {
        console.log(`🎬 Large video detected: ${videoKey}, applying production optimizations`);
      }
      
      // Set CORS headers first
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Range, Content-Type');
      res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
      
      // Check if this is a range request - if so, get file metadata first
      const range = req.headers.range;
      
      if (range) {
        console.log('Range request for:', videoKey, 'Range:', range);
        
        // Get file metadata first
        const headCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: videoKey,
        });
        
        const headResponse = await s3Client.send(headCommand);
        const fileSize = headResponse.ContentLength || 0;
        
        console.log('File metadata:', {
          ContentType: headResponse.ContentType,
          ContentLength: fileSize,
        });
        
        // Set headers based on metadata
        res.header('Content-Type', headResponse.ContentType || (isVideo ? 'video/mp4' : 'audio/mp3'));
        res.header('Accept-Ranges', 'bytes');
        res.header('Cache-Control', 'public, max-age=3600, immutable');
        res.header('ETag', `"${videoKey}-${fileSize}"`);
        
        // Parse range
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        // Optimize chunk size for video vs audio - smaller chunks for large videos in production
        let chunkSize;
        if (isLargeVideo && fileSize > 100 * 1024 * 1024) { // Files larger than 100MB
          chunkSize = 2 * 1024 * 1024; // 2MB chunks for very large videos
          console.log(`📦 Using 2MB chunks for large video (${Math.round(fileSize / 1024 / 1024)}MB)`);
        } else if (isVideo) {
          chunkSize = 5 * 1024 * 1024; // 5MB for regular videos
        } else {
          chunkSize = 1024 * 1024; // 1MB for audio
        }
        
        if (!parts[1]) { // If no end specified, request a larger initial chunk
          end = Math.min(start + chunkSize - 1, fileSize - 1);
        }
        
        console.log(`Serving range bytes ${start}-${end}/${fileSize} (chunk: ${end - start + 1} bytes)`);
        
        const rangeCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: videoKey,
          Range: `bytes=${start}-${end}`,
        });
        
        const rangeResponse = await s3Client.send(rangeCommand);
        
        res.status(206);
        res.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.header('Content-Length', rangeResponse.ContentLength?.toString() || '0');
        
        if (rangeResponse.Body) {
          const stream = rangeResponse.Body as any;
          
          // Enhanced error handling for large videos
          stream.on('error', (streamError: any) => {
            console.error(`❌ Stream error for ${videoKey} (${isLargeVideo ? 'large video' : 'regular'}):`, {
              error: streamError.message,
              code: streamError.code,
              fileSize: Math.round(fileSize / 1024 / 1024) + 'MB'
            });
            if (!res.destroyed && !res.headersSent) {
              res.status(500).end();
            }
          });
          
          // Handle connection close with logging
          req.on('close', () => {
            if (isLargeVideo) {
              console.log(`🔌 Client disconnected from large video: ${videoKey}`);
            }
            if (stream.destroy) stream.destroy();
          });
          
          // Add timeout protection for large files
          req.on('timeout', () => {
            console.error(`⏰ Request timeout for ${videoKey}`);
            if (stream.destroy) stream.destroy();
          });
          
          stream.pipe(res);
        }
      } else {
        // Full file request
        console.log('Full file request for:', videoKey);
        
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: videoKey,
        });
        
        const response = await s3Client.send(command);
        console.log('R2 response received:', {
          ContentType: response.ContentType,
          ContentLength: response.ContentLength,
          hasBody: !!response.Body
        });
        
        // Set appropriate content type and headers for media streaming
        res.header('Content-Type', response.ContentType || (isVideo ? 'video/mp4' : 'audio/mp3'));
        res.header('Accept-Ranges', 'bytes');
        res.header('Cache-Control', 'public, max-age=3600, immutable');
        res.header('ETag', `"${videoKey}-${response.ContentLength}"`);
        
        if (response.ContentLength) {
          res.header('Content-Length', response.ContentLength.toString());
        }
        
        if (response.Body) {
          const stream = response.Body as any;
          
          // For large videos, we should avoid full file downloads - suggest range requests
          if (isLargeVideo && response.ContentLength && response.ContentLength > 50 * 1024 * 1024) {
            console.warn(`⚠️ Full download requested for large video ${videoKey} (${Math.round(response.ContentLength / 1024 / 1024)}MB) - this may cause memory issues`);
            
            // Suggest range request to client
            res.header('Accept-Ranges', 'bytes');
            res.header('X-Large-File-Warning', 'Consider using range requests for better performance');
          }
          
          stream.on('error', (streamError: any) => {
            console.error(`❌ Full stream error for ${videoKey} (${isLargeVideo ? 'large video' : 'regular'}):`, {
              error: streamError.message,
              code: streamError.code,
              contentLength: response.ContentLength
            });
            if (!res.headersSent) {
              res.status(500).json({ error: 'Stream error', details: streamError.message });
            }
          });
          
          // Handle connection close for full downloads
          req.on('close', () => {
            if (isLargeVideo) {
              console.log(`🔌 Client disconnected from full large video: ${videoKey}`);
            }
            if (stream.destroy) stream.destroy();
          });
          
          stream.pipe(res);
        } else {
          console.error('No body in R2 response');
          res.status(404).json({ error: 'Video not found' });
        }
      }
      
    } catch (error) {
      const errorDetails = {
        videoKey: videoKey || 'unknown',
        isVideo,
        isLargeVideo,
        errorName: (error as Error).name,
        errorMessage: (error as Error).message,
        errorCode: (error as any).Code,
        httpStatusCode: (error as any).$metadata?.httpStatusCode,
        timestamp: new Date().toISOString()
      };
      
      console.error(`❌ Video proxy error:`, errorDetails);
      
      if (!res.headersSent) {
        // Enhanced error messages for large video debugging
        if ((error as any).$metadata?.httpStatusCode === 404) {
          res.status(404).json({ 
            error: 'Video not found',
            details: 'The requested video file does not exist.' 
          });
        } else if ((error as Error).name === 'TimeoutError' || (error as any).code === 'ETIMEDOUT') {
          res.status(504).json({ 
            error: 'Video loading timeout',
            details: isLargeVideo ? 'Large video file timed out - try refreshing or use a faster connection' : 'Video loading timed out' 
          });
        } else if ((error as Error).message?.includes('memory') || (error as Error).message?.includes('ENOMEM')) {
          res.status(503).json({ 
            error: 'Server memory limit',
            details: 'Video file too large for current server resources - please try again later' 
          });
        } else {
          res.status(500).json({ 
            error: 'Failed to proxy video',
            details: (error as Error).message,
            isLargeFile: isLargeVideo
          });
        }
      }
    }
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
