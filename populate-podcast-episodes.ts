import { createClient } from '@supabase/supabase-js'

// For Node.js environment, we need to use the VITE_ prefixed variables or get them from the app
const supabaseUrl = 'https://giahpkiwivxpocikndix.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpYWhwa2l3aXZ4cG9jaWtuZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NjI1OTIsImV4cCI6MjA2OTAzODU5Mn0.qxN9SPNR4oLdAJiE-iQ5VXO5-d--V2Nnr4dQ2QJYaH0'
const supabase = createClient(supabaseUrl, supabaseKey)

const podcastEpisodes = [
  // Strategy Series (Blue theme)
  {
    title: "The 15-Minute Business Model",
    description: "Quick framework to validate your business idea and build a sustainable model that attracts customers and generates revenue from day one.",
    duration: 15 * 60,
    series: "Strategy",
    series_color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    episode_number: 1,
    transcript: "In this episode, we cover the essential components of building a business model that works. We start with identifying your core value proposition, understanding your target customer segments, and mapping out your revenue streams. The key is to keep it simple and focus on validation over perfection.",
    key_takeaways: [
      "Identify your core value proposition first",
      "Map customer segments before building features",
      "Test revenue streams early and often",
      "Keep initial model simple and focused"
    ],
    difficulty: "Beginner"
  },
  {
    title: "Market Research That Actually Works",
    description: "Practical methods to understand your market without expensive research firms or complex surveys.",
    duration: 14 * 60,
    series: "Strategy",
    series_color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    episode_number: 2,
    transcript: "Market research doesn't have to be complicated or expensive. Learn practical techniques to validate your market, understand customer pain points, and identify opportunities using free and low-cost methods.",
    key_takeaways: [
      "Use social media for market insights",
      "Conduct customer interviews effectively",
      "Analyze competitor strategies",
      "Validate demand before building"
    ],
    difficulty: "Beginner"
  },
  {
    title: "Competitive Analysis Framework",
    description: "How to analyze competitors effectively and find your unique positioning in the market.",
    duration: 16 * 60,
    series: "Strategy",
    series_color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    episode_number: 3,
    transcript: "Understanding your competition is crucial for positioning your business effectively. This episode covers systematic approaches to competitor analysis and finding your unique value proposition.",
    key_takeaways: [
      "Map direct and indirect competitors",
      "Analyze pricing and positioning strategies",
      "Identify market gaps and opportunities",
      "Develop unique value propositions"
    ],
    difficulty: "Intermediate"
  },
  {
    title: "Strategic Planning for Startups",
    description: "Create actionable strategic plans that actually get executed, not just filed away.",
    duration: 18 * 60,
    series: "Strategy",
    series_color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    episode_number: 4,
    transcript: "Strategic planning for startups requires a different approach than corporate planning. Learn how to create flexible, actionable plans that guide your business without constraining innovation.",
    key_takeaways: [
      "Balance planning with flexibility",
      "Set measurable strategic objectives",
      "Create accountability systems",
      "Review and adjust plans regularly"
    ],
    difficulty: "Intermediate"
  },

  // Marketing Series (Green theme)
  {
    title: "Digital Marketing on a Startup Budget",
    description: "Practical strategies to market your business effectively without breaking the bank.",
    duration: 15 * 60,
    series: "Marketing",
    series_color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    episode_number: 1,
    transcript: "Marketing doesn't have to be expensive to be effective. In this episode, we explore cost-effective marketing strategies that deliver real results for startups and small businesses.",
    key_takeaways: [
      "Focus on organic content marketing",
      "Leverage social media communities",
      "Build email lists from day one",
      "Measure ROI on every marketing dollar"
    ],
    difficulty: "Beginner"
  },
  {
    title: "Content Marketing That Converts",
    description: "Create content that builds trust, demonstrates expertise, and drives business results.",
    duration: 17 * 60,
    series: "Marketing",
    series_color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    episode_number: 2,
    transcript: "Content marketing is about providing value first and selling second. Learn how to create content that attracts your ideal customers and converts them into paying clients.",
    key_takeaways: [
      "Understand your audience's pain points",
      "Create valuable, actionable content",
      "Optimize content for search engines",
      "Build content distribution systems"
    ],
    difficulty: "Intermediate"
  },
  {
    title: "Social Media Strategy for B2B",
    description: "Navigate social media marketing for business-to-business companies and professional services.",
    duration: 14 * 60,
    series: "Marketing",
    series_color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    episode_number: 3,
    transcript: "B2B social media requires a different approach than B2C. This episode covers platform selection, content strategy, and lead generation for business markets.",
    key_takeaways: [
      "Choose the right platforms for B2B",
      "Create professional thought leadership content",
      "Build relationships, not just followers",
      "Generate leads through social selling"
    ],
    difficulty: "Intermediate"
  },
  {
    title: "Email Marketing Automation",
    description: "Set up automated email sequences that nurture leads and drive sales while you sleep.",
    duration: 19 * 60,
    series: "Marketing",
    series_color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    episode_number: 4,
    transcript: "Email marketing automation allows you to stay connected with prospects and customers without manual effort. Learn how to set up effective automated sequences.",
    key_takeaways: [
      "Design effective welcome sequences",
      "Segment your email lists properly",
      "Write compelling email copy",
      "Optimize for deliverability and engagement"
    ],
    difficulty: "Advanced"
  },

  // Finance Series (Purple theme)
  {
    title: "Cash Flow Crisis Management",
    description: "Practical steps when money gets tight and how to navigate financial challenges while keeping your business operational.",
    duration: 15 * 60,
    series: "Finance",
    series_color: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
    episode_number: 1,
    transcript: "Cash flow problems are one of the leading causes of business failure. In this episode, we discuss early warning signs, emergency funding options, and strategic decisions to make when facing financial pressure.",
    key_takeaways: [
      "Recognize early warning signs of cash flow issues",
      "Implement emergency cost-cutting measures",
      "Explore alternative funding options",
      "Communicate transparently with stakeholders"
    ],
    difficulty: "Intermediate"
  },
  {
    title: "Financial Planning for Entrepreneurs",
    description: "Create realistic financial projections and budgets that guide your business decisions.",
    duration: 16 * 60,
    series: "Finance",
    series_color: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
    episode_number: 2,
    transcript: "Financial planning isn't just about spreadsheets - it's about making informed decisions about your business future. Learn practical approaches to budgeting and forecasting.",
    key_takeaways: [
      "Build realistic financial projections",
      "Track key financial metrics daily",
      "Plan for seasonal variations",
      "Create contingency scenarios"
    ],
    difficulty: "Intermediate"
  },
  {
    title: "Understanding Business Metrics",
    description: "Key performance indicators every entrepreneur should track to make data-driven decisions.",
    duration: 13 * 60,
    series: "Finance",
    series_color: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
    episode_number: 3,
    transcript: "The right metrics can guide your business decisions and help you identify problems early. This episode covers the most important KPIs for different types of businesses.",
    key_takeaways: [
      "Identify your most important metrics",
      "Set up tracking systems early",
      "Use metrics to identify trends",
      "Make decisions based on data, not gut feelings"
    ],
    difficulty: "Beginner"
  },
  {
    title: "Funding Your Business Growth",
    description: "Explore different funding options from bootstrapping to venture capital and everything in between.",
    duration: 20 * 60,
    series: "Finance",
    series_color: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
    episode_number: 4,
    transcript: "There are many ways to fund business growth, each with its own advantages and challenges. This episode explores various funding options and how to choose the right one for your situation.",
    key_takeaways: [
      "Understand different funding types",
      "Prepare for investor conversations",
      "Maintain control while seeking funding",
      "Plan for post-funding growth challenges"
    ],
    difficulty: "Advanced"
  },

  // Leadership Series (Orange theme)
  {
    title: "Building Team Culture Remotely",
    description: "Leadership tactics for distributed teams and creating strong company culture in a remote-first world.",
    duration: 15 * 60,
    series: "Leadership",
    series_color: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
    episode_number: 1,
    transcript: "Remote work has changed the game for team building and company culture. Learn practical strategies for maintaining team cohesion, communication best practices, and building trust across distributed teams.",
    key_takeaways: [
      "Establish clear communication protocols",
      "Create virtual team bonding opportunities",
      "Maintain accountability without micromanaging",
      "Foster trust in distributed teams"
    ],
    difficulty: "Intermediate"
  },
  {
    title: "Effective Decision Making",
    description: "Frameworks for making better business decisions faster, especially under uncertainty.",
    duration: 14 * 60,
    series: "Leadership",
    series_color: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
    episode_number: 2,
    transcript: "Good decision-making is a learnable skill. This episode covers frameworks and techniques for making better decisions faster, especially when information is incomplete.",
    key_takeaways: [
      "Use structured decision-making frameworks",
      "Gather the right amount of information",
      "Consider long-term consequences",
      "Learn from decision outcomes"
    ],
    difficulty: "Intermediate"
  },
  {
    title: "Delegation and Team Growth",
    description: "How to delegate effectively and develop your team members for greater business impact.",
    duration: 17 * 60,
    series: "Leadership",
    series_color: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
    episode_number: 3,
    transcript: "Effective delegation is crucial for scaling your business and developing your team. Learn how to delegate tasks appropriately while maintaining quality and developing team capabilities.",
    key_takeaways: [
      "Identify tasks suitable for delegation",
      "Provide clear expectations and context",
      "Create feedback loops for improvement",
      "Develop team members through challenges"
    ],
    difficulty: "Advanced"
  }
]

