// Shared business quotes service for both client and server
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
    text: "The most important investment you can make is in yourself.",
    author: "Warren Buffett",
    title: "CEO, Berkshire Hathaway",
    category: 'growth',
    verified: true
  },

  // Richard Branson - Innovation & Perseverance
  {
    id: 'branson-001',
    text: "Business opportunities are like buses, there's always another one coming.",
    author: "Richard Branson",
    title: "Founder, Virgin Group",
    category: 'success',
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
    text: "Work like there is someone working 24 hours a day to take it away from you.",
    author: "Mark Cuban",
    title: "Entrepreneur & Investor",
    category: 'motivation',
    verified: true
  },

  // Oprah Winfrey - Leadership & Vision
  {
    id: 'winfrey-001',
    text: "The biggest adventure you can take is to live the life of your dreams.",
    author: "Oprah Winfrey",
    title: "Media Executive & Philanthropist",
    category: 'vision',
    verified: true
  },
  {
    id: 'winfrey-002',
    text: "Turn your wounds into wisdom.",
    author: "Oprah Winfrey",
    title: "Media Executive & Philanthropist",
    category: 'growth',
    verified: true
  },

  // Reid Hoffman - Innovation & Teamwork
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
    category: 'innovation',
    verified: true
  },

  // Sara Blakely - Perseverance & Success
  {
    id: 'blakely-001',
    text: "Embrace what you don't know, especially in the beginning, because what you don't know can become your greatest asset.",
    author: "Sara Blakely",
    title: "Founder, Spanx",
    category: 'perseverance',
    verified: true
  },
  {
    id: 'blakely-002',
    text: "The power of failure is that it shows you that you survived.",
    author: "Sara Blakely",
    title: "Founder, Spanx",
    category: 'failure',
    verified: true
  },

  // Tony Robbins - Motivation & Growth
  {
    id: 'robbins-001',
    text: "The quality of your life is the quality of your relationships.",
    author: "Tony Robbins",
    title: "Life Coach & Entrepreneur",
    category: 'leadership',
    verified: true
  },
  {
    id: 'robbins-002',
    text: "Progress equals happiness.",
    author: "Tony Robbins",
    title: "Life Coach & Entrepreneur",
    category: 'motivation',
    verified: true
  },

  // Maya Angelou - Leadership & Vision (Business Applications)
  {
    id: 'angelou-001',
    text: "If you don't like something, change it. If you can't change it, change your attitude.",
    author: "Maya Angelou",
    title: "Author & Civil Rights Activist",
    category: 'leadership',
    verified: true
  },
  {
    id: 'angelou-002',
    text: "Nothing can dim the light that shines from within.",
    author: "Maya Angelou",
    title: "Author & Civil Rights Activist",
    category: 'motivation',
    verified: true
  },

  // Additional High-Impact Business Quotes
  {
    id: 'business-001',
    text: "Great things never come from comfort zones.",
    author: "Neil Strauss",
    title: "Author & Entrepreneur",
    category: 'growth',
    verified: true
  },
  {
    id: 'business-002',
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    title: "Former Prime Minister",
    category: 'perseverance',
    verified: true
  },
  {
    id: 'business-003',
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    title: "Founder, Disney",
    category: 'motivation',
    verified: true
  },
  {
    id: 'business-004',
    text: "Opportunities don't happen. You create them.",
    author: "Chris Grosser",
    title: "Entrepreneur",
    category: 'success',
    verified: true
  },
  {
    id: 'business-005',
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
    title: "Leader & Philosopher",
    category: 'vision',
    verified: true
  }
]

// Centralized business quotes service
export class BusinessQuoteService {
  static getRandomQuote(): BusinessQuote {
    const randomIndex = Math.floor(Math.random() * businessQuotes.length)
    return businessQuotes[randomIndex]
  }

  static getQuotesByCategory(category: BusinessQuote['category']): BusinessQuote[] {
    return businessQuotes.filter(quote => quote.category === category)
  }

  // Daily quote that rotates consistently based on date
  static getDailyQuote(date?: Date): BusinessQuote {
    const today = date || new Date()
    // Calculate day of year for consistent daily selection
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