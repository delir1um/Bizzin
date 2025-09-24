import OpenAI from "openai";

/*
Unified AI Provider Configuration
- Primary: Qwen3 (FREE via OpenRouter)
- Backup: Kimi K2 (cheap, ~$0.60 input / $2.50 output per 1M tokens)
- Both use OpenAI-compatible interfaces
*/

// AI Provider options (in order of preference: free first, then cheapest)
const AI_PROVIDERS = [
  // Qwen3 - FREE tier via OpenRouter
  {
    name: "Qwen3 Free",
    baseURL: "https://openrouter.ai/api/v1",
    model: "qwen/qwen3-32b:free",
    apiKey: process.env.OPENAI_API_KEY,
    cost: "FREE",
    strengths: ["reasoning", "multilingual", "business analysis"]
  },
  // Kimi K2 - Cheap backup option
  {
    name: "Kimi K2",
    baseURL: "https://api.aimlapi.com/v1",
    model: "moonshot/kimi-k2-preview",
    apiKey: process.env.OPENAI_API_KEY,
    cost: "$0.15-2.50/1M tokens",
    strengths: ["coding", "agentic", "structured output"]
  },
  // Additional Qwen3 paid options
  {
    name: "Qwen3 Paid",
    baseURL: "https://openrouter.ai/api/v1", 
    model: "qwen/qwen3-32b",
    apiKey: process.env.OPENAI_API_KEY,
    cost: "$0.735-2.94/1M tokens",
    strengths: ["reasoning", "multilingual", "256K context"]
  },
  // Additional Kimi K2 providers
  {
    name: "Kimi K2 Alt",
    baseURL: "https://api.together.xyz/v1",
    model: "moonshotai/Kimi-K2-Instruct", 
    apiKey: process.env.OPENAI_API_KEY,
    cost: "$0.15-2.50/1M tokens",
    strengths: ["coding", "agentic", "tool calling"]
  }
];

// Initialize AI client with primary provider (Qwen3 free)
function createAIClient(providerIndex: number = 0) {
  const provider = AI_PROVIDERS[providerIndex];
  
  return {
    client: new OpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseURL,
    }),
    model: provider.model,
    provider: provider
  };
}

// Export primary client (Qwen3 free)
export const primaryAI = createAIClient(0);
export const backupAI = createAIClient(1); // Kimi K2

// Configuration for business journal analysis
export const AI_CONFIG = {
  temperature: 0.2, // Low for consistent business analysis
  max_tokens: 800,   // Sufficient for comprehensive insights  
  timeout: 30000,    // 30 second timeout
};

// Test connectivity for any provider
export async function testAIConnection(providerIndex: number = 0): Promise<boolean> {
  try {
    const { client, model, provider } = createAIClient(providerIndex);
    
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "user", content: "Test connection. Reply with just 'OK'." }
      ],
      max_tokens: 10,
    });
    
    const success = response.choices[0]?.message?.content?.includes('OK') || false;
    console.log(`${provider.name} connection test: ${success ? '✅' : '❌'}`);
    return success;
  } catch (error) {
    console.error(`${AI_PROVIDERS[providerIndex].name} connection test failed:`, error);
    return false;
  }
}

// Test all providers and return the best working one
export async function findBestWorkingProvider(): Promise<{ client: OpenAI; model: string; provider: any; index: number } | null> {
  for (let i = 0; i < AI_PROVIDERS.length; i++) {
    const isWorking = await testAIConnection(i);
    if (isWorking) {
      console.log(`✅ Using ${AI_PROVIDERS[i].name} as primary AI provider`);
      const { client, model, provider } = createAIClient(i);
      return { client, model, provider, index: i };
    }
  }
  
  console.error('❌ No AI providers are working');
  return null;
}

// Export provider info for transparency
export const AI_PROVIDERS_INFO = AI_PROVIDERS.map(p => ({
  name: p.name,
  cost: p.cost,
  strengths: p.strengths
}));