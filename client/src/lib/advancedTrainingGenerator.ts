// Advanced training data generator for complex business journal scenarios
// This expands our training dataset to cover longer, more nuanced business entries

import { TrainingExample } from './aiTrainingData';

// Template-based training data generation for comprehensive coverage
export class AdvancedTrainingGenerator {
  
  // Generate training data for various business contexts and entry lengths
  static generateComprehensiveTrainingData(): TrainingExample[] {
    const generatedData: TrainingExample[] = [];
    
    // Long-form strategic planning entries
    const strategicPlanningTemplates = [
      {
        text: `Quarterly business review completed. Revenue growth of 35% YoY, but customer acquisition cost increased 22%. Key insights: our enterprise sales cycle is lengthening (average 4.2 months vs 3.1 last year), but deal sizes are 60% larger. Marketing attribution shows content marketing driving 40% of qualified leads, while paid acquisition effectiveness declining. Strategic decisions: 1) Increase content team by 2 people, 2) Restructure enterprise sales process with dedicated solution architects, 3) Implement customer success program to reduce churn from 8% to 5%. Board presentation scheduled for next Thursday with detailed financial projections.`,
        expected_category: "Planning" as const,
        expected_mood: "Analytical",
        expected_energy: "medium" as const,
        confidence_range: [85, 95] as [number, number],
        business_context: "Comprehensive quarterly business analysis with strategic decision-making"
      },
      {
        text: `Working on our Series A fundraising strategy. Target raise: $8M at $40M pre-money valuation. Have completed financial model showing path to $50M ARR by 2026. Key metrics investors want: 150% net revenue retention, <6 month payback period, 25%+ gross margins. Identified 12 target VCs with portfolio alignment. Pitch deck narrative focuses on market size ($12B TAM), our unique AI differentiation, and proven enterprise traction. Legal prep starting next week with Wilson Sonsini. Timeline: pitch in January, close by March. Feeling confident but know fundraising is always unpredictable.`,
        expected_category: "Planning" as const,
        expected_mood: "Focused",
        expected_energy: "high" as const,
        confidence_range: [80, 90] as [number, number],
        business_context: "Venture capital fundraising strategy and preparation process"
      }
    ];

    // Complex challenge scenarios with multiple dimensions
    const complexChallengeTemplates = [
      {
        text: `Major crisis today. Our biggest client (30% of revenue) called an emergency meeting threatening contract termination over data privacy concerns. Apparently, a security researcher discovered our API was logging more user data than disclosed in our privacy policy. Legal implications are significant - potential GDPR violations, class action risk, regulatory scrutiny. Immediate actions: 1) Engaged outside counsel specializing in data privacy, 2) Conducted internal audit of all data handling practices, 3) Prepared incident response plan, 4) Scheduled all-hands meeting to address team concerns. The good news is we've always been committed to user privacy, this was a documentation gap not malicious collection. But the damage to trust and potential financial impact is keeping me awake. Crisis management mode for the next few weeks.`,
        expected_category: "Challenge" as const,
        expected_mood: "Stressed",
        expected_energy: "low" as const,
        confidence_range: [90, 95] as [number, number],
        business_context: "Major compliance crisis requiring comprehensive legal and operational response"
      },
      {
        text: `Team conflict reached boiling point today. Our VP of Engineering and VP of Product have been disagreeing on technical architecture decisions for months, and it's affecting the entire development team. Engineering wants to refactor our core platform for scalability, Product wants to ship new features to meet Q4 commitments. The tension has created two camps in the company, and productivity is suffering. I've scheduled separate 1:1s with both VPs tomorrow, followed by a three-way meeting to align on priorities. This is testing my leadership - I need to make a decision that serves the business while maintaining team cohesion. Considering bringing in an executive coach to help navigate this dynamic.`,
        expected_category: "Challenge" as const,
        expected_mood: "Frustrated",
        expected_energy: "medium" as const,
        confidence_range: [85, 90] as [number, number],
        business_context: "Executive team conflict requiring diplomatic leadership and strategic prioritization"
      }
    ];

    // Extended achievement narratives
    const achievementTemplates = [
      {
        text: `Incredible milestone achieved! We just crossed $10M in annual recurring revenue, exactly 3 years after our first dollar of revenue. Looking back at the journey: Year 1 - struggled to find product-market fit, pivoted twice, nearly ran out of money. Year 2 - found our niche in mid-market SaaS, hired our first enterprise sales rep, scaled to $2M ARR. Year 3 - expanded to Europe, launched enterprise tier, grew team to 45 people. The metrics that matter: 130% net revenue retention, 15% month-over-month growth, 92% gross revenue retention. What I'm most proud of is building a sustainable business that genuinely helps our customers succeed. The team celebration tonight will be special - everyone contributed to this milestone.`,
        expected_category: "Achievement" as const,
        expected_mood: "Accomplished",
        expected_energy: "high" as const,
        confidence_range: [95, 95] as [number, number],
        business_context: "Major revenue milestone reflecting multi-year business building journey"
      }
    ];

    // Research and analysis scenarios
    const researchTemplates = [
      {
        text: `Deep competitive analysis completed for our Q1 strategy. Analyzed 8 direct competitors and 12 adjacent players. Key findings: 1) Market consolidation accelerating - 3 major acquisitions in past 6 months, 2) AI integration becoming table stakes - all major players launched AI features in 2024, 3) Pricing pressure from emerging startups offering 60% lower pricing, 4) Enterprise buyers increasingly focused on integration capabilities. Our competitive advantages: superior data accuracy (measured 23% better than closest competitor), faster implementation (average 2 weeks vs industry 8 weeks), stronger customer success metrics. Vulnerabilities: limited integration ecosystem, higher price point, smaller brand recognition. Strategic recommendations: prioritize integration partnerships, develop mid-market pricing tier, increase content marketing investment.`,
        expected_category: "Research" as const,
        expected_mood: "Analytical",
        expected_energy: "medium" as const,
        confidence_range: [85, 95] as [number, number],
        business_context: "Comprehensive competitive intelligence analysis informing strategic planning"
      }
    ];

    // Learning from failure scenarios
    const learningTemplates = [
      {
        text: `Post-mortem on our failed product launch. "Smart Analytics Dashboard" launched 6 weeks ago with high expectations but adoption is only 12% of target. Root cause analysis reveals multiple issues: 1) Feature complexity - users needed 3+ hours of training vs our assumption of intuitive design, 2) Integration friction - setup process took average 5 days instead of promised "minutes", 3) Value proposition mismatch - we built what we thought was needed vs what customers actually wanted, 4) Poor change management - didn't adequately prepare existing users for workflow changes. Customer interviews reveal they want simplicity over sophistication, automation over customization. Key learnings: validate assumptions earlier, invest more in user research, simplify feature scope, improve onboarding experience. Silver lining: the underlying data processing improvements increased overall platform performance by 40%. Planning v2.0 with radically simplified UX.`,
        expected_category: "Learning" as const,
        expected_mood: "Reflective",
        expected_energy: "medium" as const,
        confidence_range: [85, 90] as [number, number],
        business_context: "Comprehensive product failure analysis yielding strategic insights"
      }
    ];

    // Growth and expansion scenarios
    const growthTemplates = [
      {
        text: `International expansion progressing faster than expected. European operations now generating €2.1M ARR (28% of total revenue), with particularly strong traction in Germany and Netherlands. Key success factors: 1) Local partnerships with established system integrators, 2) GDPR-compliant infrastructure from day one, 3) Multi-language product localization, 4) European-based customer success team. Challenges overcome: complex VAT compliance across 6 countries, cultural differences in sales approach (relationship-building vs efficiency focus), longer sales cycles due to procurement processes. Next phase: evaluating expansion into Asia-Pacific, starting with Australia and Singapore. Hiring country manager for APAC based in Sydney. Board approved additional $3M investment for international growth. Exciting to see our vision becoming global reality.`,
        expected_category: "Growth" as const,
        expected_mood: "Excited",
        expected_energy: "high" as const,
        confidence_range: [90, 95] as [number, number],
        business_context: "Successful international business expansion with operational insights"
      }
    ];

    // Combine all templates
    generatedData.push(...strategicPlanningTemplates);
    generatedData.push(...complexChallengeTemplates);
    generatedData.push(...achievementTemplates);
    generatedData.push(...researchTemplates);
    generatedData.push(...learningTemplates);
    generatedData.push(...growthTemplates);

    return generatedData;
  }

