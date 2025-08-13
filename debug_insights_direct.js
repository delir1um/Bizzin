// Direct test of the insights generation logic
const testContent = "Today we discussed Series A funding with potential investors. They want to invest 10 million in our startup.";
const lowerContent = testContent.toLowerCase();

console.log('\n=== DIRECT INSIGHTS TESTING ===');
console.log('Content:', testContent);
console.log('Lower content:', lowerContent);

// Test funding detection
const hasFunding = lowerContent.includes('funding');
const hasInvestment = lowerContent.includes('investment'); 
const hasInvestor = lowerContent.includes('investor');

console.log('\nKeyword Detection:');
console.log('Has "funding":', hasFunding);
console.log('Has "investment":', hasInvestment);
console.log('Has "investor":', hasInvestor);

// Test the logic from generateBusinessInsights
const insights = [];

if (lowerContent.includes('funding') || lowerContent.includes('investment') || lowerContent.includes('investor')) {
  console.log('✅ Funding/investment detected');
  if (lowerContent.includes('series a') || lowerContent.includes('seed') || lowerContent.includes('raise')) {
    insights.push("Fundraising is a full-time job that pauses building. Set clear timelines, prepare thoroughly, and get back to customers fast.");
    console.log('✅ Added Series A insight');
  } else {
    insights.push("Funding is fuel, not validation. Stay focused on unit economics and customer satisfaction - investors bet on execution, not ideas.");
    console.log('✅ Added general funding insight');
  }
} else {
  console.log('❌ Funding/investment NOT detected');
}

console.log('\nFinal insights array:', insights);
console.log('Insights count:', insights.length);