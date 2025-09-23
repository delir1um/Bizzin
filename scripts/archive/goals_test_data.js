// Test Goals Data - 20 Real Business Scenarios
// Testing Goals feature with authentic entrepreneur objectives

const testGoals = [
  {
    title: "Increase Monthly Recurring Revenue to $10K",
    description: "Scale our SaaS platform from current $3,500 MRR to $10,000 MRR through customer acquisition and retention strategies",
    deadline: "2025-12-31",
    priority: "high",
    category: "Revenue",
    status: "in_progress",
    progress: 35,
    target_value: 10000,
    current_value: 3500
  },
  {
    title: "Launch AI-powered analytics dashboard",
    description: "Complete development and release of the new analytics dashboard with AI insights for customer behavior analysis",
    deadline: "2025-09-15",
    priority: "high",
    category: "Product",
    status: "in_progress",
    progress: 65
  },
  {
    title: "Hire Senior Frontend Developer",
    description: "Recruit and onboard an experienced React/TypeScript developer to accelerate product development",
    deadline: "2025-08-31",
    priority: "high",
    category: "Team",
    status: "not_started",
    progress: 0
  },
  {
    title: "Achieve 95% customer satisfaction score",
    description: "Improve customer support response times and product quality to reach 95% satisfaction in quarterly surveys",
    deadline: "2025-10-31",
    priority: "medium",
    category: "Customer Success",
    status: "in_progress",
    progress: 78,
    target_value: 95,
    current_value: 78
  },
  {
    title: "Reduce customer churn rate to below 3%",
    description: "Implement retention strategies and improve onboarding to decrease monthly churn from 8% to under 3%",
    deadline: "2025-11-30",
    priority: "high",
    category: "Retention",
    status: "in_progress",
    progress: 45,
    target_value: 3,
    current_value: 5.2
  },
  {
    title: "Complete Series A funding round",
    description: "Raise $2M Series A funding to scale operations and expand market reach",
    deadline: "2025-12-15",
    priority: "high",
    category: "Funding",
    status: "not_started",
    progress: 15
  },
  {
    title: "Launch mobile app for iOS and Android",
    description: "Develop and release native mobile applications to expand user accessibility and engagement",
    deadline: "2026-02-28",
    priority: "medium",
    category: "Product",
    status: "not_started",
    progress: 0
  },
  {
    title: "Expand to European market",
    description: "Establish operations in EU with GDPR compliance, local partnerships, and market entry strategy",
    deadline: "2026-06-30",
    priority: "low",
    category: "Expansion",
    status: "not_started",
    progress: 0
  },
  {
    title: "Implement automated testing pipeline",
    description: "Set up comprehensive CI/CD pipeline with 90% test coverage to improve product reliability",
    deadline: "2025-09-30",
    priority: "medium",
    category: "Technical",
    status: "in_progress",
    progress: 40
  },
  {
    title: "Reach 1,000 active users",
    description: "Grow user base from current 450 to 1,000 monthly active users through marketing and referrals",
    deadline: "2025-10-15",
    priority: "high",
    category: "Growth",
    status: "in_progress",
    progress: 45,
    target_value: 1000,
    current_value: 450
  },
  {
    title: "Establish strategic partnership with Microsoft",
    description: "Negotiate and finalize partnership agreement for Azure marketplace listing and co-marketing",
    deadline: "2025-11-15",
    priority: "medium",
    category: "Partnerships",
    status: "not_started",
    progress: 20
  },
  {
    title: "Achieve SOC 2 Type II compliance",
    description: "Complete security audit and obtain SOC 2 Type II certification for enterprise customer requirements",
    deadline: "2025-12-31",
    priority: "high",
    category: "Compliance",
    status: "in_progress",
    progress: 30
  },
  {
    title: "Launch enterprise pricing tier",
    description: "Develop and release enterprise package with advanced features, SSO, and dedicated support",
    deadline: "2025-09-01",
    priority: "high",
    category: "Product",
    status: "in_progress",
    progress: 80
  },
  {
    title: "Build content marketing strategy",
    description: "Create blog, podcasts, and educational content to establish thought leadership and drive organic growth",
    deadline: "2025-08-31",
    priority: "medium",
    category: "Marketing",
    status: "in_progress",
    progress: 25
  },
  {
    title: "Optimize server costs by 40%",
    description: "Refactor infrastructure and implement cost optimization strategies to reduce monthly server expenses",
    deadline: "2025-09-15",
    priority: "medium",
    category: "Operations",
    status: "not_started",
    progress: 0,
    target_value: 40,
    current_value: 0
  },
  {
    title: "Launch customer referral program",
    description: "Design and implement referral system with incentives to leverage existing customers for growth",
    deadline: "2025-08-15",
    priority: "medium",
    category: "Growth",
    status: "at_risk",
    progress: 60
  },
  {
    title: "Establish remote team culture",
    description: "Implement processes, tools, and practices for effective remote-first company culture",
    deadline: "2025-08-31",
    priority: "low",
    category: "Culture",
    status: "in_progress",
    progress: 70
  },
  {
    title: "Patent core algorithm technology",
    description: "File patent application for our proprietary AI recommendation algorithm to protect intellectual property",
    deadline: "2025-10-31",
    priority: "low",
    category: "Legal",
    status: "not_started",
    progress: 10
  },
  {
    title: "Achieve 99.9% uptime SLA",
    description: "Implement monitoring, redundancy, and incident response to guarantee 99.9% service availability",
    deadline: "2025-12-31",
    priority: "high",
    category: "Technical",
    status: "in_progress",
    progress: 85,
    target_value: 99.9,
    current_value: 98.7
  },
  {
    title: "Generate $50K in quarterly revenue",
    description: "Focus on sales execution and customer success to achieve Q4 revenue target of $50,000",
    deadline: "2025-12-31",
    priority: "high",
    category: "Revenue",
    status: "in_progress",
    progress: 60,
    target_value: 50000,
    current_value: 32000
  }
];

module.exports = testGoals;