async function populateEpisodes() {
  console.log('Starting to populate podcast episodes...')
  
  try {
    // First, check if episodes already exist
    const { data: existingEpisodes, error: checkError } = await supabase
      .from('podcast_episodes')
      .select('id')
      .limit(1)
    
    if (checkError) {
      console.error('Error checking existing episodes:', checkError)
      return
    }
    
    if (existingEpisodes && existingEpisodes.length > 0) {
      console.log('Episodes already exist in database. Skipping population.')
      return
    }
    
    // Insert episodes in batches to avoid overwhelming the database
    const batchSize = 5
    for (let i = 0; i < podcastEpisodes.length; i += batchSize) {
      const batch = podcastEpisodes.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('podcast_episodes')
        .insert(batch)
        .select()
      
      if (error) {
        console.error('Error inserting episode batch:', error)
        throw error
      }
      
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(podcastEpisodes.length / batchSize)}`)
    }
    
    console.log(`Successfully populated ${podcastEpisodes.length} podcast episodes!`)
    
    // Verify the insertion
    const { data: allEpisodes, error: verifyError } = await supabase
      .from('podcast_episodes')
      .select('title, series, episode_number')
      .order('series', { ascending: true })
      .order('episode_number', { ascending: true })
    
    if (verifyError) {
      console.error('Error verifying episodes:', verifyError)
      return
    }
    
    console.log('\nEpisodes by series:')
    const episodesBySeries = allEpisodes?.reduce((acc, episode) => {
      if (!acc[episode.series]) {
        acc[episode.series] = []
      }
      acc[episode.series].push(episode)
      return acc
    }, {} as Record<string, any[]>)
    
    Object.entries(episodesBySeries || {}).forEach(([series, episodes]) => {
      console.log(`\n${series} (${episodes.length} episodes):`)
      episodes.forEach(ep => {
        console.log(`  ${ep.episode_number}. ${ep.title}`)
      })
    })
    
  } catch (error) {
    console.error('Failed to populate episodes:', error)
  }
}

// Run the population script
populateEpisodes()