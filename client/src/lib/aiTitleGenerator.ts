// Advanced AI-powered title generation for business journal entries
// Creates compelling, contextual titles that capture the essence of business experiences

export interface TitleGenerationContext {
  content: string;
  category: string;
  mood: string;
  energy: 'high' | 'medium' | 'low';
  businessContext: string;
  keyInsights: string[];
}

export class BusinessTitleGenerator {
  
  // Generate compelling titles based on business context and sentiment
  static generateTitle(context: TitleGenerationContext): string {
    const { content, category, mood, energy, businessContext } = context;
    
    // Extract key business elements from content
    const businessElements = this.extractBusinessElements(content);
    const titleTemplates = this.getTitleTemplates(category, mood, energy);
    
    // Generate multiple title options and select the best one
    const titleOptions = titleTemplates.map(template => 
      this.populateTemplate(template, businessElements, content)
    );
    
    // Return the most compelling title based on business relevance
    return this.selectBestTitle(titleOptions, businessElements);
  }

  // Extract key business elements from journal content
  private static extractBusinessElements(content: string): any {
    const lowerContent = content.toLowerCase();
    
    // Financial indicators
    const financialTerms = ['revenue', 'profit', 'loss', 'cash flow', 'funding', 'investment', 'cost', 'budget', 'sales'];
    const foundFinancial = financialTerms.find(term => lowerContent.includes(term));
    
    // People/team indicators
    const peopleTerms = ['team', 'employee', 'hire', 'fired', 'client', 'customer', 'partner', 'investor'];
    const foundPeople = peopleTerms.find(term => lowerContent.includes(term));
    
    // Product/service indicators
    const productTerms = ['product', 'feature', 'launch', 'release', 'development', 'design', 'platform', 'service'];
    const foundProduct = productTerms.find(term => lowerContent.includes(term));
    
    // Strategic indicators
    const strategyTerms = ['strategy', 'plan', 'goal', 'milestone', 'target', 'growth', 'expansion', 'market'];
    const foundStrategy = strategyTerms.find(term => lowerContent.includes(term));
    
    // Challenge indicators
    const challengeTerms = ['problem', 'issue', 'challenge', 'difficulty', 'struggle', 'crisis', 'failure', 'setback'];
    const foundChallenge = challengeTerms.find(term => lowerContent.includes(term));
    
    // Success indicators
    const successTerms = ['success', 'achievement', 'accomplished', 'breakthrough', 'milestone', 'victory', 'win'];
    const foundSuccess = successTerms.find(term => lowerContent.includes(term));
    
    // Extract numbers/metrics
    const numberMatches = content.match(/\d+[%$]?[\w\s]*(?:increase|decrease|growth|revenue|profit|clients?|users?|months?)/gi);
    const metrics = numberMatches ? numberMatches[0] : null;
    
    return {
      financial: foundFinancial,
      people: foundPeople,
      product: foundProduct,
      strategy: foundStrategy,
      challenge: foundChallenge,
      success: foundSuccess,
      metrics,
      wordCount: content.split(' ').length
    };
  }

