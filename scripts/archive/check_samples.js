// Check current sample entries
const userId = '9502ea97-1adb-4115-ba05-1b6b1b5fa721';

fetch(`http://localhost:5000/api/journal/entries`, {
  headers: { 'x-user-id': userId }
}).then(r => r.json()).then(entries => {
  console.log('\n=== CURRENT SAMPLE ENTRIES ===\n');
  entries.forEach((entry, i) => {
    console.log(`${i+1}. "${entry.title}"`);
    console.log(`   Category: ${entry.category || 'N/A'} | Mood: ${entry.mood || 'N/A'} | Confidence: ${entry.confidence || 'N/A'}%`);
    if (entry.sentiment_data) {
      console.log(`   AI Analysis: ${entry.sentiment_data.business_category}/${entry.sentiment_data.primary_mood}/${entry.sentiment_data.energy} (${entry.sentiment_data.confidence}%)`);
    }
    console.log('');
  });
  console.log(`Total entries: ${entries.length}`);
}).catch(console.error);