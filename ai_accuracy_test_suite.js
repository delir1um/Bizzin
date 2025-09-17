// Comprehensive AI accuracy testing suite for business journal sentiment analysis
// Tests the improved AI implementation against diverse business scenarios

class AIAccuracyTestSuite {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
    this.totalTests = 0;
  }

  // Comprehensive test scenarios covering diverse business contexts
  getTestScenarios() {
    return [
      // 1. Revenue & Growth Success Scenarios
      {
        id: "revenue_growth_1",
        text: "What an incredible quarter! We just hit $2M in recurring revenue, a 150% increase from last year. The enterprise deals we closed in Q3 are really paying off. I'm excited about our expansion into the European market next quarter.",
        expected: {
          category: "achievement",
          mood: "excited",
          energy: "high",
          confidence_min: 85
        },
        business_context: "Major revenue milestone with growth momentum"
      },
      {
        id: "revenue_growth_2", 
        text: "Three new enterprise clients signed this week, each worth over $100K annually. Our sales team is on fire and the product-market fit is really clicking. Time to scale our customer success team.",
        expected: {
          category: "growth",
          mood: "confident",
          energy: "high",
          confidence_min: 80
        },
        business_context: "Client acquisition success driving scaling needs"
      },

      // 2. Team Challenges & Personnel Decisions
      {
        id: "personnel_challenge_1",
        text: "Fired our first employee today. John wasn't meeting performance standards despite multiple conversations and improvement plans. It was one of the hardest things I've had to do as a founder. He's a good person, just not the right fit for our fast-paced environment. I feel guilty but also relieved.",
        expected: {
          category: "challenge",
          mood: "conflicted",
          energy: "low",
          confidence_min: 85
        },
        business_context: "Difficult personnel decision requiring emotional processing"
      },
      {
        id: "personnel_challenge_2",
        text: "Team member quit unexpectedly this morning, right before our product launch. I'm scrambling to redistribute the workload and feeling overwhelmed. This couldn't have come at a worse time.",
        expected: {
          category: "challenge",
          mood: "stressed",
          energy: "low",
          confidence_min: 80
        },
        business_context: "Unexpected staffing crisis during critical business period"
      },

      // 3. Strategic Planning & Decision Making
      {
        id: "strategic_planning_1",
        text: "Spent the entire day working on our 2025 strategic plan. Analyzing market trends, competitor movements, and our internal capabilities to chart our course. The key priorities are expanding AI capabilities, entering two new verticals, and building a world-class customer success organization.",
        expected: {
          category: "planning",
          mood: "analytical",
          energy: "medium",
          confidence_min: 80
        },
        business_context: "Comprehensive strategic planning for business expansion"
      },
      {
        id: "strategic_planning_2",
        text: "Need to make a decision about our Series A funding round. The term sheets are in, and I'm weighing the trade-offs between valuation, investor alignment, and giving up control. This will shape our company's future.",
        expected: {
          category: "planning",
          mood: "contemplative",
          energy: "medium",
          confidence_min: 75
        },
        business_context: "Critical funding decision with long-term implications"
      },

      // 4. Crisis Management & Workplace Incidents
      {
        id: "crisis_management_1",
        text: "Major production outage hit us at 3 AM. 80% of our customers were affected for 4 hours. I immediately activated our crisis response, got engineering on emergency calls, and personally reached out to our biggest clients. We had it resolved by 7 AM but the damage control continues.",
        expected: {
          category: "challenge",
          mood: "determined",
          energy: "medium",
          confidence_min: 80
        },
        business_context: "Technical crisis requiring immediate leadership response"
      },
      {
        id: "crisis_management_2",
        text: "Today was both challenging and rewarding in equal measure. We had a major client escalation - they were threatening to cancel due to performance issues. I got on a call immediately, acknowledged the problems, and our team implemented a fix within 4 hours. By end of day, they actually increased their contract by 50%.",
        expected: {
          category: "challenge",
          mood: "determined",
          energy: "medium",
          confidence_min: 80
        },
        business_context: "Client crisis management resulting in strengthened relationship"
      },

      // 5. Financial Stress & Cash Flow
      {
        id: "financial_stress_1",
        text: "Cash flow has been tight for three months. I've been deferring my own salary to cover payroll and essential expenses. Had a difficult conversation with our landlord about extending lease payment deadlines. It's emotionally draining, lying awake at night running numbers in my head.",
        expected: {
          category: "challenge",
          mood: "stressed",
          energy: "low",
          confidence_min: 85
        },
        business_context: "Financial pressure requiring personal sacrifice and difficult decisions"
      },

      // 6. Product Development & Launch
      {
        id: "product_launch_1",
        text: "After 18 months of development, we finally launched our AI platform today. The initial user feedback has been incredible - 94% positive ratings and several enterprise prospects already reaching out. This validates everything we've been building.",
        expected: {
          category: "achievement",
          mood: "accomplished",
          energy: "high",
          confidence_min: 85
        },
        business_context: "Successful product launch with positive market validation"
      },
      {
        id: "product_development_2",
        text: "The product launch didn't go as planned. User onboarding was too complex, messaging wasn't clear, and we underestimated technical support needs. Reading through customer feedback is painful but valuable. I realize I've been building what I think they need instead of what they actually need.",
        expected: {
          category: "learning",
          mood: "reflective",
          energy: "medium",
          confidence_min: 80
        },
        business_context: "Product launch lessons learned through customer feedback analysis"
      },

      // 7. Investor Relations & Funding
      {
        id: "investor_relations_1",
        text: "Closed our Series A round today - $5M led by TechVentures with participation from three other VCs. It's surreal seeing those numbers in our bank account. Now the real pressure begins to execute on our growth plans and justify their investment.",
        expected: {
          category: "achievement",
          mood: "excited",
          energy: "high",
          confidence_min: 85
        },
        business_context: "Major funding milestone creating both opportunity and pressure"
      },

      // 8. Learning & Reflection Scenarios
      {
        id: "learning_reflection_1",
        text: "Attended the SaaS conference and learned so much about scaling customer success operations. Realized we're making several rookie mistakes in our retention strategy. Taking notes on implementing NPS surveys and proactive customer health scoring.",
        expected: {
          category: "learning",
          mood: "curious",
          energy: "medium",
          confidence_min: 75
        },
        business_context: "Professional development insights for operational improvements"
      },

      // 9. Competitive Pressure
      {
        id: "competitive_pressure_1",
        text: "Our main competitor just announced a $20M Series B and a feature that's remarkably similar to what we're building. I'm worried about their ability to out-execute us with more resources. Need to accelerate our roadmap and differentiate our positioning.",
        expected: {
          category: "challenge",
          mood: "concerned",
          energy: "medium",
          confidence_min: 80
        },
        business_context: "Competitive pressure requiring strategic response and positioning"
      },

      // 10. Partnership & Business Development
      {
        id: "partnership_success_1",
        text: "We did it! After 6 months of negotiations, we finally closed the partnership deal with Microsoft. This will integrate our technology into their enterprise suite, potentially reaching millions of users. I called my co-founder at midnight to share the news.",
        expected: {
          category: "achievement",
          mood: "accomplished",
          energy: "high",
          confidence_min: 90
        },
        business_context: "Major strategic partnership representing significant company milestone"
      }
    ];
  }

  // Test the complete AI pipeline
  async testAIPipeline(scenario) {
    console.log(`\n🧪 Testing scenario: ${scenario.id}`);
    console.log(`📝 Text: "${scenario.text.substring(0, 100)}..."`);
    console.log(`🎯 Expected: ${scenario.expected.category}, ${scenario.expected.mood}, ${scenario.expected.energy} energy`);
    
    try {
      // Call the AI analysis endpoint directly
      const response = await fetch('/api/huggingface/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: scenario.text }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Analyze the results
      const testResult = this.analyzeTestResult(scenario, result);
      this.testResults.push(testResult);
      
      return testResult;
      
    } catch (error) {
      console.error(`❌ Test failed for ${scenario.id}:`, error.message);
      const failedResult = {
        scenario_id: scenario.id,
        passed: false,
        error: error.message,
        expected: scenario.expected,
        actual: null
      };
      this.testResults.push(failedResult);
      this.failedTests++;
      return failedResult;
    }
  }

  // Analyze test results for accuracy
  analyzeTestResult(scenario, actualResult) {
    const expected = scenario.expected;
    const actual = {
      category: actualResult.business_category,
      mood: actualResult.primary_mood?.toLowerCase(),
      energy: actualResult.energy,
      confidence: actualResult.confidence
    };

    // Check category accuracy
    const categoryMatch = expected.category === actual.category;
    
    // Check mood accuracy (with some flexibility for similar moods)
    const moodMatch = this.checkMoodMatch(expected.mood, actual.mood);
    
    // Check energy accuracy
    const energyMatch = expected.energy === actual.energy;
    
    // Check confidence threshold
    const confidencePass = actual.confidence >= expected.confidence_min;
    
    // Overall pass criteria: category + (mood OR confidence) + energy
    const overallPass = categoryMatch && (moodMatch || confidencePass) && energyMatch;
    
    const result = {
      scenario_id: scenario.id,
      passed: overallPass,
      expected,
      actual,
      scores: {
        category_match: categoryMatch,
        mood_match: moodMatch,
        energy_match: energyMatch,
        confidence_pass: confidencePass
      },
      business_context: scenario.business_context,
      analysis_source: actualResult.analysis_source,
      raw_result: actualResult
    };

    // Log detailed results
    if (overallPass) {
      console.log(`✅ PASSED: ${scenario.id}`);
      this.passedTests++;
    } else {
      console.log(`❌ FAILED: ${scenario.id}`);
      console.log(`   Expected: category=${expected.category}, mood=${expected.mood}, energy=${expected.energy}`);
      console.log(`   Actual:   category=${actual.category}, mood=${actual.mood}, energy=${actual.energy}`);
      this.failedTests++;
    }
    
    this.totalTests++;
    return result;
  }

  // Check mood matching with semantic similarity
  checkMoodMatch(expectedMood, actualMood) {
    if (expectedMood === actualMood) return true;
    
    // Define mood groups for semantic matching
    const moodGroups = {
      excited: ['excited', 'enthusiastic', 'energized', 'thrilled'],
      confident: ['confident', 'assured', 'certain', 'determined'],
      stressed: ['stressed', 'overwhelmed', 'anxious', 'pressured'],
      conflicted: ['conflicted', 'torn', 'ambivalent', 'mixed'],
      accomplished: ['accomplished', 'satisfied', 'proud', 'successful'],
      analytical: ['analytical', 'focused', 'thoughtful', 'systematic'],
      reflective: ['reflective', 'contemplative', 'introspective', 'learning'],
      concerned: ['concerned', 'worried', 'cautious', 'uncertain'],
      curious: ['curious', 'interested', 'investigative', 'exploring']
    };

    // Check if moods are in the same semantic group
    for (const [group, moods] of Object.entries(moodGroups)) {
      if (moods.includes(expectedMood) && moods.includes(actualMood)) {
        return true;
      }
    }
    
    return false;
  }

  // Test error handling and fallback scenarios
  async testErrorHandling() {
    console.log('\n🛡️ Testing error handling and fallback scenarios...');
    
    const errorTests = [
      {
        name: "API Timeout Simulation",
        text: "Test entry for timeout handling"
      },
      {
        name: "Empty Content",
        text: ""
      },
      {
        name: "Very Long Content",
        text: "This is a very long business journal entry that exceeds normal limits. ".repeat(100)
      }
    ];

    for (const test of errorTests) {
      try {
        console.log(`\n🧪 Testing: ${test.name}`);
        const response = await fetch('/api/huggingface/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: test.text }),
        });

        const result = await response.json();
        console.log(`✅ ${test.name} handled gracefully:`, result.analysis_source);
        
      } catch (error) {
        console.log(`❌ ${test.name} failed:`, error.message);
      }
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting comprehensive AI accuracy test suite...\n');
    
    const scenarios = this.getTestScenarios();
    
    // Test each scenario
    for (const scenario of scenarios) {
      await this.testAIPipeline(scenario);
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Test error handling
    await this.testErrorHandling();
    
    // Generate final report
    this.generateReport();
  }

  // Generate comprehensive test report
  generateReport() {
    console.log('\n📊 COMPREHENSIVE TEST RESULTS REPORT');
    console.log('=====================================');
    
    const accuracy = this.totalTests > 0 ? (this.passedTests / this.totalTests * 100).toFixed(1) : 0;
    
    console.log(`\n📈 Overall Accuracy: ${accuracy}% (${this.passedTests}/${this.totalTests} tests passed)`);
    
    // Category-wise analysis
    const categoryResults = {};
    const sourceResults = {};
    
    this.testResults.forEach(result => {
      if (result.expected) {
        const category = result.expected.category;
        if (!categoryResults[category]) {
          categoryResults[category] = { passed: 0, total: 0 };
        }
        categoryResults[category].total++;
        if (result.passed) categoryResults[category].passed++;
        
        // Track analysis source performance
        const source = result.analysis_source || 'unknown';
        if (!sourceResults[source]) {
          sourceResults[source] = { passed: 0, total: 0 };
        }
        sourceResults[source].total++;
        if (result.passed) sourceResults[source].passed++;
      }
    });
    
    console.log('\n📊 Category Performance:');
    Object.entries(categoryResults).forEach(([category, stats]) => {
      const categoryAccuracy = (stats.passed / stats.total * 100).toFixed(1);
      console.log(`   ${category}: ${categoryAccuracy}% (${stats.passed}/${stats.total})`);
    });
    
    console.log('\n🤖 Analysis Source Performance:');
    Object.entries(sourceResults).forEach(([source, stats]) => {
      const sourceAccuracy = (stats.passed / stats.total * 100).toFixed(1);
      console.log(`   ${source}: ${sourceAccuracy}% (${stats.passed}/${stats.total})`);
    });
    
    // Failed test analysis
    const failedTests = this.testResults.filter(r => !r.passed && r.expected);
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Test Analysis:');
      failedTests.forEach(test => {
        console.log(`   ${test.scenario_id}: Expected ${test.expected.category}/${test.expected.mood}, got ${test.actual?.category || 'unknown'}/${test.actual?.mood || 'unknown'}`);
      });
    }
    
    // Generate improvement recommendations
    this.generateRecommendations();
    
    return {
      accuracy: parseFloat(accuracy),
      totalTests: this.totalTests,
      passedTests: this.passedTests,
      failedTests: this.failedTests,
      categoryResults,
      sourceResults,
      detailedResults: this.testResults
    };
  }

  // Generate improvement recommendations
  generateRecommendations() {
    console.log('\n💡 Improvement Recommendations:');
    
    const failedTests = this.testResults.filter(r => !r.passed && r.expected);
    
    if (failedTests.length === 0) {
      console.log('   🎉 Excellent! All tests passed. The AI implementation is performing very well.');
      return;
    }
    
    // Analyze common failure patterns
    const failurePatterns = {
      category: {},
      mood: {},
      energy: {}
    };
    
    failedTests.forEach(test => {
      if (!test.scores.category_match) {
        const pattern = `${test.expected.category} -> ${test.actual?.category || 'unknown'}`;
        failurePatterns.category[pattern] = (failurePatterns.category[pattern] || 0) + 1;
      }
      if (!test.scores.mood_match) {
        const pattern = `${test.expected.mood} -> ${test.actual?.mood || 'unknown'}`;
        failurePatterns.mood[pattern] = (failurePatterns.mood[pattern] || 0) + 1;
      }
      if (!test.scores.energy_match) {
        const pattern = `${test.expected.energy} -> ${test.actual?.energy || 'unknown'}`;
        failurePatterns.energy[pattern] = (failurePatterns.energy[pattern] || 0) + 1;
      }
    });
    
    // Generate specific recommendations
    Object.entries(failurePatterns).forEach(([type, patterns]) => {
      if (Object.keys(patterns).length > 0) {
        console.log(`\n   📋 ${type.charAt(0).toUpperCase() + type.slice(1)} Misclassifications:`);
        Object.entries(patterns)
          .sort(([,a], [,b]) => b - a)
          .forEach(([pattern, count]) => {
            console.log(`      ${pattern} (${count} occurrences)`);
          });
      }
    });
  }
}

// Export for use in testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAccuracyTestSuite;
}

// Browser/client-side usage
if (typeof window !== 'undefined') {
  window.AIAccuracyTestSuite = AIAccuracyTestSuite;
}