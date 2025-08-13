// Test script to create a sample entry and view its insights
const userId = '9502ea97-1adb-4115-ba05-1b6b1b5fa721';

// Create a test entry with technical content
const testEntry = {
  title: "Server outage caused customer complaints",
  content: "Our main server went down for 3 hours today and we got 15 angry customer emails. I need to fix our technical infrastructure and improve our communication during outages.",
  user_id: userId
};

fetch('http://localhost:5000/api/journal/entries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId
  },
  body: JSON.stringify(testEntry)
}).then(r => r.json()).then(entry => {
  console.log('\n=== NEW ENTRY WITH ENHANCED INSIGHTS ===\n');
  console.log(`Title: "${entry.title}"`);
  console.log(`Category: ${entry.sentiment_data.business_category}`);
  console.log(`Mood: ${entry.sentiment_data.primary_mood}`);
  console.log(`Confidence: ${entry.sentiment_data.confidence}%`);
  console.log(`\nAI Business Insights:`);
  entry.sentiment_data.insights.forEach((insight, i) => {
    console.log(`${i+1}. ${insight}`);
  });
}).catch(console.error);