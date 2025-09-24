import OpenAI from "openai";

/*
Kimi K2 API Configuration
- Using OpenAI-compatible interface with Kimi K2's base URL
- Model: moonshot/kimi-k2-preview (1T parameters, 32B active)
- Cost: ~$0.60 input / $2.50 output per 1M tokens (10x cheaper than Claude)
*/

// Multiple provider options for Kimi K2 (in order of preference)
const KIMI_PROVIDERS = [
  {
    name: "AI/ML API",
    baseURL: "https://api.aimlapi.com/v1",
    model: "moonshot/kimi-k2-preview",
    apiKey: process.env.KIMI_API_KEY || process.env.OPENAI_API_KEY
  },
  {
    name: "Together AI", 
    baseURL: "https://api.together.xyz/v1",
    model: "moonshotai/Kimi-K2-Instruct", 
    apiKey: process.env.KIMI_API_KEY || process.env.OPENAI_API_KEY
  },
  {
    name: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    model: "moonshotai/kimi-k2",
    apiKey: process.env.KIMI_API_KEY || process.env.OPENAI_API_KEY
  }
];

// Initialize Kimi client with fallback providers
function createKimiClient() {
  const provider = KIMI_PROVIDERS[0]; // Start with AI/ML API
  
  return new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
  });
}

export const kimiClient = createKimiClient();
export const KIMI_MODEL = KIMI_PROVIDERS[0].model;

// Configuration for business journal analysis
export const KIMI_CONFIG = {
  model: KIMI_MODEL,
  temperature: 0.2, // Low for consistent business analysis
  max_tokens: 800,   // Sufficient for comprehensive insights
  timeout: 30000,    // 30 second timeout
};

// Test connectivity
export async function testKimiConnection(): Promise<boolean> {
  try {
    const response = await kimiClient.chat.completions.create({
      model: KIMI_MODEL,
      messages: [
        { role: "user", content: "Test connection. Reply with just 'OK'." }
      ],
      max_tokens: 10,
    });
    
    return response.choices[0]?.message?.content?.includes('OK') || false;
  } catch (error) {
    console.error('Kimi K2 connection test failed:', error);
    return false;
  }
}