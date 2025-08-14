// Quick AI test for product launch scenario
import fetch from 'node:fetch';

async function testProductLaunch() {
  const testText = 'Product launch was incredible success. 50k downloads in first week, 4.8 stars on App Store, tech blogs calling it revolutionary. Engineering team outdid themselves.';
  
  try {
    const response = await fetch('http://localhost:5000/api/huggingface/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: testText })
    });
    
    const result = await response.json();
    
    console.log('🔍 Testing Product Launch AI Analysis:');
    console.log('Text:', testText.substring(0, 50) + '...');
    console.log('');
    console.log('Results:');
    console.log('Category:', result.business_category, '| Expected: achievement');
    console.log('Mood:', result.primary_mood, '| Expected: excited');
    console.log('Energy:', result.energy, '| Expected: high');
    console.log('Heading:', result.ai_heading);
    console.log('');
    console.log('Success:', result.business_category === 'achievement' ? '✅ FIXED!' : '❌ Still broken');
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testProductLaunch();