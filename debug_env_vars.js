// Debug script to test environment variable access in browser
console.log('Environment Variable Debug:');
console.log('import.meta.env.VITE_HUGGING_FACE_API_KEY:', import.meta.env.VITE_HUGGING_FACE_API_KEY);
console.log('All VITE_ vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));

// Test the actual Hugging Face function
if (import.meta.env.VITE_HUGGING_FACE_API_KEY) {
  console.log('✅ API Key is accessible to frontend');
} else {
  console.log('❌ API Key is NOT accessible to frontend');
}