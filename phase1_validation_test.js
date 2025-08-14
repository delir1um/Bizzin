import { execSync } from 'child_process';

// Comprehensive Phase 1 validation with core business scenarios
const coreTests = [
  // Achievement scenarios
  {
    name: 'Product Launch Success',
    text: 'Product launch was incredible success. 50k downloads in first week, 4.8 stars on App Store, tech blogs calling it revolutionary.',
    expected: 'achievement'
  },
  {
    name: 'Major Deal Closed',
    text: 'Closed enterprise deal with Fortune 500 company. $2M ARR contract signed. Team celebration tonight.',
    expected: 'achievement'
  },
  
  // Challenge scenarios  
  {
    name: 'Technical Crisis',
    text: 'Database crashed during investor demo. Lost 2 hours of presentation time. Technical team scrambling.',
    expected: 'challenge'
  },
  {
    name: 'Team Resignation',
    text: 'Lead engineer handed in resignation. Major setback for product timeline.',
    expected: 'challenge'
  },
  
  // Growth scenarios
  {
    name: 'Scaling Operations',
    text: 'Customer base growing 15% monthly. Scaling infrastructure to handle load. Hired 3 engineers.',
    expected: 'growth'
  },
  {
    name: 'Market Expansion', 
    text: 'Expanding into European markets. Accelerating growth with new customer acquisition strategy.',
    expected: 'growth'
  },
  
  // Planning scenarios
  {
    name: 'Strategic Planning',
    text: 'Developing roadmap for Q3. Considering freemium vs subscription model for pricing strategy.',
    expected: 'planning'
  },
  
  // Learning scenarios
  {
    name: 'Customer Feedback',
    text: 'Customer feedback reveals users prefer simplified onboarding. Key insight for product development.',
    expected: 'learning'
  },
  
  // Reflection scenarios
  {
    name: 'Business Analysis',
    text: 'Analyzing what worked and what did not work in last quarter. Need to understand why conversion dropped.',
    expected: 'reflection'
  }
];

console.log('🎯 PHASE 1 VALIDATION TEST - Core AI Categorization');
console.log('=' .repeat(70));

let passed = 0;
let total = coreTests.length;

for (const test of coreTests) {
  console.log(`\\n📝 Testing: ${test.name}`);
  console.log(`Text: "${test.text.substring(0, 80)}..."`);
  
  try {
    const curlCmd = `curl -s -X POST http://localhost:5000/api/huggingface/analyze -H "Content-Type: application/json" -d '${JSON.stringify({text: test.text}).replace(/'/g, "\\'")}'`;
    const response = execSync(curlCmd, { encoding: 'utf8' });
    const result = JSON.parse(response);
    
    const categoryMatch = result.business_category === test.expected;
    
    console.log(`Expected: ${test.expected}`);
    console.log(`Actual:   ${result.business_category}`);
    console.log(`Result: ${categoryMatch ? '✅ PASS' : '❌ FAIL'}`);
    
    if (categoryMatch) {
      passed++;
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
  
  // Delay between requests
  await new Promise(resolve => setTimeout(resolve, 800));
}

console.log('\\n' + '='.repeat(70));
console.log(`🎯 PHASE 1 RESULTS: ${passed}/${total} (${Math.round(passed/total*100)}%)`);

if (passed/total >= 0.85) {
  console.log('\\n✅ PHASE 1 COMPLETE: Core AI categorization proven');
  console.log('📊 85%+ accuracy achieved on real business scenarios');
  console.log('🚀 Ready for Phase 2: Scale and enhance features');
} else {
  console.log('\\n⚠️  PHASE 1 INCOMPLETE: More fixes needed');
  console.log(`📊 Target: 85%+ accuracy | Current: ${Math.round(passed/total*100)}%`);
}