  // Generate industry-specific training data
  static generateIndustrySpecificData(): TrainingExample[] {
    const industryData: TrainingExample[] = [];

    // SaaS/Tech specific scenarios
    const saasScenarios = [
      {
        text: `Churn analysis reveals concerning trend. Monthly churn rate increased from 3.2% to 4.8% over past quarter. Cohort analysis shows problem concentrated in small business segment (5-50 employees). Exit surveys indicate primary reasons: 1) Product too complex for basic needs (31%), 2) Better pricing from competitors (28%), 3) Integration challenges (22%). Response strategy: develop "SaaS Lite" tier with simplified features, implement in-app guidance system, create dedicated SMB customer success track. Also launching win-back campaign for recently churned accounts. Goal: reduce churn to sub-3% by end of Q1. This is critical for our unit economics and Series A metrics.`,
        expected_category: "Challenge" as const,
        expected_mood: "Concerned",
        expected_energy: "medium" as const,
        confidence_range: [85, 95] as [number, number],
        business_context: "SaaS churn analysis and retention strategy development"
      }
    ];

    // E-commerce specific scenarios
    const ecommerceScenarios = [
      {
        text: `Holiday season performance exceeded all expectations. Black Friday through Cyber Monday generated $2.3M in revenue (340% increase vs same period last year). Key metrics: 12% conversion rate (vs 8% typical), $89 average order value (vs $67 typical), 15% cart abandonment rate (vs 22% typical). Success factors: 1) Early inventory planning prevented stockouts, 2) Mobile-optimized checkout reduced friction, 3) Influencer partnerships drove 35% of new customer acquisition, 4) Email marketing campaigns achieved 31% open rates. Post-holiday customer retention will be crucial - implementing loyalty program and personalized follow-up campaigns. Already planning for next year with expanded product lines and international shipping capabilities.`,
        expected_category: "Achievement" as const,
        expected_mood: "Accomplished",
        expected_energy: "high" as const,
        confidence_range: [90, 95] as [number, number],
        business_context: "E-commerce seasonal performance analysis and future planning"
      }
    ];

    industryData.push(...saasScenarios);
    industryData.push(...ecommerceScenarios);

    return industryData;
  }

