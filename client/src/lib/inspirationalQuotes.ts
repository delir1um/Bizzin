interface QuoteTemplate {
  text: string
  author: string
  namePosition?: 'start' | 'middle' | 'end'
  category: 'success' | 'entrepreneurship' | 'perseverance' | 'innovation' | 'growth'
}

const QUOTE_TEMPLATES: QuoteTemplate[] = [
  // Success & Achievement
  {
    text: "Success is not final, failure is not fatal, {name}. It is the courage to continue that counts.",
    author: "Winston Churchill",
    namePosition: 'middle',
    category: 'success'
  },
  {
    text: "{name}, your only limit is your mind. Dream big, plan smart, execute relentlessly.",
    author: "Unknown",
    namePosition: 'start',
    category: 'success'
  },
  {
    text: "The way to get started is to quit talking and begin doing, {name}.",
    author: "Walt Disney",
    namePosition: 'end',
    category: 'success'
  },
  
  // Entrepreneurship
  {
    text: "Innovation distinguishes between a leader and a follower, {name}. Keep pushing boundaries.",
    author: "Steve Jobs",
    namePosition: 'middle',
    category: 'innovation'
  },
  {
    text: "{name}, your business is only as strong as your weakest link. Strengthen every aspect.",
    author: "Unknown",
    namePosition: 'start',
    category: 'entrepreneurship'
  },
  {
    text: "Don't be afraid to give up the good to go for the great, {name}.",
    author: "John D. Rockefeller",
    namePosition: 'end',
    category: 'growth'
  },
  
  // Perseverance
  {
    text: "Success is walking from failure to failure with no loss of enthusiasm, {name}.",
    author: "Winston Churchill",
    namePosition: 'end',
    category: 'perseverance'
  },
  {
    text: "{name}, every master was once a disaster. Keep learning, keep growing.",
    author: "T. Harv Eker",
    namePosition: 'start',
    category: 'growth'
  },
  {
    text: "The difference between ordinary and extraordinary is that little 'extra', {name}.",
    author: "Jimmy Johnson",
    namePosition: 'end',
    category: 'success'
  },
  
  // Innovation & Growth
  {
    text: "Innovation is the ability to see change as an opportunity, not a threat, {name}.",
    author: "Steve Jobs",
    namePosition: 'end',
    category: 'innovation'
  },
  {
    text: "{name}, if you're not growing, you're dying. Embrace change and adapt.",
    author: "Tony Robbins",
    namePosition: 'start',
    category: 'growth'
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now, {name}.",
    author: "Chinese Proverb",
    namePosition: 'end',
    category: 'entrepreneurship'
  },
  
  // Leadership & Vision
  {
    text: "{name}, a leader is one who knows the way, goes the way, and shows the way.",
    author: "John C. Maxwell",
    namePosition: 'start',
    category: 'entrepreneurship'
  },
  {
    text: "Vision without action is merely a dream. Action without vision just passes the time. Vision with action can change the world, {name}.",
    author: "Joel A. Barker",
    namePosition: 'end',
    category: 'innovation'
  },
  {
    text: "Opportunities don't happen, {name}. You create them through preparation and hard work.",
    author: "Chris Grosser",
    namePosition: 'middle',
    category: 'entrepreneurship'
  },
  
  // Resilience
  {
    text: "{name}, fall seven times, stand up eight. Resilience is your greatest asset.",
    author: "Japanese Proverb",
    namePosition: 'start',
    category: 'perseverance'
  },
  {
    text: "Success is not about avoiding failure, {name}. It's about learning from it faster than your competition.",
    author: "Unknown",
    namePosition: 'middle',
    category: 'growth'
  },
  {
    text: "The only impossible journey is the one you never begin, {name}.",
    author: "Tony Robbins",
    namePosition: 'end',
    category: 'success'
  }
]

export class InspirationalQuotes {
  private static getRandomQuote(): QuoteTemplate {
    const randomIndex = Math.floor(Math.random() * QUOTE_TEMPLATES.length)
    return QUOTE_TEMPLATES[randomIndex]
  }
  
  private static getDailyQuote(): QuoteTemplate {
    // Use current date as seed for consistent daily quote
    const today = new Date()
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    const index = dayOfYear % QUOTE_TEMPLATES.length
    return QUOTE_TEMPLATES[index]
  }
  
  private static formatName(email: string): string {
    if (!email) return 'Entrepreneur'
    
    const name = email.split('@')[0]
    
    // Handle common email patterns
    if (name.includes('.')) {
      const parts = name.split('.')
      return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    }
    
    if (name.includes('_')) {
      const parts = name.split('_')
      return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    }
    
    // Just capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1)
  }
  
  private static personalizeQuote(template: QuoteTemplate, userEmail: string): { text: string; author: string } {
    const formattedName = this.formatName(userEmail)
    const personalizedText = template.text.replace('{name}', formattedName)
    
    return {
      text: personalizedText,
      author: template.author
    }
  }
  
  public static getDailyInspiration(userEmail: string): { text: string; author: string; category: string } {
    const template = this.getDailyQuote()
    const personalized = this.personalizeQuote(template, userEmail)
    
    return {
      ...personalized,
      category: template.category
    }
  }
  
  public static getRandomInspiration(userEmail: string): { text: string; author: string; category: string } {
    const template = this.getRandomQuote()
    const personalized = this.personalizeQuote(template, userEmail)
    
    return {
      ...personalized,
      category: template.category
    }
  }
  
  public static getQuotesByCategory(category: QuoteTemplate['category'], userEmail: string): { text: string; author: string; category: string }[] {
    const categoryQuotes = QUOTE_TEMPLATES.filter(quote => quote.category === category)
    
    return categoryQuotes.map(template => {
      const personalized = this.personalizeQuote(template, userEmail)
      return {
        ...personalized,
        category: template.category
      }
    })
  }
}