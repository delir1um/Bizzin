import { execSync } from 'child_process';

// Test key scenarios that were failing
const keyTests = [
  {
    name: 'Product Launch Success',
    text: 'Product launch was incredible success. 50k downloads in first week, 4.8 stars on App Store, tech blogs calling it revolutionary. Engineering team outdid themselves.',
    expected: { category: 'achievement', mood: 'excited', energy: 'high' }
  },
  {
    name: 'Database Technical Challenge', 
    text: 'Database crashed during demo to investors. Lost 2 hours of presentation time. Technical team scrambling. This could impact Series A timing.',
    expected: { category: 'challenge', mood: 'stressed', energy: 'high' }
  },
  {
    name: 'Growth Scaling Operations',
    text: 'Customer base growing 15% monthly. Scaling infrastructure to handle load. Hired 3 engineers this quarter. Revenue per customer increasing.',
    expected: { category: 'growth', mood: 'excited', energy: 'high' }
  }
];

console.log('🎯 PHASE 1 KEY SCENARIOS TEST');
console.log('=' .repeat(60));

let passed = 0;
let total = keyTests.length;

for (const test of keyTests) {
  console.log(`\\n📝 Testing: ${test.name}`);
  console.log(`Text: "${test.text.substring(0, 60)}..."`);
  
  try {
    const curlCmd = `curl -s -X POST http://localhost:5000/api/huggingface/analyze -H "Content-Type: application/json" -d '${JSON.stringify({text: test.text}).replace(/'/g, "\\'")}'`;
    const response = execSync(curlCmd, { encoding: 'utf8' });
    const result = JSON.parse(response);
    
    const categoryMatch = result.business_category === test.expected.category;
    const moodMatch = result.primary_mood === test.expected.mood;
    const energyMatch = result.energy === test.expected.energy;
    
    console.log(`Expected: category='${test.expected.category}', mood='${test.expected.mood}', energy='${test.expected.energy}'`);
    console.log(`Actual:   category='${result.business_category}', mood='${result.primary_mood}', energy='${result.energy}'`);
    console.log(`Results: Category ${categoryMatch ? '✅' : '❌'} | Mood ${moodMatch ? '✅' : '❌'} | Energy ${energyMatch ? '✅' : '❌'}`);
    
    if (categoryMatch && moodMatch && energyMatch) {
      console.log(`🎯 Overall: ✅ PASS`);
      passed++;
    } else {
      console.log(`🎯 Overall: ❌ FAIL`);
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
  
  // Delay between requests
  await new Promise(resolve => setTimeout(resolve, 1000));
}

console.log('\\n' + '='.repeat(60));
console.log(`🎯 PHASE 1 RESULTS: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
if (passed/total >= 0.85) {
  console.log('✅ PHASE 1 COMPLETE: Core AI functionality proven');
} else {
  console.log('⚠️  PHASE 1 INCOMPLETE: More fixes needed');
}