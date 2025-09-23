// Manual test of Hugging Face integration
console.log('=== MANUAL HUGGING FACE TEST ===');

// Direct test of environment variable
console.log('Environment test:', {
  hasKey: !!import.meta.env.VITE_HUGGING_FACE_API_KEY,
  keyStart: import.meta.env.VITE_HUGGING_FACE_API_KEY?.substring(0, 6),
  allViteVars: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
});

// Test content that should trigger Achievement category
const testContent = "We just closed a R2.5 million contract with our biggest client! This is huge for the team and validates everything we've been building.";

console.log('Testing with content:', testContent);