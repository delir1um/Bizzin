// Debug test for AI Business Insights
const testText = "Enjoy working for myself And it brings me great joy to be able to develop products that customers can use on a daily basis";

console.log('🚀 Testing AI Business Insights with specific text:');
console.log('Text:', testText);
console.log('\n');

// Test the specific patterns mentioned in the task
console.log('🔍 Pattern Testing:');
console.log('1. develop.*products pattern test:', /develop.*products?/i.test(testText));
console.log('2. customers.*use pattern test:', /customers.*use/i.test(testText));
console.log('3. customers can use exact pattern test:', /customers can use/i.test(testText));
console.log('\n');

// Test the full project work regex used in the code
const projectRegex = /complet.*project|finish.*project|deliver.*project|seven projects|wrapped up.*projects?|finished.*tasks?|delivered.*items?|shipped.*deliverables?|concluded.*work|develop.*products?|working on|building|creating|delivering value|product development|developing|built|created|launched|shipped/i;
console.log('4. Full project work regex test:', projectRegex.test(testText));

// Test the full client relations regex
const clientRegex = /client.*happy|customer.*satisfied|client.*pleased|clients.*delighted|clients.*thrilled|customer satisfaction|positive feedback|client.*love|customer.*ecstatic|amazing.*response|customers.*use|customers can use|user.*experience|customer.*value|serving customers|customer base|user satisfaction|customer.*value|customers.*daily/i;
console.log('5. Full client relations regex test:', clientRegex.test(testText));
console.log('\n');

// Make a test request to the huggingface API to see the debugging output
fetch('http://localhost:5000/api/huggingface/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ text: testText }),
})
.then(response => response.json())
.then(data => {
  console.log('✅ API Response:', data);
})
.catch(error => {
  console.error('❌ API Error:', error);
});