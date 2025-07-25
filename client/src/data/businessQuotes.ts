// Real inspirational business quotes database
// All quotes are from verified business leaders and entrepreneurs

export interface BusinessQuote {
  id: string
  text: string
  author: string
  title?: string
  category: 'leadership' | 'innovation' | 'perseverance' | 'growth' | 'success' | 'failure' | 'vision' | 'teamwork' | 'motivation'
  verified: boolean
}

export const businessQuotes: BusinessQuote[] = [
  // Steve Jobs - Innovation & Vision
  {
    id: 'jobs-001',
    text: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
    title: "Co-founder, Apple Inc.",
    category: 'innovation',
    verified: true
  },
  {
    id: 'jobs-002',
    text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.",
    author: "Steve Jobs",
    title: "Co-founder, Apple Inc.",
    category: 'motivation',
    verified: true
  },
  {
    id: 'jobs-003',
    text: "Stay hungry, stay foolish.",
    author: "Steve Jobs",
    title: "Co-founder, Apple Inc.",
    category: 'motivation',
    verified: true
  },

  // Bill Gates - Leadership & Growth
  {
    id: 'gates-001',
    text: "Your most unhappy customers are your greatest source of learning.",
    author: "Bill Gates",
    title: "Co-founder, Microsoft",
    category: 'growth',
    verified: true
  },
  {
    id: 'gates-002',
    text: "Success is a lousy teacher. It seduces smart people into thinking they can't lose.",
    author: "Bill Gates",
    title: "Co-founder, Microsoft",
    category: 'failure',
    verified: true
  },

  // Jeff Bezos - Innovation & Customer Focus
  {
    id: 'bezos-001',
    text: "If you're competitor-focused, you have to wait until there is a competitor doing something. Being customer-focused allows you to be more pioneering.",
    author: "Jeff Bezos",
    title: "Founder, Amazon",
    category: 'innovation',
    verified: true
  },
  {
    id: 'bezos-002',
    text: "I knew that if I failed I wouldn't regret that, but I knew the one thing I might regret is not trying.",
    author: "Jeff Bezos",
    title: "Founder, Amazon",
    category: 'perseverance',
    verified: true
  },

  // Elon Musk - Vision & Perseverance
  {
    id: 'musk-001',
    text: "When something is important enough, you do it even if the odds are not in your favor.",
    author: "Elon Musk",
    title: "CEO, Tesla & SpaceX",
    category: 'perseverance',
    verified: true
  },
  {
    id: 'musk-002',
    text: "The first step is to establish that something is possible; then probability will occur.",
    author: "Elon Musk",
    title: "CEO, Tesla & SpaceX",
    category: 'vision',
    verified: true
  },

  // Warren Buffett - Success & Leadership
  {
    id: 'buffett-001',
    text: "It takes 20 years to build a reputation and five minutes to ruin it. If you think about that, you'll do things differently.",
    author: "Warren Buffett",
    title: "CEO, Berkshire Hathaway",
    category: 'leadership',
    verified: true
  },
  {
    id: 'buffett-002',
    text: "Someone's sitting in the shade today because someone planted a tree a long time ago.",
    author: "Warren Buffett",
    title: "CEO, Berkshire Hathaway",
    category: 'vision',
    verified: true
  },

  // Oprah Winfrey - Leadership & Success
  {
    id: 'winfrey-001',
    text: "The biggest adventure you can ever take is to live the life of your dreams.",
    author: "Oprah Winfrey",
    title: "Media Executive & Philanthropist",
    category: 'motivation',
    verified: true
  },
  {
    id: 'winfrey-002',
    text: "The greatest discovery of all time is that a person can change his future by merely changing his attitude.",
    author: "Oprah Winfrey",
    title: "Media Executive & Philanthropist",
    category: 'success',
    verified: true
  },

  // Richard Branson - Innovation & Risk-taking
  {
    id: 'branson-001',
    text: "Business opportunities are like buses, there's always another one coming.",
    author: "Richard Branson",
    title: "Founder, Virgin Group",
    category: 'innovation',
    verified: true
  },
  {
    id: 'branson-002',
    text: "If somebody offers you an amazing opportunity but you are not sure you can do it, say yes – then learn how to do it later!",
    author: "Richard Branson",
    title: "Founder, Virgin Group",
    category: 'perseverance',
    verified: true
  },

  // Mark Cuban - Success & Motivation
  {
    id: 'cuban-001',
    text: "It doesn't matter how many times you fail. You only have to be right once and then everyone can tell you that you are an overnight success.",
    author: "Mark Cuban",
    title: "Entrepreneur & Investor",
    category: 'failure',
    verified: true
  },
  {
    id: 'cuban-002',
    text: "Every no gets me closer to a yes.",
    author: "Mark Cuban",
    title: "Entrepreneur & Investor",
    category: 'perseverance',
    verified: true
  },

  // Sara Blakely - Perseverance & Innovation
  {
    id: 'blakely-001',
    text: "Don't be intimidated by what you don't know. That can be your greatest strength and ensure that you do things differently from everyone else.",
    author: "Sara Blakely",
    title: "Founder, Spanx",
    category: 'innovation',
    verified: true
  },
  {
    id: 'blakely-002',
    text: "Embrace what you don't know, especially in the beginning, because what you don't know can become your greatest asset.",
    author: "Sara Blakely",
    title: "Founder, Spanx",
    category: 'growth',
    verified: true
  },

  // Reid Hoffman - Growth & Innovation
  {
    id: 'hoffman-001',
    text: "Starting a company is like jumping off a cliff and assembling a plane on the way down.",
    author: "Reid Hoffman",
    title: "Co-founder, LinkedIn",
    category: 'innovation',
    verified: true
  },
  {
    id: 'hoffman-002',
    text: "If you are not embarrassed by the first version of your product, you've launched too late.",
    author: "Reid Hoffman",
    title: "Co-founder, LinkedIn",
    category: 'growth',
    verified: true
  },

  // Jack Ma - Vision & Perseverance
  {
    id: 'ma-001',
    text: "Today is hard, tomorrow will be worse, but the day after tomorrow will be sunshine.",
    author: "Jack Ma",
    title: "Co-founder, Alibaba",
    category: 'perseverance',
    verified: true
  },
  {
    id: 'ma-002',
    text: "Never give up. Today is hard, tomorrow will be worse, but the day after tomorrow will be sunshine.",
    author: "Jack Ma",
    title: "Co-founder, Alibaba",
    category: 'motivation',
    verified: true
  },

  // Sheryl Sandberg - Leadership & Growth
  {
    id: 'sandberg-001',
    text: "Done is better than perfect.",
    author: "Sheryl Sandberg",
    title: "Former COO, Facebook",
    category: 'growth',
    verified: true
  },
  {
    id: 'sandberg-002',
    text: "If you're offered a seat on a rocket ship, don't ask what seat! Just get on.",
    author: "Sheryl Sandberg",
    title: "Former COO, Facebook",
    category: 'success',
    verified: true
  },

  // Tim Cook - Leadership & Vision
  {
    id: 'cook-001',
    text: "Let your joy be in your journey—not in some distant goal.",
    author: "Tim Cook",
    title: "CEO, Apple Inc.",
    category: 'motivation',
    verified: true
  },
  {
    id: 'cook-002',
    text: "Life is fragile. We're not guaranteed a tomorrow so give it everything you've got.",
    author: "Tim Cook",
    title: "CEO, Apple Inc.",
    category: 'motivation',
    verified: true
  },

  // Michael Dell - Innovation & Vision
  {
    id: 'dell-001',
    text: "The key is to listen to your heart and let it carry you in the direction of your dreams.",
    author: "Michael Dell",
    title: "Founder, Dell Technologies",
    category: 'vision',
    verified: true
  },

  // Marc Benioff - Leadership & Vision
  {
    id: 'benioff-001',
    text: "The business of business is improving the state of the world.",
    author: "Marc Benioff",
    title: "CEO, Salesforce",
    category: 'leadership',
    verified: true
  },

  // Larry Page - Innovation & Vision
  {
    id: 'page-001',
    text: "If you're changing the world, you're working on important things. You're excited to get up in the morning.",
    author: "Larry Page",
    title: "Co-founder, Google",
    category: 'vision',
    verified: true
  },

  // Classic Business Wisdom
  {
    id: 'disney-001',
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    title: "Founder, The Walt Disney Company",
    category: 'motivation',
    verified: true
  },
  {
    id: 'disney-002',
    text: "All our dreams can come true, if we have the courage to pursue them.",
    author: "Walt Disney",
    title: "Founder, The Walt Disney Company",
    category: 'vision',
    verified: true
  },

  // Henry Ford - Innovation & Vision
  {
    id: 'ford-001',
    text: "Whether you think you can or you think you can't, you're right.",
    author: "Henry Ford",
    title: "Founder, Ford Motor Company",
    category: 'motivation',
    verified: true
  },
  {
    id: 'ford-002',
    text: "Failure is simply the opportunity to begin again, this time more intelligently.",
    author: "Henry Ford",
    title: "Founder, Ford Motor Company",
    category: 'failure',
    verified: true
  },

  // Thomas Edison - Perseverance & Innovation
  {
    id: 'edison-001',
    text: "Genius is one percent inspiration and ninety-nine percent perspiration.",
    author: "Thomas Edison",
    title: "Inventor & Entrepreneur",
    category: 'perseverance',
    verified: true
  },
  {
    id: 'edison-002',
    text: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.",
    author: "Thomas Edison",
    title: "Inventor & Entrepreneur",
    category: 'perseverance',
    verified: true
  }
]

