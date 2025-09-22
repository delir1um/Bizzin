import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { chat } from './anthropic.js';
import { AI_CONFIG } from './config.js';

const router = Router();

// Validation schema for chat requests
const chatRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  stream: z.boolean().default(true),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  max_tokens: z.number().min(1).max(4096).optional(),
  cacheSystem: z.boolean().default(true),
  enableTools: z.boolean().default(false),
  system: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).default([])
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    ok: true,
    model: AI_CONFIG.MODEL,
    timestamp: new Date().toISOString()
  });
});

// Main chat endpoint
router.post('/chat', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = chatRequestSchema.parse(req.body);
    
    const {
      prompt,
      stream,
      model,
      temperature,
      max_tokens,
      cacheSystem,
      enableTools,
      system,
      history
    } = validatedData;

    // Build messages array from history + current prompt
    const messages = [
      ...history,
      { role: 'user' as const, content: prompt }
    ];

    // Default system message if none provided
    const systemMessage = system || 'You are a helpful AI assistant. Provide clear, concise, and accurate responses.';

    const chatOptions = {
      system: systemMessage,
      messages,
      model,
      temperature,
      max_tokens,
      stream,
      cacheSystem,
      tools: enableTools ? [] : [] // Tools functionality disabled for now
    };

    if (stream) {
      // Set up Server-Sent Events headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      const chatStream = await chat(chatOptions);
      
      if ('on' in chatStream) {
        // Handle streaming response with EventEmitter
        const emitter = chatStream as any;
        emitter.on('data', (token: string) => {
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        });

        emitter.on('done', (result: { text: string }) => {
          res.write(`data: ${JSON.stringify({ done: true, fullText: result.text })}\n\n`);
          res.end();
          
          // Log usage after completion
          console.log(`✅ Chat completed - Model: ${model || AI_CONFIG.MODEL}, Prompt length: ${prompt.length} chars`);
        });

        emitter.on('error', (error: Error) => {
          res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          res.end();
          console.error('❌ Chat stream error:', error.message);
        });

        // Handle client disconnect
        req.on('close', () => {
          console.log('Client disconnected from chat stream');
        });
      }
    } else {
      // Non-streaming response
      const result = await chat(chatOptions);
      
      if (typeof result === 'object' && 'text' in result) {
        const response = {
          text: result.text,
          usage: result.usage
        };

        // Log usage
        if (result.usage) {
          console.log(`✅ Chat completed - Model: ${model || AI_CONFIG.MODEL}, Input: ${result.usage.input_tokens} tokens, Output: ${result.usage.output_tokens} tokens`);
        }

        res.json(response);
      } else {
        throw new Error('Unexpected response format from chat function');
      }
    }
  } catch (error) {
    console.error('❌ Chat endpoint error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      error: errorMessage
    });
  }
});

export default router;