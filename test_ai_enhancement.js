// Phase 1 Testing Script - AI Enhancement Validation
// Following Development Methodology: Test with Real Data First

import { readFileSync } from 'fs';
const testData = JSON.parse(readFileSync('./ai_enhancement_test_data.json', 'utf8'));
const { testJournalEntries } = testData;

async function runAIEnhancementTests() {
  console.log('🚀 PHASE 1: AI Enhancement Testing with Real Business Scenarios');
  console.log('=' .repeat(80));
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    issues: []
  };

  for (const entry of testJournalEntries) {
    console.log(`\n📝 Testing: ${entry.id}`);
    console.log(`Text: "${entry.text.substring(0, 80)}..."`);
    
    try {
      // Call Hugging Face API
      const response = await fetch('http://localhost:5000/api/huggingface/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: entry.text })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const aiResult = await response.json();
      
      // Compare results  
      const categoryMatch = aiResult.business_category === entry.expected.category;
      const moodMatch = aiResult.primary_mood === entry.expected.mood;
      const energyMatch = aiResult.energy === entry.expected.energy;
      const headingReasonable = aiResult.ai_heading && aiResult.ai_heading.length > 5;
      
      const overallPass = categoryMatch && moodMatch && energyMatch && headingReasonable;
      
      console.log(`Expected: ${JSON.stringify(entry.expected)}`);
      console.log(`Actual: {category: '${aiResult.business_category}', mood: '${aiResult.primary_mood}', energy: '${aiResult.energy}', heading: '${aiResult.ai_heading}'}`);
      console.log(`✅ Category: ${categoryMatch ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Mood: ${moodMatch ? 'PASS' : 'FAIL'}`); 
      console.log(`✅ Energy: ${energyMatch ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Heading: ${headingReasonable ? 'PASS' : 'FAIL'}`);
      console.log(`🎯 Overall: ${overallPass ? '✅ PASS' : '❌ FAIL'}`);
      
      if (overallPass) {
        results.passed++;
      } else {
        results.failed++;
        results.issues.push({
          id: entry.id,
          expected: entry.expected,
          actual: {
            category: aiResult.business_category,
            mood: aiResult.primary_mood, 
            energy: aiResult.energy,
            heading: aiResult.ai_heading
          },
          text: entry.text.substring(0, 100) + '...'
        });
      }
      
      results.total++;
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      results.failed++;
      results.total++;
      results.issues.push({
        id: entry.id,
        error: error.message,
        text: entry.text.substring(0, 100) + '...'
      });
    }
    
    // Delay between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Final Results
  console.log('\n' + '='.repeat(80));
  console.log('🎯 PHASE 1 TEST RESULTS');
  console.log('='.repeat(80)); 
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} (${Math.round(results.passed/results.total*100)}%)`);
  console.log(`Failed: ${results.failed} (${Math.round(results.failed/results.total*100)}%)`);
  
  if (results.issues.length > 0) {
    console.log('\n❌ ISSUES TO ADDRESS:');
    results.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.id}`);
      console.log(`Text: ${issue.text}`);
      if (issue.error) {
        console.log(`Error: ${issue.error}`);
      } else {
        console.log(`Expected: ${JSON.stringify(issue.expected)}`);
        console.log(`Actual: ${JSON.stringify(issue.actual)}`);
      }
    });
  }
  
  // Methodology Assessment
  console.log('\n📋 DEVELOPMENT METHODOLOGY ASSESSMENT:');
  if (results.passed / results.total >= 0.85) {
    console.log('✅ PHASE 1 COMPLETE: Core AI functionality proven (>85% accuracy)');
    console.log('➡️  Ready for Phase 2: Scale solution with enhanced patterns');
  } else {
    console.log('⚠️  PHASE 1 INCOMPLETE: Core needs improvement before scaling');
    console.log('🔧 Focus on fixing fundamental categorization logic first');
  }
}

// Run the tests
runAIEnhancementTests().catch(console.error);