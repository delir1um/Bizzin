// Quick test using curl
const { exec } = require('child_process');

const testText = 'Product launch was incredible success. 50k downloads in first week, 4.8 stars on App Store, tech blogs calling it revolutionary. Engineering team outdid themselves.';

const curlCommand = `curl -s -X POST http://localhost:5000/api/huggingface/analyze \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ text: testText })}'`;

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  
  try {
    const result = JSON.parse(stdout);
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
    
  } catch (parseError) {
    console.log('Parse error:', parseError.message);
    console.log('Raw output:', stdout);
  }
});