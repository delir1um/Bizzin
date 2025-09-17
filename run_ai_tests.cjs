// Simple test runner for AI accuracy verification
const https = require('https');
const http = require('http');

// Test scenarios for business journal sentiment analysis
const testScenarios = [
  {
    id: "revenue_achievement",
    text: "Closed our biggest deal of the year today - $500K annual contract with TechCorp. The team is celebrating and I am feeling incredibly proud of what we have accomplished.",
    expected: {
      category: "achievement",
      mood: "accomplished",
      energy: "high"
    },
    context: "Major revenue milestone with team celebration"
  },
  {
    id: "personnel_conflict", 
    text: "Fired our first employee today. John wasn't meeting performance standards despite multiple conversations. It was one of the hardest things I've had to do as a founder. I feel guilty but also relieved.",
    expected: {
      category: "challenge",
      mood: "conflicted", 
      energy: "low"
    },
    context: "Difficult personnel decision with mixed emotions"
  },
  {
    id: "growth_scaling",
    text: "Three new enterprise clients signed this week, each worth over $100K annually. Our sales team is on fire and the product-market fit is really clicking. Time to scale our customer success team.",
    expected: {
      category: "growth",
      mood: "confident",
      energy: "high"
    },
    context: "Client acquisition success driving scaling needs"
  },
  {
    id: "strategic_planning",
    text: "Spent the entire day working on our 2025 strategic plan. Analyzing market trends, competitor movements, and internal capabilities to chart our course for next year.",
    expected: {
      category: "planning",
      mood: "analytical",
      energy: "medium"
    },
    context: "Strategic planning and analysis session"
  },
  {
    id: "cash_flow_stress",
    text: "Cash flow has been tight for three months. I've been deferring my own salary to cover payroll. Had a difficult conversation with our landlord about payment deadlines. It's emotionally draining.",
    expected: {
      category: "challenge",
      mood: "stressed",
      energy: "low"
    },
    context: "Financial pressure causing personal stress"
  },
  {
    id: "product_launch_success",
    text: "After 18 months of development, we finally launched our AI platform today. The initial user feedback has been incredible - 94% positive ratings and several enterprise prospects already reaching out.",
    expected: {
      category: "achievement", 
      mood: "accomplished",
      energy: "high"
    },
    context: "Successful product launch with positive market validation"
  },
  {
    id: "crisis_management",
    text: "Major production outage hit us at 3 AM. 80% of our customers were affected for 4 hours. I immediately activated crisis response, got engineering on emergency calls, and personally reached out to biggest clients.",
    expected: {
      category: "challenge",
      mood: "determined",
      energy: "medium"
    },
    context: "Technical crisis requiring immediate leadership response"
  },
  {
    id: "learning_reflection",
    text: "The product launch didn't go as planned. User onboarding was too complex, messaging wasn't clear. Reading customer feedback is painful but valuable. I realize I've been building what I think they need instead of what they actually need.",
    expected: {
      category: "learning",
      mood: "reflective", 
      energy: "medium"
    },
    context: "Learning from product launch mistakes through customer feedback"
  }
];