  // Get title templates based on category, mood, and energy
  private static getTitleTemplates(category: string, mood: string, energy: string): string[] {
    const templates: Record<string, string[]> = {
      Growth: [
        "Scaling New Heights: {business_focus}",
        "Growth Momentum: {key_achievement}",
        "Expanding Horizons: {strategic_move}",
        "Building Forward: {growth_insight}",
        "Next Level: {business_milestone}",
        "Rising Trajectory: {success_metric}",
        "Growth Insights: {strategic_learning}",
        "Momentum Building: {business_progress}"
      ],
      Challenge: [
        "Navigating Challenges: {obstacle_faced}",
        "Overcoming Obstacles: {challenge_type}",
        "Tough Decisions: {difficult_situation}",
        "Crisis Management: {business_challenge}",
        "Learning Through Adversity: {struggle_insight}",
        "Pushing Through: {challenge_response}",
        "Finding Solutions: {problem_solving}",
        "Resilience Test: {challenge_outcome}"
      ],
      Achievement: [
        "Milestone Reached: {achievement_type}",
        "Victory Celebration: {success_story}",
        "Breaking Through: {breakthrough_moment}",
        "Achievement Unlocked: {accomplishment}",
        "Success Story: {positive_outcome}",
        "Winning Moment: {victory_details}",
        "Breakthrough Success: {major_win}",
        "Achievement Reflection: {success_impact}"
      ],
      Planning: [
        "Strategic Planning: {planning_focus}",
        "Charting the Course: {strategic_direction}",
        "Future Vision: {planning_insights}",
        "Strategic Thinking: {business_strategy}",
        "Planning Session: {strategic_decisions}",
        "Road Map Development: {planning_outcome}",
        "Strategic Focus: {planning_priorities}",
        "Vision Alignment: {strategic_planning}"
      ],
      Learning: [
        "Key Insights: {learning_focus}",
        "Lessons Learned: {insight_gained}",
        "Learning Curve: {educational_experience}",
        "Reflection Time: {learning_outcome}",
        "Understanding Deeper: {insight_type}",
        "Growth Through Learning: {educational_insight}",
        "Wisdom Gained: {learning_reflection}",
        "Learning Journey: {insight_development}"
      ],
      Research: [
        "Market Intelligence: {research_topic}",
        "Deep Dive Analysis: {research_focus}",
        "Research Findings: {investigation_results}",
        "Competitive Insights: {research_outcome}",
        "Data Discovery: {research_insights}",
        "Market Research: {analytical_findings}",
        "Investigation Results: {research_conclusions}",
        "Analysis Complete: {research_summary}"
      ]
    };

    // Get category-specific templates, fallback to generic if not found
    const categoryTemplates = templates[category] || templates.Growth;
    
    // Filter templates based on mood and energy for better matching
    if (energy === 'high' && (mood === 'Excited' || mood === 'Confident')) {
      return categoryTemplates.filter(template => 
        template.includes('Momentum') || template.includes('Breaking') || template.includes('Victory')
      ).concat(categoryTemplates.slice(0, 3));
    }
    
    if (energy === 'low' && (mood === 'Stressed' || mood === 'Frustrated')) {
      return categoryTemplates.filter(template => 
        template.includes('Navigating') || template.includes('Learning') || template.includes('Reflection')
      ).concat(categoryTemplates.slice(0, 3));
    }
    
    return categoryTemplates;
  }

  // Populate template with extracted business elements
  private static populateTemplate(template: string, elements: any, content: string): string {
    let populatedTitle = template;
    
    // Replace placeholders with extracted elements
    const replacements: Record<string, string> = {
      '{business_focus}': elements.product || elements.strategy || 'Business Development',
      '{key_achievement}': elements.success || elements.metrics || 'Strategic Progress',
      '{strategic_move}': elements.strategy || elements.product || 'Strategic Initiative', 
      '{growth_insight}': elements.financial || elements.people || 'Growth Strategy',
      '{business_milestone}': elements.metrics || elements.success || 'Key Milestone',
      '{success_metric}': elements.metrics || 'Performance Gains',
      '{strategic_learning}': elements.strategy || 'Strategic Insights',
      '{business_progress}': elements.financial || elements.product || 'Business Progress',
      
      '{obstacle_faced}': elements.challenge || 'Business Challenges',
      '{challenge_type}': elements.financial || elements.people || 'Operational Challenge',
      '{difficult_situation}': elements.challenge || 'Complex Situation',
      '{business_challenge}': elements.financial || elements.product || 'Business Crisis',
      '{struggle_insight}': elements.challenge || 'Challenge Response',
      '{challenge_response}': 'Problem Solving',
      '{problem_solving}': elements.challenge || 'Solution Finding',
      '{challenge_outcome}': 'Challenge Navigation',
      
      '{achievement_type}': elements.success || elements.metrics || 'Major Achievement',
      '{success_story}': elements.financial || elements.product || 'Success Journey',
      '{breakthrough_moment}': elements.success || 'Breakthrough Win',
      '{accomplishment}': elements.metrics || elements.success || 'Key Accomplishment',
      '{positive_outcome}': elements.financial || 'Positive Results',
      '{victory_details}': elements.success || 'Victory Story',
      '{major_win}': elements.metrics || 'Significant Win',
      '{success_impact}': elements.success || 'Achievement Impact',
      
      '{planning_focus}': elements.strategy || 'Strategic Planning',
      '{strategic_direction}': elements.strategy || 'Future Direction',
      '{planning_insights}': elements.strategy || 'Planning Insights',
      '{business_strategy}': elements.strategy || 'Strategic Approach',
      '{strategic_decisions}': elements.strategy || 'Key Decisions',
      '{planning_outcome}': elements.strategy || 'Planning Results',
      '{planning_priorities}': elements.strategy || 'Strategic Priorities',
      '{strategic_planning}': elements.strategy || 'Strategic Vision',
      
      '{learning_focus}': elements.challenge || elements.success || 'Key Learning',
      '{insight_gained}': 'Important Insights',
      '{educational_experience}': 'Learning Experience',
      '{learning_outcome}': 'Growth Insights',
      '{insight_type}': 'Business Insights',
      '{educational_insight}': 'Learning Outcomes',
      '{learning_reflection}': 'Reflective Learning',
      '{insight_development}': 'Insight Development',
      
      '{research_topic}': elements.strategy || elements.product || 'Market Analysis',
      '{research_focus}': elements.strategy || 'Research Focus',
      '{investigation_results}': 'Research Results',
      '{research_outcome}': 'Analysis Outcome',
      '{research_insights}': 'Research Insights',
      '{analytical_findings}': 'Key Findings',
      '{research_conclusions}': 'Research Conclusions',
      '{research_summary}': 'Analysis Summary'
    };
    
    // Replace all placeholders
    Object.entries(replacements).forEach(([placeholder, replacement]) => {
      populatedTitle = populatedTitle.replace(placeholder, replacement);
    });
    
    // Clean up and ensure proper capitalization
    return this.cleanTitle(populatedTitle);
  }

