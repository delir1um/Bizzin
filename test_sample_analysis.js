// Test script to analyze our sample entries
const sampleTitles = [
  "Closed our biggest client deal yet!",
  "Major supply chain disruption hitting us hard",
  "Team expansion strategy session - exciting times ahead", 
  "Reflecting on customer feedback from last month's survey",
  "Breakthrough moment with the new algorithm!",
  "Difficult conversation with underperforming team member"
];

async function checkSampleAnalysis() {
  try {
    const response = await fetch('http://localhost:5000/api/journal/entries', {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '9502ea97-1adb-4115-ba05-1b6b1b5fa721'
      }
    });
    
    const entries = await response.json();
    
    console.log('\n=== SAMPLE ENTRY ANALYSIS RESULTS ===\n');
    
    sampleTitles.forEach(title => {
      const entry = entries.find(e => e.title.includes(title.split(' ')[0]));
      if (entry) {
        console.log(`📝 ${entry.title}`);
        console.log(`   Category: ${entry.category} | Mood: ${entry.mood} | Energy: ${entry.energy_level}`);
        console.log(`   Confidence: ${entry.confidence}% | AI Insights: ${entry.ai_insights ? 'Present' : 'Missing'}`);
        console.log('');
      }
    });
    
  } catch (error) {
    console.error('Error checking entries:', error.message);
  }
}

if (typeof window !== 'undefined') {
  checkSampleAnalysis();
}