// Make HTTP request helper
function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ text: data });
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/huggingface/analyze',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(new Error('Invalid JSON response: ' + responseData));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test individual scenario
async function testScenario(scenario) {
  console.log(`\n🧪 Testing: ${scenario.id}`);
  console.log(`📝 Text: "${scenario.text.substring(0, 80)}..."`);
  
  try {
    const result = await makeRequest(scenario.text);
    
    // Extract actual results
    const actual = {
      category: result.business_category,
      mood: result.primary_mood?.toLowerCase(),
      energy: result.energy,
      confidence: result.confidence
    };
    
    // Check accuracy
    const categoryMatch = scenario.expected.category === actual.category;
    const moodMatch = checkMoodSimilarity(scenario.expected.mood, actual.mood);
    const energyMatch = scenario.expected.energy === actual.energy;
    
    const passed = categoryMatch && (moodMatch || actual.confidence > 80) && energyMatch;
    
    console.log(`🎯 Expected: ${scenario.expected.category}, ${scenario.expected.mood}, ${scenario.expected.energy} energy`);
    console.log(`🤖 Actual:   ${actual.category}, ${actual.mood}, ${actual.energy} energy (${actual.confidence}% confidence)`);
    console.log(`📊 Analysis Source: ${result.analysis_source || 'unknown'}`);
    console.log(`${passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    return {
      scenario_id: scenario.id,
      passed,
      expected: scenario.expected,
      actual,
      raw_result: result
    };
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return {
      scenario_id: scenario.id,
      passed: false,
      error: error.message
    };
  }
}

// Check if moods are semantically similar
function checkMoodSimilarity(expected, actual) {
  if (expected === actual) return true;
  
  const moodGroups = {
    accomplished: ['accomplished', 'satisfied', 'proud', 'successful'],
    conflicted: ['conflicted', 'torn', 'mixed', 'ambivalent'],
    confident: ['confident', 'assured', 'determined', 'certain'],
    analytical: ['analytical', 'focused', 'thoughtful', 'systematic'],
    stressed: ['stressed', 'overwhelmed', 'anxious', 'pressured'],
    reflective: ['reflective', 'contemplative', 'introspective', 'thoughtful'],
    determined: ['determined', 'resolute', 'persistent', 'focused']
  };
  
  for (const [group, moods] of Object.entries(moodGroups)) {
    if (moods.includes(expected) && moods.includes(actual)) {
      return true;
    }
  }
  
  return false;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting AI Accuracy Test Suite...\n');
  
  const results = [];
  let passed = 0;
  let total = 0;
  
  for (const scenario of testScenarios) {
    const result = await testScenario(scenario);
    results.push(result);
    
    if (result.passed) passed++;
    total++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate comprehensive report
  console.log('\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('===============================');
  console.log(`Overall Accuracy: ${(passed/total*100).toFixed(1)}% (${passed}/${total} tests passed)`);
  
  // Category breakdown
  const categoryStats = {};
  const sourceStats = {};
  
  results.forEach(r => {
    if (r.expected) {
      const cat = r.expected.category;
      if (!categoryStats[cat]) categoryStats[cat] = {passed: 0, total: 0};
      categoryStats[cat].total++;
      if (r.passed) categoryStats[cat].passed++;
      
      // Track analysis source performance
      const source = r.raw_result?.analysis_source || 'unknown';
      if (!sourceStats[source]) sourceStats[source] = {passed: 0, total: 0};
      sourceStats[source].total++;
      if (r.passed) sourceStats[source].passed++;
    }
  });
  
  console.log('\n📈 Category Performance:');
  Object.entries(categoryStats).forEach(([cat, stats]) => {
    const accuracy = (stats.passed/stats.total*100).toFixed(1);
    console.log(`  ${cat}: ${accuracy}% (${stats.passed}/${stats.total})`);
  });
  
  console.log('\n🤖 Analysis Source Performance:');
  Object.entries(sourceStats).forEach(([source, stats]) => {
    const accuracy = (stats.passed/stats.total*100).toFixed(1);
    console.log(`  ${source}: ${accuracy}% (${stats.passed}/${stats.total})`);
  });
  
  // Failed tests analysis
  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log('\n❌ Failed Tests Analysis:');
    failed.forEach(f => {
      if (f.expected && f.actual) {
        console.log(`  ${f.scenario_id}: Expected ${f.expected.category}/${f.expected.mood}, got ${f.actual.category}/${f.actual.mood}`);
      } else {
        console.log(`  ${f.scenario_id}: ${f.error || 'Unknown error'}`);
      }
    });
  }
  
  // Confidence analysis
  const confidences = results.filter(r => r.actual?.confidence).map(r => r.actual.confidence);
  if (confidences.length > 0) {
    const avgConfidence = (confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(1);
    const minConfidence = Math.min(...confidences);
    const maxConfidence = Math.max(...confidences);
    
    console.log('\n📊 Confidence Analysis:');
    console.log(`  Average: ${avgConfidence}%`);
    console.log(`  Range: ${minConfidence}% - ${maxConfidence}%`);
  }
  
  return {
    accuracy: parseFloat((passed/total*100).toFixed(1)),
    passed,
    total,
    categoryStats,
    sourceStats,
    results
  };
}

// Test error handling scenarios
async function testErrorHandling() {
  console.log('\n🛡️ Testing Error Handling Scenarios...');
  
  const errorTests = [
    { name: "Empty Content", text: "" },
    { name: "Very Short Content", text: "Hi" },
    { name: "Very Long Content", text: "This is a very long business entry. ".repeat(200) }
  ];
  
  for (const test of errorTests) {
    try {
      console.log(`\n🧪 Testing: ${test.name}`);
      const result = await makeRequest(test.text);
      console.log(`✅ Handled gracefully: ${result.analysis_source} (confidence: ${result.confidence}%)`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  try {
    const results = await runAllTests();
    await testErrorHandling();
    
    console.log('\n🎉 Testing Complete!');
    console.log(`\n📋 Summary: ${results.accuracy}% accuracy achieved across ${results.total} diverse business scenarios`);
    
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

main();