// Comprehensive test scenarios for improved AI categorization
// Testing growth/planning/learning detection that had zero accuracy

const TEST_SCENARIOS = [
  // GROWTH scenarios (previously misclassified as achievement/reflection)
  {
    text: "Revenue increased 40% this quarter, time to scale our operations and expand internationally",
    expected_category: "growth",
    expected_accuracy: ">= 70%",
    reason: "Clear revenue growth + scaling language should trigger growth category"
  },
  {
    text: "Signed three major enterprise clients this month, momentum is building for aggressive expansion",
    expected_category: "growth", 
    expected_accuracy: ">= 70%",
    reason: "Client acquisition + expansion momentum = growth, not achievement"
  },
  {
    text: "Exciting opportunity to expand into European markets next year, researching localization",
    expected_category: "growth",
    expected_accuracy: ">= 70%", 
    reason: "Market expansion excitement should be categorized as growth"
  },
  {
    text: "Hiring spree continues - adding 5 developers and 2 sales reps to support rapid scaling",
    expected_category: "growth",
    expected_accuracy: ">= 70%",
    reason: "Team growth + scaling context = growth category"
  },

  // PLANNING scenarios (previously misclassified as reflection)
  {
    text: "Working on our Series A strategy, targeting $8M raise with focus on enterprise sales roadmap",
    expected_category: "planning",
    expected_accuracy: ">= 70%",
    reason: "Strategic fundraising planning should be planning, not reflection"
  },
  {
    text: "Next quarter roadmap includes new product features, marketing budget allocation, and team restructure",
    expected_category: "planning", 
    expected_accuracy: ">= 70%",
    reason: "Future roadmap + resource allocation = planning"
  },
  {
    text: "Preparing for board presentation - need to finalize financial projections and strategic priorities",
    expected_category: "planning",
    expected_accuracy: ">= 70%",
    reason: "Preparation + strategic elements = planning"
  },
  {
    text: "Considering acquisition of smaller competitor to accelerate market penetration",
    expected_category: "planning",
    expected_accuracy: ">= 70%", 
    reason: "Strategic consideration for business growth = planning"
  },

  // LEARNING scenarios (previously lumped with reflection)
  {
    text: "Key insight from customer interviews: users want mobile-first experience over desktop features",
    expected_category: "learning",
    expected_accuracy: ">= 70%",
    reason: "Customer insights + learning language = learning category"
  },
  {
    text: "Attending industry conference next week to learn about AI trends and network with peers",
    expected_category: "learning",
    expected_accuracy: ">= 70%",
    reason: "Conference + learning objective = learning, not planning"
  },
  {
    text: "Discovered critical gap in our onboarding process through user feedback analysis",
    expected_category: "learning", 
    expected_accuracy: ">= 70%",
    reason: "Discovery + feedback analysis = learning insight"
  },
  {
    text: "Realized our pricing model doesn't match customer value perception after sales calls",
    expected_category: "learning",
    expected_accuracy: ">= 70%",
    reason: "Realization + business insight = learning"
  },

  // ACHIEVEMENT scenarios (should still work correctly)
  {
    text: "Our patent application was approved today after 18 months of waiting - breakthrough moment!",
    expected_category: "achievement",
    expected_accuracy: ">= 70%",
    reason: "Patent approval should be achievement (was failing before)"
  },
  {
    text: "Closed our biggest deal ever - $500k annual contract with Fortune 500 company",
    expected_category: "achievement",
    expected_accuracy: ">= 70%",
    reason: "Major contract win = clear achievement"
  },

  // CHALLENGE scenarios (should continue working)
  {
    text: "Major production bug affected 30% of users, working on crisis management and client communications",
    expected_category: "challenge",
    expected_accuracy: ">= 70%", 
    reason: "Production crisis = clear challenge"
  },
  {
    text: "Cash flow tight this month, need immediate solutions for payroll and vendor payments",
    expected_category: "challenge",
    expected_accuracy: ">= 70%",
    reason: "Financial stress = challenge"
  }
];

// Test execution function
async function testAICategorizationSystem() {
  console.log('🧪 Testing Enhanced AI Categorization System');
  console.log('=' .repeat(60));
  
  const results = {
    growth: { correct: 0, total: 0 },
    planning: { correct: 0, total: 0 },
    learning: { correct: 0, total: 0 },
    achievement: { correct: 0, total: 0 },
    challenge: { correct: 0, total: 0 }
  };
  
  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n📝 Testing: "${scenario.text.substring(0, 60)}..."`);
    console.log(`Expected: ${scenario.expected_category}`);
    
    try {
      // Call the server API
      const response = await fetch('/api/huggingface/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scenario.text })
      });
      
      const result = await response.json();
      const actualCategory = result.business_category;
      const confidence = result.confidence;
      
      console.log(`Actual: ${actualCategory} (${confidence}% confidence)`);
      
      // Track results
      results[scenario.expected_category].total++;
      if (actualCategory === scenario.expected_category && confidence >= 70) {
        results[scenario.expected_category].correct++;
        console.log('✅ PASS - Correct categorization with sufficient confidence');
      } else if (actualCategory === scenario.expected_category) {
        console.log(`⚠️  PARTIAL - Correct category but low confidence (${confidence}%)`);
      } else {
        console.log(`❌ FAIL - Expected ${scenario.expected_category}, got ${actualCategory}`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
    }
  }
  
  // Calculate accuracy per category
  console.log('\n📊 RESULTS SUMMARY');
  console.log('=' .repeat(40));
  
  for (const [category, data] of Object.entries(results)) {
    if (data.total > 0) {
      const accuracy = ((data.correct / data.total) * 100).toFixed(1);
      const status = accuracy >= 70 ? '✅' : '❌';
      console.log(`${status} ${category.toUpperCase()}: ${data.correct}/${data.total} (${accuracy}%)`);
    }
  }
}

// Export for manual testing
if (typeof module !== 'undefined') {
  module.exports = { TEST_SCENARIOS, testAICategorizationSystem };
}