#!/usr/bin/env node

const AI_API_BASE = process.env.REPLIT_URL 
  ? `${process.env.REPLIT_URL}/api/ai` 
  : 'http://localhost:5000/api/ai';

console.log('🧪 Running AI Smoke Tests...');
console.log(`Testing against: ${AI_API_BASE}`);
console.log('---');

let testsPassed = 0;
let totalTests = 0;

async function runTest(name, testFn) {
  totalTests++;
  console.log(`🔄 ${name}...`);
  
  try {
    await testFn();
    console.log(`✅ ${name} - PASSED`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name} - FAILED: ${error.message}`);
  }
}

async function testHealthEndpoint() {
  const response = await fetch(`${AI_API_BASE}/health`);
  
  if (!response.ok) {
    throw new Error(`Health check failed: HTTP ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error('Health check returned ok: false');
  }
  
  if (!data.model) {
    throw new Error('Health check missing model information');
  }
  
  console.log(`   Model: ${data.model}`);
}

async function testBasicNonStreamChat() {
  const response = await fetch(`${AI_API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: 'Give 3 cost-saving tips for API usage',
      stream: false
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.text || data.text.length < 10) {
    throw new Error('Response text too short or empty');
  }
  
  console.log(`   Response length: ${data.text.length} characters`);
  
  if (data.usage) {
    console.log(`   Tokens: ${data.usage.input_tokens} in + ${data.usage.output_tokens} out`);
  }
}

async function testStreamingChat() {
  console.log('   Testing streaming response...');
  
  const response = await fetch(`${AI_API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: 'Summarise Clean Architecture in 4 bullets',
      stream: true
    })
  });
  
  if (!response.ok) {
    throw new Error(`Streaming failed: HTTP ${response.status}`);
  }
  
  if (!response.headers.get('content-type')?.includes('text/event-stream')) {
    throw new Error('Response is not server-sent events');
  }
  
  // Read a few chunks to verify streaming works
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body reader available');
  }
  
  const decoder = new TextDecoder();
  let chunksReceived = 0;
  let hasContent = false;
  
  try {
    for (let i = 0; i < 5; i++) { // Read first 5 chunks
      const { done, value } = await reader.read();
      if (done) break;
      
      chunksReceived++;
      const chunk = decoder.decode(value, { stream: true });
      
      if (chunk.includes('data:') && chunk.includes('token')) {
        hasContent = true;
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  if (chunksReceived === 0) {
    throw new Error('No streaming chunks received');
  }
  
  if (!hasContent) {
    throw new Error('No content tokens found in stream');
  }
  
  console.log(`   Received ${chunksReceived} streaming chunks`);
}

async function testInvalidRequest() {
  const response = await fetch(`${AI_API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Missing required 'prompt' field
      stream: false
    })
  });
  
  if (response.ok) {
    throw new Error('Invalid request should have failed');
  }
  
  if (response.status !== 400) {
    throw new Error(`Expected 400 status, got ${response.status}`);
  }
  
  const errorData = await response.json();
  if (!errorData.error) {
    throw new Error('Error response missing error message');
  }
  
  console.log(`   Correctly rejected invalid request`);
}

async function main() {
  try {
    await runTest('Health Check', testHealthEndpoint);
    await runTest('Basic Non-Stream Chat', testBasicNonStreamChat);
    await runTest('Streaming Chat', testStreamingChat);
    await runTest('Invalid Request Handling', testInvalidRequest);
    
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${testsPassed}/${totalTests}`);
    
    if (testsPassed === totalTests) {
      console.log('🎉 All tests passed! AI API is working correctly.');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed. Please check the logs above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

main();