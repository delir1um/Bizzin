// Test the analyzeBusinessSentiment function directly
import { analyzeBusinessSentiment } from './client/src/lib/sentimentAnalysis.js';

const testContent = "Met with our investment advisor today to discuss raising Series A funding. We need R15 million to scale our engineering team and expand to three new markets. Our current burn rate gives us 8 months of runway, so timing is crucial. We've identified 12 potential investors who focus on B2B SaaS companies at our stage. The pitch deck needs to demonstrate clear product-market fit and a path to R50M ARR within 24 months.";

console.log('Testing analyzeBusinessSentiment with funding content...');

try {
  const result = await analyzeBusinessSentiment(testContent, "Met with our investment advisor today");
  console.log('\nResult:');
  console.log('Category:', result.category);
  console.log('Primary mood:', result.mood.primary);
  console.log('Confidence:', result.mood.confidence);
  console.log('Energy:', result.mood.energy);
  console.log('Insights count:', result.insights.length);
  console.log('\nInsights:');
  result.insights.forEach((insight, i) => {
    console.log(`${i + 1}. ${insight}`);
  });
} catch (error) {
  console.error('Error testing analyzeBusinessSentiment:', error);
}