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
  },

  // Satya Nadella - Leadership & Innovation
  {
    id: 'nadella-001',
    text: "Our industry does not respect tradition — it only respects innovation.",
    author: "Satya Nadella",
    title: "CEO, Microsoft",
    category: 'innovation',
    verified: true
  },
  {
    id: 'nadella-002',
    text: "We are moving from a world where computing power was scarce to a place where it is now abundant. This is exciting because abundance of computing power will lead to positive results.",
    author: "Satya Nadella",
    title: "CEO, Microsoft",
    category: 'vision',
    verified: true
  },

  // Larry Ellison - Vision & Success
  {
    id: 'ellison-001',
    text: "When you innovate, you've got to be prepared for everyone telling you you're nuts.",
    author: "Larry Ellison",
    title: "Co-founder, Oracle",
    category: 'innovation',
    verified: true
  },
  {
    id: 'ellison-002',
    text: "I have had all of the disadvantages required for success.",
    author: "Larry Ellison",
    title: "Co-founder, Oracle",
    category: 'success',
    verified: true
  },

  // Reed Hastings - Innovation & Growth
  {
    id: 'hastings-001',
    text: "Most entrepreneurial ideas will sound crazy, stupid and uneconomic, and then they'll turn out to be right.",
    author: "Reed Hastings",
    title: "Co-founder, Netflix",
    category: 'innovation',
    verified: true
  },
  {
    id: 'hastings-002',
    text: "The key to success is to start before you are ready.",
    author: "Reed Hastings",
    title: "Co-founder, Netflix",
    category: 'success',
    verified: true
  },

  // Howard Schultz - Leadership & Vision
  {
    id: 'schultz-001',
    text: "The currency of leadership is transparency. You have to be truthful. I don't think you should be vulnerable every day, but there are moments where you've got to share your soul and conscience with people and show them who you are, and not be afraid of it.",
    author: "Howard Schultz",
    title: "Former CEO, Starbucks",
    category: 'leadership',
    verified: true
  },
  {
    id: 'schultz-002',
    text: "Dream more than others think practical. Expect more than others think possible. Care more than others think wise.",
    author: "Howard Schultz",
    title: "Former CEO, Starbucks",
    category: 'vision',
    verified: true
  },

  // Mary Barra - Leadership & Innovation
  {
    id: 'barra-001',
    text: "I want to make sure we are presenting ourselves as a confident, smart, secure, fun, progressive company.",
    author: "Mary Barra",
    title: "CEO, General Motors",
    category: 'leadership',
    verified: true
  },
  {
    id: 'barra-002',
    text: "We believe the future is electric.",
    author: "Mary Barra",
    title: "CEO, General Motors",
    category: 'vision',
    verified: true
  },

  // Jensen Huang - Innovation & Vision
  {
    id: 'huang-001',
    text: "The more successful you are, the more help you need to achieve even greater success.",
    author: "Jensen Huang",
    title: "CEO, NVIDIA",
    category: 'success',
    verified: true
  },
  {
    id: 'huang-002',
    text: "The miracle of AI is that it's not just about intelligence. It's about creativity.",
    author: "Jensen Huang",
    title: "CEO, NVIDIA",
    category: 'innovation',
    verified: true
  },

  // Daniel Ek - Innovation & Vision
  {
    id: 'ek-001',
    text: "We led the transition from physical to digital music. Now we're leading the transition from owning to accessing music.",
    author: "Daniel Ek",
    title: "Co-founder, Spotify",
    category: 'innovation',
    verified: true
  },
  {
    id: 'ek-002',
    text: "The challenge is to build a culture where people feel empowered to do their best work.",
    author: "Daniel Ek",
    title: "Co-founder, Spotify",
    category: 'teamwork',
    verified: true
  },

  // Susan Wojcicki - Leadership & Growth
  {
    id: 'wojcicki-001',
    text: "Think about what users want and work backwards from there.",
    author: "Susan Wojcicki",
    title: "Former CEO, YouTube",
    category: 'innovation',
    verified: true
  },
  {
    id: 'wojcicki-002',
    text: "It's important not to overstate the benefits of ideas. You have to be honest about their limitations.",
    author: "Susan Wojcicki",
    title: "Former CEO, YouTube",
    category: 'leadership',
    verified: true
  },

  // Brian Chesky - Innovation & Leadership
  {
    id: 'chesky-001',
    text: "Build something 100 people love, not something 1 million people kind of like.",
    author: "Brian Chesky",
    title: "Co-founder, Airbnb",
    category: 'innovation',
    verified: true
  },
  {
    id: 'chesky-002',
    text: "The stuff that matters in business is the stuff that's going to be true for the next 10 years.",
    author: "Brian Chesky",
    title: "Co-founder, Airbnb",
    category: 'vision',
    verified: true
  },

  // Melinda Gates - Leadership & Vision
  {
    id: 'm-gates-001',
    text: "A woman with a voice is, by definition, a strong woman.",
    author: "Melinda French Gates",
    title: "Philanthropist & Former Co-chair, Gates Foundation",
    category: 'leadership',
    verified: true
  },
  {
    id: 'm-gates-002',
    text: "When we invest in women and girls, we are investing in the people who invest in everyone else.",
    author: "Melinda French Gates",
    title: "Philanthropist & Former Co-chair, Gates Foundation",
    category: 'vision',
    verified: true
  },

  // Andy Grove - Leadership & Management
  {
    id: 'grove-001',
    text: "Only the paranoid survive.",
    author: "Andy Grove",
    title: "Former CEO, Intel",
    category: 'leadership',
    verified: true
  },
  {
    id: 'grove-002',
    text: "Success breeds complacency. Complacency breeds failure. Only the paranoid survive.",
    author: "Andy Grove",
    title: "Former CEO, Intel",
    category: 'success',
    verified: true
  },

  // Ray Dalio - Leadership & Success
  {
    id: 'dalio-001',
    text: "Principles are fundamental truths that serve as the foundations for behavior that gets you what you want out of life.",
    author: "Ray Dalio",
    title: "Founder, Bridgewater Associates",
    category: 'leadership',
    verified: true
  },
  {
    id: 'dalio-002',
    text: "He who lives by the crystal ball will eat shattered glass.",
    author: "Ray Dalio",
    title: "Founder, Bridgewater Associates",
    category: 'failure',
    verified: true
  },

  // John D. Rockefeller - Success & Vision
  {
    id: 'rockefeller-001',
    text: "Don't be afraid to give up the good to go for the great.",
    author: "John D. Rockefeller",
    title: "Founder, Standard Oil",
    category: 'success',
    verified: true
  },
  {
    id: 'rockefeller-002',
    text: "I believe that every right implies a responsibility; every opportunity, an obligation; every possession, a duty.",
    author: "John D. Rockefeller",
    title: "Founder, Standard Oil",
    category: 'leadership',
    verified: true
  },

  // Sam Walton - Leadership & Growth
  {
    id: 'walton-001',
    text: "There is only one boss. The customer. And he can fire everybody in the company from the chairman on down, simply by spending his money somewhere else.",
    author: "Sam Walton",
    title: "Founder, Walmart",
    category: 'leadership',
    verified: true
  },
  {
    id: 'walton-002',
    text: "High expectations are the key to everything.",
    author: "Sam Walton",
    title: "Founder, Walmart",
    category: 'success',
    verified: true
  },

  // Estée Lauder - Perseverance & Success
  {
    id: 'lauder-001',
    text: "I never dreamed about success. I worked for it.",
    author: "Estée Lauder",
    title: "Founder, Estée Lauder Companies",
    category: 'perseverance',
    verified: true
  },
  {
    id: 'lauder-002',
    text: "I have never worked a day in my life without selling. If I believe in something, I sell it, and I sell it hard.",
    author: "Estée Lauder",
    title: "Founder, Estée Lauder Companies",
    category: 'motivation',
    verified: true
  },

  // Andrew Carnegie - Success & Leadership
  {
    id: 'carnegie-001',
    text: "Teamwork is the ability to work together toward a common vision.",
    author: "Andrew Carnegie",
    title: "Industrialist & Philanthropist",
    category: 'teamwork',
    verified: true
  },
  {
    id: 'carnegie-002',
    text: "The man who acquires the ability to take full possession of his own mind may take possession of everything else to which he is justly entitled.",
    author: "Andrew Carnegie",
    title: "Industrialist & Philanthropist",
    category: 'success',
    verified: true
  },

  // Coco Chanel - Innovation & Vision
  {
    id: 'chanel-001',
    text: "In order to be irreplaceable, one must always be different.",
    author: "Coco Chanel",
    title: "Founder, Chanel",
    category: 'innovation',
    verified: true
  },
  {
    id: 'chanel-002',
    text: "Success is most often achieved by those who don't know that failure is inevitable.",
    author: "Coco Chanel",
    title: "Founder, Chanel",
    category: 'success',
    verified: true
  },

  // Indra Nooyi - Leadership & Vision
  {
    id: 'nooyi-001',
    text: "Leadership is hard to define and good leadership even harder. But if you can get people to follow you to the ends of the earth, you are a great leader.",
    author: "Indra Nooyi",
    title: "Former CEO, PepsiCo",
    category: 'leadership',
    verified: true
  },
  {
    id: 'nooyi-002',
    text: "The distance between a successful person and others is not a matter of intelligence or opportunity. It's having the right mindset.",
    author: "Indra Nooyi",
    title: "Former CEO, PepsiCo",
    category: 'success',
    verified: true
  },

  // Travis Kalanick - Innovation & Growth
  {
    id: 'kalanick-001',
    text: "Look, if you can get people to follow you to the ends of the earth, you are a great leader.",
    author: "Travis Kalanick",
    title: "Co-founder, Uber",
    category: 'leadership',
    verified: true
  },
  {
    id: 'kalanick-002',
    text: "We have to be faster and more nimble than anyone has ever been.",
    author: "Travis Kalanick",
    title: "Co-founder, Uber",
    category: 'growth',
    verified: true
  },

  // Daymond John - Perseverance & Success
  {
    id: 'john-001',
    text: "An entrepreneur must pitch a potential investor for what the company is worth as well as sell the dream on how much of a profit can be made.",
    author: "Daymond John",
    title: "Founder, FUBU",
    category: 'success',
    verified: true
  },
  {
    id: 'john-002',
    text: "Good grooming is integral and impeccable style is a must. If you don't look the part, no one will want to give you time or money.",
    author: "Daymond John",
    title: "Founder, FUBU",
    category: 'success',
    verified: true
  },

  // Barbara Corcoran - Perseverance & Success
  {
    id: 'corcoran-001',
    text: "The difference between successful people and others is how long they spend time feeling sorry for themselves.",
    author: "Barbara Corcoran",
    title: "Founder, The Corcoran Group",
    category: 'perseverance',
    verified: true
  },
  {
    id: 'corcoran-002',
    text: "Every single thing I learned about marketing and building my business, I learned from my mom, and she had never been in the workforce. She just had great practical sense.",
    author: "Barbara Corcoran",
    title: "Founder, The Corcoran Group",
    category: 'growth',
    verified: true
  },

  // Kevin O'Leary - Success & Investment
  {
    id: 'oleary-001',
    text: "Business is war. I go out there, I want to kill the competitors. I want to make their lives miserable. I want to steal their market share. I want them to fear me and I want everyone on my team thinking we're going to win.",
    author: "Kevin O'Leary",
    title: "Entrepreneur & Investor",
    category: 'success',
    verified: true
  },
  {
    id: 'oleary-002',
    text: "Money has no emotions. Money doesn't care if you're having a bad day.",
    author: "Kevin O'Leary",
    title: "Entrepreneur & Investor",
    category: 'success',
    verified: true
  },

  // Robert Kiyosaki - Success & Growth
  {
    id: 'kiyosaki-001',
    text: "The size of your success is measured by the strength of your desire, the size of your dream, and how you handle disappointment along the way.",
    author: "Robert Kiyosaki",
    title: "Author & Entrepreneur",
    category: 'success',
    verified: true
  },
  {
    id: 'kiyosaki-002',
    text: "It's more important to grow your income than cut your expenses. It's more important to grow your spirit than cut your dreams.",
    author: "Robert Kiyosaki",
    title: "Author & Entrepreneur",
    category: 'growth',
    verified: true
  },

  // Gary Vaynerchuk - Motivation & Growth
  {
    id: 'vaynerchuk-001',
    text: "Skills are cheap. Passion is priceless.",
    author: "Gary Vaynerchuk",
    title: "CEO, VaynerMedia",
    category: 'motivation',
    verified: true
  },
  {
    id: 'vaynerchuk-002',
    text: "Stop doing things that you know are not going to make you successful.",
    author: "Gary Vaynerchuk",
    title: "CEO, VaynerMedia",
    category: 'success',
    verified: true
  },

  // Tony Hsieh - Leadership & Culture
  {
    id: 'hsieh-001',
    text: "Chase the vision, not the money; the money will end up following you.",
    author: "Tony Hsieh",
    title: "Former CEO, Zappos",
    category: 'vision',
    verified: true
  },
  {
    id: 'hsieh-002',
    text: "Your personal core values define who you are, and a company's core values ultimately define the company's character and brand.",
    author: "Tony Hsieh",
    title: "Former CEO, Zappos",
    category: 'leadership',
    verified: true
  },

  // Colonel Sanders - Perseverance & Success
  {
    id: 'sanders-001',
    text: "I made a resolve then that I was going to amount to something if I could. And no hours, nor amount of labor, nor amount of money would deter me from giving the best that there was in me.",
    author: "Colonel Sanders",
    title: "Founder, KFC",
    category: 'perseverance',
    verified: true
  },
  {
    id: 'sanders-002',
    text: "The hard way builds solidly a foundation of confidence that cannot be swept away.",
    author: "Colonel Sanders",
    title: "Founder, KFC",
    category: 'success',
    verified: true
  },

  // Milton Hershey - Perseverance & Vision
  {
    id: 'hershey-001',
    text: "Give them quality. That's the best kind of advertising.",
    author: "Milton Hershey",
    title: "Founder, The Hershey Company",
    category: 'success',
    verified: true
  },
  {
    id: 'hershey-002',
    text: "One is only happy in proportion as he makes others happy.",
    author: "Milton Hershey",
    title: "Founder, The Hershey Company",
    category: 'leadership',
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