  // Select the best title from options based on business relevance
  private static selectBestTitle(titleOptions: string[], elements: any): string {
    // Score titles based on how well they match the business content
    const scoredTitles = titleOptions.map(title => ({
      title,
      score: this.scoreTitleRelevance(title, elements)
    }));
    
    // Return the highest-scoring title
    scoredTitles.sort((a, b) => b.score - a.score);
    return scoredTitles[0].title;
  }

  // Score title relevance based on business elements
  private static scoreTitleRelevance(title: string, elements: any): number {
    let score = 0;
    
    // Higher score for titles that mention specific business elements
    if (elements.metrics && title.includes('Metric')) score += 3;
    if (elements.financial && (title.includes('Growth') || title.includes('Revenue'))) score += 3;
    if (elements.success && (title.includes('Achievement') || title.includes('Success'))) score += 3;
    if (elements.challenge && (title.includes('Challenge') || title.includes('Navigation'))) score += 3;
    if (elements.strategy && title.includes('Strategic')) score += 2;
    if (elements.product && (title.includes('Development') || title.includes('Launch'))) score += 2;
    if (elements.people && (title.includes('Team') || title.includes('Leadership'))) score += 2;
    
    // Prefer shorter, more impactful titles
    const wordCount = title.split(' ').length;
    if (wordCount <= 4) score += 2;
    else if (wordCount <= 6) score += 1;
    
    return score;
  }

  // Clean and format the final title
  private static cleanTitle(title: string): string {
    // Remove extra spaces and ensure proper capitalization
    return title
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, l => l.toUpperCase()) // Title case
      .substring(0, 60); // Limit length
  }

  // Generate multiple title suggestions
  static generateTitleSuggestions(context: TitleGenerationContext): string[] {
    const businessElements = this.extractBusinessElements(context.content);
    const templates = this.getTitleTemplates(context.category, context.mood, context.energy);
    
    return templates
      .slice(0, 5) // Get top 5 templates
      .map(template => this.populateTemplate(template, businessElements, context.content))
      .map(title => this.cleanTitle(title));
  }
}

// Quick title generation for simple cases
export function generateBusinessTitle(
  content: string, 
  category: string = 'Growth', 
  mood: string = 'Focused',
  energy: 'high' | 'medium' | 'low' = 'medium'
): string {
  const context: TitleGenerationContext = {
    content,
    category,
    mood,
    energy,
    businessContext: 'General business context',
    keyInsights: []
  };
  
  return BusinessTitleGenerator.generateTitle(context);
}