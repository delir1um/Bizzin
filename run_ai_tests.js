// Simple test runner for AI accuracy verification
const fetch = require('node-fetch'); // If available, otherwise use built-in fetch

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
  }
];

// Test individual scenario
async function testScenario(scenario) {
  console.log(`\n🧪 Testing: ${scenario.id}`);
  console.log(`📝 Text: "${scenario.text.substring(0, 80)}..."`);
  
  try {
    const response = await fetch('http://localhost:5000/api/huggingface/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: scenario.text }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
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
    stressed: ['stressed', 'overwhelmed', 'anxious', 'pressured']
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
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate report
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`Overall Accuracy: ${(passed/total*100).toFixed(1)}% (${passed}/${total} tests passed)`);
  
  // Category breakdown
  const categoryStats = {};
  results.forEach(r => {
    if (r.expected) {
      const cat = r.expected.category;
      if (!categoryStats[cat]) categoryStats[cat] = {passed: 0, total: 0};
      categoryStats[cat].total++;
      if (r.passed) categoryStats[cat].passed++;
    }
  });
  
  console.log('\n📈 Category Performance:');
  Object.entries(categoryStats).forEach(([cat, stats]) => {
    const accuracy = (stats.passed/stats.total*100).toFixed(1);
    console.log(`  ${cat}: ${accuracy}% (${stats.passed}/${stats.total})`);
  });
  
  // Failed tests
  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(f => {
      if (f.expected && f.actual) {
        console.log(`  ${f.scenario_id}: Expected ${f.expected.category}/${f.expected.mood}, got ${f.actual.category}/${f.actual.mood}`);
      } else {
        console.log(`  ${f.scenario_id}: ${f.error || 'Unknown error'}`);
      }
    });
  }
  
  return results;
}

// Run the tests
runAllTests().catch(console.error);