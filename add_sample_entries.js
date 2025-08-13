// Script to add sample journal entries for testing
const sampleEntries = [
  {
    title: "Closed our biggest client deal yet! 🎉",
    content: "Just finished the presentation to the board at MegaCorp and they signed a R2.5 million contract for the next 18 months. This is huge for us - it's triple our previous biggest client. The team worked incredibly hard preparing the proposal, doing market research, and building custom prototypes. I'm so proud of everyone. This deal will allow us to hire 3 new developers and finally move to that bigger office space we've been eyeing. The client was particularly impressed with our AI integration capabilities and how we can scale their operations. This validates everything we've been building for the past 2 years."
  },
  {
    title: "Major supply chain disruption hitting us hard",
    content: "Our main supplier in China just informed us they'll be shutting down for 6 weeks due to new regulations. This affects 70% of our inventory and we only have 3 weeks of stock left. Customers are already asking about delivery delays and I'm worried about losing the momentum we've built this quarter. Had emergency meetings with the procurement team to find alternative suppliers, but the costs are 40% higher and quality standards are unknown. This could seriously impact our Q4 projections and the investor update is next month. Need to decide whether to absorb the cost increase or pass it to customers - neither option feels good right now."
  },
  {
    title: "Team expansion strategy session - exciting times ahead",
    content: "Spent the morning with Sarah and Mike planning our hiring roadmap for 2025. We're looking to grow from 12 to 25 employees over the next 8 months. The roles we need most urgently are: senior backend developer, UX designer, sales specialist, and customer success manager. We've mapped out the interview process, salary bands, and equity allocation. The challenging part is maintaining our culture as we scale - we don't want to lose the close-knit feeling that makes this place special. We're also exploring remote work policies to tap into talent outside Cape Town. Budget-wise, we're comfortable with the runway thanks to the recent funding round."
  },
  {
    title: "Reflecting on customer feedback from last month's survey",
    content: "The results from our Net Promoter Score survey came back and there are some interesting insights. Overall score is 67 which is decent but not where I want us to be. The main complaint is response time to support tickets - averaging 18 hours when customers expect same-day replies. On the positive side, 89% love our product features and 92% would recommend us to others. Three customers specifically mentioned that our solution saves them 5+ hours per week. I think we need to invest more in our customer success team and maybe implement a live chat feature. This feedback is gold for product development priorities."
  },
  {
    title: "Breakthrough moment with the new algorithm!",
    content: "After 6 weeks of debugging and optimization, we finally cracked the performance issue that was plaguing our recommendation engine. The new machine learning model is running 300% faster and accuracy improved from 73% to 91%. The team stayed late three nights this week testing different approaches, and yesterday evening everything just clicked into place. This breakthrough means we can handle 10x more concurrent users without additional server costs. Already scheduled demos with two enterprise prospects for next week. Sometimes the best solutions come when you least expect them - this could be a game-changer for our competitive position."
  },
  {
    title: "Difficult conversation with underperforming team member",
    content: "Had to have a tough but necessary conversation with James today about his recent work quality and attendance issues. He's been with us since the beginning and I really want him to succeed, but his performance has declined over the past 3 months. Other team members are starting to notice and it's affecting morale. We discussed specific areas for improvement and set up bi-weekly check-ins for the next two months. If things don't improve by then, we'll need to consider other options. These conversations are never easy but they're part of being a leader. The team deserves someone who's fully committed to our mission."
  }
];

async function addSampleEntries() {
  for (const entry of sampleEntries) {
    try {
      const response = await fetch('http://localhost:5000/api/journal/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.SUPABASE_ANON_KEY
        },
        body: JSON.stringify(entry)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✓ Added entry:', entry.title);
      } else {
        console.error('Failed to add entry:', entry.title, response.statusText);
      }
    } catch (error) {
      console.error('Error adding entry:', entry.title, error.message);
    }
    
    // Small delay between entries
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('Sample entries creation complete!');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sampleEntries, addSampleEntries };
} else {
  // Browser environment
  addSampleEntries();
}