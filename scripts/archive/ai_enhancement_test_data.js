// AI Enhancement Test Suite - Phase 1: Real Business Journal Scenarios
// Following Bizzin Development Methodology: Prove with Real Data

const testJournalEntries = [
  // === ACHIEVEMENTS ===
  {
    id: 'achievement_1',
    text: 'Just closed our biggest deal ever - $180k contract with Fortune 500 client. Three months of negotiations finally paid off. Team celebration tonight!',
    expected: {
      category: 'achievement', 
      mood: 'excited',
      energy: 'high',
      heading: 'Major deal closed successfully'
    }
  },
  {
    id: 'achievement_2', 
    text: 'Q4 results exceeded all expectations. Hit $2.3M revenue, up 67% from Q3. Customer retention at 94%. Board meeting presentation went perfectly.',
    expected: {
      category: 'achievement',
      mood: 'excited', 
      energy: 'high',
      heading: 'Outstanding quarterly performance'
    }
  },
  {
    id: 'achievement_3',
    text: 'Product launch was incredible success. 50k downloads in first week, 4.8 stars on App Store, tech blogs calling it revolutionary. Engineering team outdid themselves.',
    expected: {
      category: 'achievement',
      mood: 'excited',
      energy: 'high', 
      heading: 'Product launch success story'
    }
  },

  // === CHALLENGES ===  
  {
    id: 'challenge_1',
    text: 'Sarah, our lead developer, handed in resignation this morning. Major project deadline next month. Losing 5 years of institutional knowledge. Need urgent hiring plan.',
    expected: {
      category: 'challenge',
      mood: 'reflective',
      energy: 'low',
      heading: 'Team management challenges'
    }
  },
  {
    id: 'challenge_2',
    text: 'Working 70-hour weeks for past month. Missing family dinners, cancelled weekend plans twice. Burnout is real. Need to hire COO or delegate more.',
    expected: {
      category: 'challenge', 
      mood: 'reflective',
      energy: 'low',
      heading: 'Managing founder burnout'
    }
  },
  {
    id: 'challenge_3',
    text: 'Database crashed during demo to investors. Lost 2 hours of presentation time. Technical team scrambling. This could impact Series A timing.',
    expected: {
      category: 'challenge',
      mood: 'stressed', 
      energy: 'high',
      heading: 'Technical challenges resolved'
    }
  },
  {
    id: 'challenge_4',
    text: 'Cash flow projections show we need funding by March. Current runway 6 months. Competition raised $10M last week. Pressure mounting.',
    expected: {
      category: 'challenge',
      mood: 'focused',
      energy: 'high', 
      heading: 'Financial pressure response'
    }
  },

  // === GROWTH ===
  {
    id: 'growth_1', 
    text: 'Customer base growing 15% monthly. Scaling infrastructure to handle load. Hired 3 engineers this quarter. Revenue per customer increasing.',
    expected: {
      category: 'growth',
      mood: 'excited',
      energy: 'high',
      heading: 'Scaling operations successfully'
    }
  },
  {
    id: 'growth_2',
    text: 'Competitor raised $50M but customers prefer our approach. Market validation strong. Time to accelerate expansion plans.',
    expected: {
      category: 'growth', 
      mood: 'focused',
      energy: 'high',
      heading: 'Competitive advantage emerging'
    }
  },

  // === PLANNING ===
  {
    id: 'planning_1',
    text: 'Considering pivot to freemium model. Current subscription growth slowing. Market research shows 70% prefer free tier. Strategy meeting Monday.',
    expected: {
      category: 'planning',
      mood: 'focused', 
      energy: 'medium',
      heading: 'Strategic business model evaluation'
    }
  },
  {
    id: 'planning_2',
    text: 'Roadmap for 2025: international expansion, mobile app, enterprise features. Timeline aggressive but achievable. Need buy-in from investors.',
    expected: {
      category: 'planning',
      mood: 'focused',
      energy: 'high',
      heading: 'Strategic roadmap development'
    }
  },

  // === LEARNING === 
  {
    id: 'learning_1',
    text: 'Customer feedback session revealed major UX issues. Users confused by onboarding flow. Learned people want progress indicators. Design sprint scheduled.',
    expected: {
      category: 'learning',
      mood: 'reflective', 
      energy: 'medium',
      heading: 'Customer insights driving improvement'
    }
  },
  {
    id: 'learning_2',
    text: 'Conference keynote taught me importance of company culture. Small teams need different management approach. Implementing weekly one-on-ones.',
    expected: {
      category: 'learning',
      mood: 'reflective',
      energy: 'medium', 
      heading: 'Management insights applied'
    }
  },

  // === EDGE CASES ===
  {
    id: 'edge_1',
    text: 'Mixed day. Lost potential client due to pricing, but existing customer upgraded to enterprise. Revenue neutral, lessons learned.',
    expected: {
      category: 'learning',
      mood: 'reflective',
      energy: 'medium',
      heading: 'Mixed outcomes, valuable insights'
    }
  },
  {
    id: 'edge_2', 
    text: 'Team morale high despite challenging quarter. Revenue down 12% but customer satisfaction up. Building for long-term success.',
    expected: {
      category: 'challenge',
      mood: 'optimistic',
      energy: 'medium',
      heading: 'Long-term perspective on challenges'
    }
  },

  // === SPECIFIC IMPROVEMENTS NEEDED ===
  {
    id: 'improve_1',
    text: 'Launched MVP with basic features. Early users engaged but requesting advanced analytics. Should we build or integrate third-party?',
    expected: {
      category: 'planning', 
      mood: 'focused',
      energy: 'medium',
      heading: 'Product development decisions'
    }
  },
  {
    id: 'improve_2',
    text: 'Incredible response to beta launch! 500% more signups than expected. Servers holding up. Team working overtime but spirits high.',
    expected: {
      category: 'achievement',
      mood: 'excited',
      energy: 'high',
      heading: 'Beta launch overwhelming success'
    }
  },

  // === DAILY OPERATIONS ===
  {
    id: 'daily_1',
    text: 'Regular Tuesday team standup. Progress on Q4 goals steady. Marketing campaign performing above expectations. Small wins building momentum.',
    expected: {
      category: 'reflection',
      mood: 'content', 
      energy: 'medium',
      heading: 'Steady progress on key initiatives'
    }
  },
  {
    id: 'daily_2',
    text: 'Spent morning reviewing financial reports. Burn rate under control, customer acquisition costs improving. Cautiously optimistic about trajectory.',
    expected: {
      category: 'reflection',
      mood: 'content',
      energy: 'medium',
      heading: 'Financial health assessment'
    }
  },

  // === EMOTIONAL DEPTH ===
  {
    id: 'emotion_1',
    text: 'Doubt creeping in after competitor announcement. Are we solving the right problem? Team believes in vision but market signals confusing.',
    expected: {
      category: 'reflection',
      mood: 'doubtful',
      energy: 'low', 
      heading: 'Processing market uncertainty'
    }
  }
];

// Export as JSON for ES modules
import { writeFileSync } from 'fs';
writeFileSync('./ai_enhancement_test_data.json', JSON.stringify({ testJournalEntries }, null, 2));