  // Generate emotional complexity scenarios
  static generateEmotionalComplexityData(): TrainingExample[] {
    return [
      {
        text: `Mixed emotions today. Received acquisition offer from major competitor - $45M all cash, which is 3x our current revenue and would provide incredible returns for investors and employees. Team is excited about potential, but I'm conflicted. We've built something special here - unique culture, innovative product vision, potential for much larger impact. Acquisition would accelerate growth but potentially lose our identity. Discussed with co-founder and we're aligned on exploring the offer while staying true to our mission. Scheduled management team discussion for tomorrow. Whatever we decide, want to ensure it's best for everyone who believed in this journey. Success brings complicated decisions.`,
        expected_category: "Challenge" as const,
        expected_mood: "Conflicted",
        expected_energy: "medium" as const,
        confidence_range: [80, 90] as [number, number],
        business_context: "Acquisition offer evaluation requiring complex strategic and emotional considerations"
      },
      {
        text: `Proud but exhausted. Just completed our most successful product launch ever - 2,500 sign-ups in first week, 89% positive user feedback, featured in TechCrunch and Product Hunt #1 for the day. Team worked incredibly hard, and it shows. But I'm feeling the weight of leadership more than usual. Success brings pressure - investor expectations rising, team looking to me for next big vision, customers depending on our reliability. Sometimes I miss the early days when everything was simpler. Taking weekend off to recharge and reflect on what we've accomplished. Grateful for this journey, even when it's overwhelming.`,
        expected_category: "Achievement" as const,
        expected_mood: "Grateful",
        expected_energy: "medium" as const,
        confidence_range: [75, 85] as [number, number],
        business_context: "Product launch success coupled with leadership reflection and gratitude"
      }
    ];
  }

  // Get all enhanced training data
  static getAllEnhancedTrainingData(): TrainingExample[] {
    return [
      ...this.generateComprehensiveTrainingData(),
      ...this.generateIndustrySpecificData(),
      ...this.generateEmotionalComplexityData()
    ];
  }
}

// Export enhanced training dataset
export const ENHANCED_BUSINESS_TRAINING_DATA = AdvancedTrainingGenerator.getAllEnhancedTrainingData();

// Statistics about our training data coverage
export const TRAINING_DATA_STATS = {
  totalExamples: ENHANCED_BUSINESS_TRAINING_DATA.length,
  averageWordCount: ENHANCED_BUSINESS_TRAINING_DATA.reduce((sum, example) => 
    sum + example.text.split(' ').length, 0) / ENHANCED_BUSINESS_TRAINING_DATA.length,
  categoryDistribution: ENHANCED_BUSINESS_TRAINING_DATA.reduce((acc, example) => {
    acc[example.expected_category] = (acc[example.expected_category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  complexityLevels: {
    short: ENHANCED_BUSINESS_TRAINING_DATA.filter(e => e.text.split(' ').length < 50).length,
    medium: ENHANCED_BUSINESS_TRAINING_DATA.filter(e => e.text.split(' ').length >= 50 && e.text.split(' ').length < 150).length,
    long: ENHANCED_BUSINESS_TRAINING_DATA.filter(e => e.text.split(' ').length >= 150).length
  }
};