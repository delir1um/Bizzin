// Debug script to test insights generation directly
const userId = '9502ea97-1adb-4115-ba05-1b6b1b5fa721';

// Test creating an entry with revenue content
const testEntry = {
  title: "Q3 results are in and we hit R2",
  content: "Q3 results are in and we hit R2.1 million in revenue, up 45% from Q2. Our monthly recurring revenue is now R720k with healthy growth across all customer segments.",
  user_id: userId
};

console.log('Testing entry creation with revenue content...');

fetch('http://localhost:5000/api/journal/entries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId
  },
  body: JSON.stringify(testEntry)
}).then(r => {
  if (!r.ok) {
    throw new Error(`HTTP ${r.status}: ${r.statusText}`);
  }
  return r.json();
}).then(entry => {
  console.log('\n=== DEBUG: Entry Creation Result ===');
  console.log('Title:', entry.title);
  console.log('AI Category:', entry.sentiment_data.business_category);
  console.log('Mood:', entry.sentiment_data.primary_mood);
  console.log('Confidence:', entry.sentiment_data.confidence + '%');
  console.log('Insights Count:', entry.sentiment_data.insights.length);
  console.log('\nInsights:');
  entry.sentiment_data.insights.forEach((insight, i) => {
    console.log(`${i + 1}. ${insight}`);
  });
}).catch(error => {
  console.error('Error:', error.message);
});