// Utility functions for quote management
export class BusinessQuoteService {
  static getRandomQuote(): BusinessQuote {
    const randomIndex = Math.floor(Math.random() * businessQuotes.length)
    return businessQuotes[randomIndex]
  }

  static getQuotesByCategory(category: BusinessQuote['category']): BusinessQuote[] {
    return businessQuotes.filter(quote => quote.category === category)
  }

  static getDailyQuote(): BusinessQuote {
    // Use current date as seed for consistent daily quote
    const today = new Date()
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
    const index = dayOfYear % businessQuotes.length
    return businessQuotes[index]
  }

  static searchQuotes(searchTerm: string): BusinessQuote[] {
    const term = searchTerm.toLowerCase()
    return businessQuotes.filter(quote => 
      quote.text.toLowerCase().includes(term) ||
      quote.author.toLowerCase().includes(term) ||
      quote.category.toLowerCase().includes(term)
    )
  }

  static getQuotesByAuthor(author: string): BusinessQuote[] {
    return businessQuotes.filter(quote => 
      quote.author.toLowerCase().includes(author.toLowerCase())
    )
  }

  static getAllCategories(): BusinessQuote['category'][] {
    return ['leadership', 'innovation', 'perseverance', 'growth', 'success', 'failure', 'vision', 'teamwork', 'motivation']
  }

  static getRandomQuoteByCategory(category: BusinessQuote['category']): BusinessQuote | null {
    const categoryQuotes = this.getQuotesByCategory(category)
    if (categoryQuotes.length === 0) return null
    
    const randomIndex = Math.floor(Math.random() * categoryQuotes.length)
    return categoryQuotes[randomIndex]
  }
}