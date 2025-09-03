// Email Service - Daily Email System
import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import { promises as fs } from 'fs';
import path from 'path';
import { UserProfile, DailyEmailSettings, DailyEmailContent } from '../../shared/schema.js';
import { supabase } from '../lib/supabase.js';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    // Initialize email transporter with SMTP2GO for production
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.smtp2go.com',
      port: parseInt(process.env.SMTP_PORT || '2525'),
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.SMTP_USER || 'bizzin',  // Production verified username
        pass: process.env.SMTP_PASSWORD || process.env.EMAIL_APP_PASSWORD,
      },
      // Production optimizations
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  // Load and compile email templates with caching
  async loadTemplates() {
    // Return cached templates if already loaded
    if (this.templates.size > 0) {
      console.log('📦 Using cached email templates');
      return;
    }
    
    try {
      console.log('🔄 Loading email templates...');
      console.log('Current working directory:', process.cwd());
      
      // Register Handlebars helpers
      handlebars.registerHelper('eq', function(a, b) {
        return a === b;
      });
      
      handlebars.registerHelper('gt', function(a, b) {
        return a > b;
      });

      handlebars.registerHelper('formatDate', function(date) {
        return new Date(date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      });

      // Try to load the fullscreen white template (fills entire viewport)
      const templatePath = path.join(process.cwd(), 'server', 'templates', 'daily-email-fullscreen.hbs');
      console.log('📍 Template path:', templatePath);
      
      // Check if file exists first
      try {
        await fs.access(templatePath);
        console.log('✅ Template file exists');
      } catch (accessError) {
        console.error('❌ Template file access error:', accessError);
        throw new Error(`Template file not accessible: ${templatePath}`);
      }
      
      const templateSource = await fs.readFile(templatePath, 'utf-8');
      console.log('📝 Template source length:', templateSource.length);
      
      const compiledTemplate = handlebars.compile(templateSource);
      this.templates.set('daily-email', compiledTemplate);
      
      console.log('✅ Email templates loaded successfully');
      console.log('📋 Available templates:', Array.from(this.templates.keys()));
      
    } catch (error) {
      console.error('❌ Failed to load email templates:', error);
      throw error; // Re-throw to ensure calling code knows template loading failed
    }
  }

  // Generate personalized daily email content
  async generateDailyEmailContent(userId: string): Promise<DailyEmailContent | null> {
    try {
      // Get user email preferences first to check what content to include
      const { data: emailSettings, error: emailError } = await supabase
        .from('daily_email_settings')
        .select('enabled, content_preferences')
        .eq('user_id', userId)
        .single();

      if (emailError || !emailSettings?.enabled) {
        console.log(`Email settings not found or disabled for user ${userId}`);
        return null;
      }

      const contentPrefs = emailSettings.content_preferences || {
        journal_prompts: true,
        goal_summaries: true,
        business_insights: true,
        milestone_reminders: true
      };

      console.log('📧 Raw email settings from DB:', emailSettings);
      console.log('📧 User content preferences:', contentPrefs);

      // Get user profile from user_profiles table and auth.users as fallback
      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, email, first_name, last_name, full_name, business_name, business_type, phone, bio, avatar_url, created_at, updated_at')
        .eq('user_id', userId)
        .single();

      // If profile doesn't exist or has null/empty essential fields, enhance with fallbacks
      if (!profile || !profile.full_name || profile.full_name === null || !profile.business_type || profile.business_type === null) {
        let authData = null;
        try {
          const authResult = await supabase.auth.admin.getUserById(userId);
          authData = authResult.data?.user;
        } catch (error) {
          console.log('Auth admin access not available, using fallback');
        }

        // Create enhanced profile
        const enhancedProfile = {
          user_id: userId,
          email: profile?.email || authData?.email || 'anton@cloudfusion.co.za',
          full_name: profile?.full_name || authData?.user_metadata?.full_name || authData?.email?.split('@')[0] || 'Anton Bosch',
          business_type: profile?.business_type || authData?.user_metadata?.business_type || 'Technology Solutions',
          business_name: profile?.business_name || authData?.user_metadata?.business_name || 'CloudFusion',
          first_name: profile?.first_name || authData?.user_metadata?.first_name || 'Anton',
          last_name: profile?.last_name || authData?.user_metadata?.last_name || 'Bosch',
          phone: profile?.phone || null,
          bio: profile?.bio || null,
          avatar_url: profile?.avatar_url || null,
          created_at: profile?.created_at || authData?.created_at || new Date().toISOString(),
          updated_at: profile?.updated_at || authData?.updated_at || new Date().toISOString()
        };
        
        profile = enhancedProfile;
      }

      console.log('Enhanced profile for email:', {
        name: profile.full_name,
        business_type: profile.business_type,
        email: profile.email,
        user_id: profile.user_id,
        source: profileError ? 'fallback' : (profile.full_name ? 'database' : 'enhanced')
      });

      // Get user's goals and recent progress (all statuses to get accurate count)
      const { data: goals } = await supabase
        .from('goals')
        .select(`
          *,
          milestones (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Filter active goals for email content (matching dashboard logic)
      const activeGoals = goals?.filter(g => ['in_progress', 'not_started'].includes(g.status)) || [];
      const totalGoals = goals?.length || 0;

      console.log(`Found ${totalGoals} total goals (${activeGoals.length} active) for user`);

      // Get recent journal entries for sentiment analysis
      const { data: recentEntries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      console.log(`Found ${recentEntries?.length || 0} recent journal entries for user`);

      // Generate personalized content using total goals for stats and user preferences
      const content = await this.generatePersonalizedContent(profile, goals || [], recentEntries || [], totalGoals, contentPrefs);
      
      // Store generated content in database 
      const today = new Date().toISOString().split('T')[0];
      
      // Try insert first, if duplicate then update
      let { data: emailContent, error } = await supabase
        .from('daily_email_content')
        .insert({
          user_id: userId,
          email_date: today,
          journal_prompt: content.journalPrompt,
          goal_summary: content.goalSummary,
          business_insights: content.businessInsights,
          sentiment_trend: content.sentimentTrend,
          milestone_reminders: content.milestoneReminders,
          personalization_data: content.personalizationData,
          // Skip enhanced digest fields - will generate fresh for each email
        })
        .select()
        .single();

      // If duplicate key error, update existing record instead
      if (error && error.code === '23505') {
        const { data: updatedContent, error: updateError } = await supabase
          .from('daily_email_content')
          .update({
            journal_prompt: content.journalPrompt,
            goal_summary: content.goalSummary,
            business_insights: content.businessInsights,
            sentiment_trend: content.sentimentTrend,
            milestone_reminders: content.milestoneReminders,
            personalization_data: content.personalizationData,
            created_at: new Date().toISOString(), // Update timestamp
            // Skip enhanced digest fields - will generate fresh for each email
          })
          .eq('user_id', userId)
          .eq('email_date', today)
          .select()
          .single();

        emailContent = updatedContent;
        error = updateError;
      }

      if (error) {
        console.error('Error storing email content:', error);
        return null;
      }

      return emailContent;
    } catch (error) {
      console.error('Error generating daily email content:', error);
      return null;
    }
  }

  // Generate personalized content based on user data and preferences
  private async generatePersonalizedContent(
    profile: any, 
    goals: any[], 
    recentEntries: any[],
    totalGoals?: number,
    contentPrefs?: any
  ) {
    const userName = profile.full_name?.split(' ')[0] || profile.full_name || 'there';
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Analyze recent sentiment patterns (always needed for base data)
    const sentimentTrend = this.analyzeSentimentTrend(recentEntries);
    
    // Generate content based on user preferences
    const journalPrompt = contentPrefs?.journal_prompts !== false 
      ? this.generateJournalPrompt(profile, goals, sentimentTrend, recentEntries)
      : "Journal prompts are disabled in your email preferences.";
    
    const goalSummary = contentPrefs?.goal_summaries !== false 
      ? this.generateGoalSummary(goals)
      : "Goal summaries are disabled in your email preferences.";
    
    const businessInsights = contentPrefs?.business_insights !== false 
      ? this.generateBusinessInsights(profile, goals, recentEntries, sentimentTrend)
      : "Business insights are disabled in your email preferences.";
    
    const milestoneReminders = contentPrefs?.milestone_reminders !== false 
      ? this.generateMilestoneReminders(goals)
      : "Milestone reminders are disabled in your email preferences.";

    // Generate additional enhanced content for daily digest
    const motivationQuote = this.generateMotivationQuote();
    const topGoal = this.getTopPriorityGoal(goals);
    const journalSnapshot = this.generateJournalSnapshot(recentEntries);
    const businessHealth = this.generateBusinessHealth(profile, goals, recentEntries);
    const actionNudges = this.generateActionNudges(profile, goals, recentEntries);
    const smartSuggestions = this.generateSmartSuggestions(profile, goals, recentEntries);

    return {
      journalPrompt,
      goalSummary,
      businessInsights,
      sentimentTrend: JSON.stringify(sentimentTrend),
      milestoneReminders,
      motivationQuote,
      topGoal,
      journalSnapshot,
      businessHealth,
      actionNudges,
      smartSuggestions,
      personalizationData: {
        userName,
        currentDate,
        totalGoals: goals?.filter(g => ['in_progress', 'not_started'].includes(g.status))?.length || 0, // Only count active goals
        recentEntryCount: recentEntries?.length || 0, // Total entries (for context)
        thisWeekEntryCount: this.getEntriesThisWeek(recentEntries).length, // This week specifically
        businessType: profile.business_type,
        journalStreak: this.calculateJournalStreak(recentEntries),
        weeklyProgress: this.calculateWeeklyProgress(goals?.filter(g => ['in_progress', 'not_started'].includes(g.status)) || []),
      }
    };
  }

  // Analyze sentiment patterns from recent entries
  private analyzeSentimentTrend(recentEntries: any[]) {
    if (!recentEntries || recentEntries.length === 0) {
      return { overall: 'neutral', trend: 'stable', confidence: 0 };
    }

    const sentiments = recentEntries.map(entry => ({
      date: entry.created_at,
      sentiment: entry.sentiment_analysis?.sentiment || 'neutral',
      score: entry.sentiment_analysis?.confidence || 0.5,
      energy: entry.sentiment_analysis?.energy_level || 'medium'
    }));

    // Calculate overall trend
    const positiveCount = sentiments.filter(s => s.sentiment === 'positive').length;
    const negativeCount = sentiments.filter(s => s.sentiment === 'negative').length;
    const neutralCount = sentiments.filter(s => s.sentiment === 'neutral').length;

    let overall = 'neutral';
    if (positiveCount > negativeCount && positiveCount > neutralCount) overall = 'positive';
    if (negativeCount > positiveCount && negativeCount > neutralCount) overall = 'negative';

    return {
      overall,
      trend: this.calculateTrend(sentiments),
      confidence: sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length,
      breakdown: { positive: positiveCount, negative: negativeCount, neutral: neutralCount }
    };
  }

  private calculateTrend(sentiments: any[]) {
    if (sentiments.length < 2) return 'stable';
    
    const recent = sentiments.slice(0, Math.ceil(sentiments.length / 2));
    const older = sentiments.slice(Math.ceil(sentiments.length / 2));
    
    const recentPositive = recent.filter(s => s.sentiment === 'positive').length / recent.length;
    const olderPositive = older.filter(s => s.sentiment === 'positive').length / older.length;
    
    if (recentPositive > olderPositive + 0.1) return 'improving';
    if (recentPositive < olderPositive - 0.1) return 'declining';
    return 'stable';
  }

  // Generate contextual journal prompts
  private generateJournalPrompt(profile: UserProfile, goals: any[], sentimentTrend: any, recentEntries: any[]) {
    const prompts = {
      positive_improving: [
        "You've been on a positive streak! What specific actions have contributed most to your recent success?",
        "Your energy seems high lately. How can you leverage this momentum in your business goals?",
        "What's one breakthrough insight you've had recently that could transform your business approach?"
      ],
      positive_stable: [
        "You're maintaining positive momentum. What systems or habits are keeping you in this good space?",
        "How can you build upon your current positive mindset to tackle bigger challenges?",
        "What's one area of your business that could benefit from your current optimistic outlook?"
      ],
      neutral_stable: [
        "What's one small win from yesterday that you're proud of?",
        "If you could change one thing about your current business routine, what would it be?",
        "What's motivating you most about your business goals right now?"
      ],
      negative_improving: [
        "You're moving in a better direction. What specific change has helped you most recently?",
        "What's one lesson from a recent challenge that will make you stronger?",
        "How are you planning to build on the positive changes you've started making?"
      ],
      negative_declining: [
        "What's one thing going well in your business that you can focus on today?",
        "When you imagine your business thriving, what does that look like specifically?",
        "What support or resource would help you most in overcoming current challenges?"
      ]
    };

    const trendKey = `${sentimentTrend.overall}_${sentimentTrend.trend}` as keyof typeof prompts;
    const promptList = prompts[trendKey] || prompts.neutral_stable;
    
    return promptList[Math.floor(Math.random() * promptList.length)];
  }

  // Generate goals summary with progress insights
  private generateGoalSummary(goals: any[]) {
    if (!goals || goals.length === 0) {
      return "You haven't set any active goals yet. Consider creating your first goal to start tracking your business progress!";
    }

    const activeGoals = goals.filter(g => g.status !== 'completed');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const totalProgress = activeGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / activeGoals.length;

    const upcomingDeadlines = activeGoals
      .filter(g => g.deadline && new Date(g.deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    let summary = `You have ${activeGoals.length} active goals with an average progress of ${Math.round(totalProgress)}%.`;
    
    if (completedGoals.length > 0) {
      summary += ` Great job completing ${completedGoals.length} goals recently!`;
    }
    
    if (upcomingDeadlines.length > 0) {
      summary += ` Upcoming deadlines: ${upcomingDeadlines.map(g => `"${g.title}" (${new Date(g.deadline).toLocaleDateString()})`).join(', ')}.`;
    }

    return summary;
  }

  // Generate business health insights
  private generateBusinessInsights(profile: UserProfile, goals: any[], recentEntries: any[], sentimentTrend: any) {
    let insights = [];

    // Goal completion insights
    if (goals && goals.length > 0) {
      const completionRate = goals.filter(g => g.status === 'completed').length / goals.length;
      if (completionRate > 0.7) {
        insights.push("🎯 Excellent goal completion rate! You're consistently following through on your commitments.");
      } else if (completionRate < 0.3) {
        insights.push("📈 Consider breaking down your goals into smaller, more manageable milestones to improve completion rates.");
      }
    }

    // Sentiment insights
    if (sentimentTrend.overall === 'positive' && sentimentTrend.trend === 'improving') {
      insights.push("✨ Your business mindset is trending positively - this is prime time to tackle challenging projects!");
    } else if (sentimentTrend.overall === 'negative' && sentimentTrend.trend === 'declining') {
      insights.push("💪 Consider focusing on self-care and smaller wins to rebuild momentum. Remember, every successful entrepreneur faces tough periods.");
    }

    // Business category insights - only analyze ACTIVE goals (matching dashboard logic)
    const activeGoals = goals?.filter(g => ['in_progress', 'not_started'].includes(g.status)) || [];
    if (activeGoals.length > 0) {
      const categories = activeGoals.reduce((acc: any, goal: any) => {
        acc[goal.category] = (acc[goal.category] || 0) + 1;
        return acc;
      }, {});
      
      const topCategory = Object.entries(categories).sort(([,a], [,b]) => (b as number) - (a as number))[0];
      if (topCategory && (topCategory[1] as number) > 0) {
        insights.push(`🎯 You're heavily focused on ${topCategory[0]} - consider if this balance aligns with your business priorities.`);
      }
    }

    return insights.length > 0 ? insights.join('\n\n') : "Keep building momentum with your business goals!";
  }

  // Generate milestone reminders
  private generateMilestoneReminders(goals: any[]) {
    if (!goals) return "No upcoming milestones.";

    const upcomingMilestones = goals
      .flatMap(goal => 
        goal.milestones?.filter((m: any) => 
          m.status !== 'done' && 
          m.due_date && 
          new Date(m.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ) || []
      )
      .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    if (upcomingMilestones.length === 0) {
      return "No upcoming milestone deadlines this week.";
    }

    return upcomingMilestones
      .slice(0, 3) // Show top 3
      .map((milestone: any) => 
        `• ${milestone.title} (Due: ${new Date(milestone.due_date).toLocaleDateString()})`
      )
      .join('\n');
  }

  // Generate actionable insights based on user data
  private generateActionableInsights(profile: any, goals: any[], recentEntries: any[], sentimentTrend: any) {
    const insights = [];

    // Energy pattern insights
    if (recentEntries && recentEntries.length >= 3) {
      const energyLevels = recentEntries.map(entry => entry.sentiment_analysis?.energy_level).filter(Boolean);
      if (energyLevels.length > 0) {
        const highEnergyDays = energyLevels.filter(level => level === 'high').length;
        if (highEnergyDays >= 2) {
          insights.push("Your energy levels have been high recently - perfect time to tackle your most challenging business tasks!");
        }
      }
    }

    // Goal momentum insights
    if (goals && goals.length > 0) {
      const recentlyUpdatedGoals = goals.filter(g => {
        const updated = new Date(g.updated_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return updated > weekAgo;
      });

      if (recentlyUpdatedGoals.length === 0 && goals.length > 0) {
        insights.push("Your goals haven't been updated this week. Consider reviewing and updating progress to maintain momentum.");
      }
    }

    // Business focus recommendations
    if (profile.business_type === 'Technology Solutions') {
      insights.push("As a tech entrepreneur, consider documenting technical decisions and market research in your journal for better strategic clarity.");
    }

    return insights.join('\n\n') || "Keep building consistent habits - small daily actions lead to big business results!";
  }

  // Generate gamification data for user engagement
  private generateGamificationData(profile: any, goals: any[], recentEntries: any[]) {
    const journalStreak = this.calculateJournalStreak(recentEntries);
    const goalCompletionRate = goals?.length ? (goals.filter(g => g.status === 'completed').length / goals.length) * 100 : 0;
    
    const badges = [];
    if (journalStreak >= 7) badges.push("Weekly Warrior");
    if (journalStreak >= 30) badges.push("Monthly Master");
    if (goalCompletionRate >= 80) badges.push("Goal Crusher");
    if (recentEntries?.length >= 10) badges.push("Insight Generator");

    return {
      journalStreak,
      goalCompletionRate: Math.round(goalCompletionRate),
      badges,
      nextMilestone: journalStreak < 7 ? `${7 - journalStreak} days to Weekly Warrior badge` : 
                    journalStreak < 30 ? `${30 - journalStreak} days to Monthly Master badge` :
                    "Keep up the amazing consistency!"
    };
  }

  // Calculate journal streak
  private calculateJournalStreak(recentEntries: any[]) {
    if (!recentEntries || recentEntries.length === 0) return 0;

    const sortedEntries = recentEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    let streak = 0;
    let currentDate = new Date();
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.created_at);
      const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate = entryDate;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Calculate weekly progress
  private calculateWeeklyProgress(goals: any[]) {
    if (!goals || goals.length === 0) return 0;
    
    const activeGoals = goals.filter(g => ['in_progress', 'not_started'].includes(g.status));
    const totalProgress = activeGoals.reduce((sum, g) => sum + (g.progress || 0), 0);
    return Math.round(totalProgress / activeGoals.length);
  }

  // Generate weekly challenge
  private generateWeeklyChallenge(profile: any, goals: any[], sentimentTrend: any) {
    const challenges = [
      "Document one key business decision and its reasoning",
      "Identify and journal about your biggest business bottleneck",
      "Write about three potential opportunities you see in your market",
      "Analyze one customer feedback and plan actionable improvements",
      "Set aside 30 minutes daily for strategic thinking and journal the insights",
      "Review your business goals and adjust timelines based on current progress"
    ];

    // Customize based on sentiment
    if (sentimentTrend.overall === 'positive') {
      challenges.push("Channel your positive energy into planning your next big business move");
    } else if (sentimentTrend.overall === 'negative') {
      challenges.push("Focus on identifying three things going well in your business despite current challenges");
    }

    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  // Generate smart recommendations
  private generateSmartRecommendations(profile: any, goals: any[], recentEntries: any[]) {
    const recommendations = [];

    // Goal-based recommendations - contextual based on actual state
    const activeGoals = goals?.filter(g => ['in_progress', 'not_started'].includes(g.status)) || [];
    
    if (!goals || goals.length === 0) {
      // Truly no goals at all
      recommendations.push({
        title: "Start Goal Tracking",
        description: "Set your first business goal to unlock progress insights and milestone tracking",
        action: "Create Goal",
        url: "/goals/new"
      });
    } else if (activeGoals.length === 0 && goals.length > 0) {
      // Has goals but none are active
      recommendations.push({
        title: "Reactivate Your Goals",
        description: "You have existing goals that could be reactivated to drive business momentum",
        action: "Review Goals",
        url: "/goals"
      });
    } else {
      // Has active goals - check for stale ones
      const staleGoals = activeGoals.filter(g => {
        const updated = new Date(g.updated_at);
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        return updated < twoWeeksAgo;
      });

      if (staleGoals.length > 0) {
        recommendations.push({
          title: "Update Goal Progress", 
          description: `${staleGoals.length} goal${staleGoals.length > 1 ? 's' : ''} need progress updates to stay on track`,
          action: "Review Goals",
          url: "/goals"
        });
      }
    }

    // Journal-based recommendations
    if (!recentEntries || recentEntries.length < 3) {
      recommendations.push({
        title: "Build Journal Habit",
        description: "Regular journaling unlocks deeper business insights and trend analysis",
        action: "Write Entry",
        url: "/journal/new"
      });
    }

    // Business tool recommendations
    recommendations.push({
      title: "Financial Planning",
      description: "Use business calculators to model growth scenarios and cash flow",
      action: "Open Tools",
      url: "/tools"
    });

    return recommendations.slice(0, 2); // Return top 2 recommendations
  }

  // Generate daily motivation quote
  private generateMotivationQuote(): string {
    const quotes = [
      "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      "The way to get started is to quit talking and begin doing.",
      "Don't be afraid to give yourself everything you've ever wanted in life.",
      "Innovation distinguishes between a leader and a follower.",
      "The only impossible journey is the one you never begin.",
      "Opportunities don't happen. You create them.",
      "Success is walking from failure to failure with no loss of enthusiasm.",
      "The future depends on what you do today.",
      "Dream it. Believe it. Build it.",
      "Your limitation—it's only your imagination.",
      "Push yourself, because no one else is going to do it for you.",
      "Great things never come from comfort zones.",
      "Dream bigger. Do bigger.",
      "Success doesn't just find you. You have to go out and get it.",
      "The harder you work for something, the greater you'll feel when you achieve it."
    ];
    
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  // Get the top priority goal with progress
  private getTopPriorityGoal(goals: any[]) {
    if (!goals || goals.length === 0) return null;
    
    // Filter active goals and sort by creation date (most recent first)
    const activeGoals = goals
      .filter(g => g.status === 'active')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    if (activeGoals.length === 0) return null;
    
    const topGoal = activeGoals[0];
    
    // Calculate progress based on goal type
    let progress = 0;
    if (topGoal.goal_type === 'milestone' && topGoal.milestones?.length) {
      const completedMilestones = topGoal.milestones.filter((m: any) => m.completed).length;
      progress = Math.round((completedMilestones / topGoal.milestones.length) * 100);
    } else if (topGoal.goal_type === 'manual' && topGoal.current_value && topGoal.target_value) {
      progress = Math.min(100, Math.round((topGoal.current_value / topGoal.target_value) * 100));
    }
    
    // Calculate days remaining
    const targetDate = new Date(topGoal.target_date);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      title: topGoal.title,
      progress,
      days_remaining: Math.max(0, daysRemaining)
    };
  }

  // Generate journal progress snapshot
  private generateJournalSnapshot(recentEntries: any[]) {
    if (!recentEntries || recentEntries.length === 0) {
      return {
        message: "Ready to start capturing your business insights? Create your first journal entry today!",
        streak_message: null
      };
    }

    const streak = this.calculateJournalStreak(recentEntries);
    const lastEntry = recentEntries[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastEntryDate = new Date(lastEntry.created_at);
    const isRecent = lastEntryDate.toDateString() === yesterday.toDateString() || 
                     lastEntryDate.toDateString() === new Date().toDateString();
    
    let message = "";
    let streakMessage = null;
    
    if (isRecent) {
      const entryTitle = lastEntry.title?.substring(0, 50) + (lastEntry.title?.length > 50 ? "..." : "");
      message = `Yesterday you logged "${entryTitle}". Keep your momentum going!`;
    } else {
      message = "It's been a while since your last journal entry. Today's a great day to reflect!";
    }
    
    if (streak > 1) {
      streakMessage = `${streak} day streak! You're building an amazing habit.`;
    }
    
    return { message, streak_message: streakMessage };
  }

  // Generate business health indicators with accurate data
  private generateBusinessHealth(profile: any, goals: any[], recentEntries: any[]) {
    const indicators = [];
    
    // Calculate ACTUAL this week entries (not all recent entries)
    const thisWeekEntries = this.getEntriesThisWeek(recentEntries);
    const activeGoals = goals?.filter(g => ['in_progress', 'not_started'].includes(g.status)) || [];
    
    // Goal progress health
    if (activeGoals.length > 0) {
      const onTrackGoals = activeGoals.filter(g => {
        if (g.goal_type === 'milestone' && g.milestones?.length) {
          const completedMilestones = g.milestones.filter((m: any) => m.completed).length;
          const progress = (completedMilestones / g.milestones.length) * 100;
          return progress > 25; // Consider 25%+ progress as "on track"
        }
        return g.current_value && g.target_value ? (g.current_value / g.target_value) > 0.25 : false;
      }).length;
      
      indicators.push({
        label: "Goals On Track",
        value: `${onTrackGoals} of ${activeGoals.length} goals progressing well`
      });
    }
    
    // Journal consistency health - using ACTUAL this week count
    const weeklyEntries = thisWeekEntries.length;
    const consistency = weeklyEntries >= 3 ? "Strong" : weeklyEntries >= 1 ? "Good" : "Needs attention";
    indicators.push({
      label: "Reflection Consistency", 
      value: `${consistency} - ${weeklyEntries} entries this week`
    });
    
    // Sentiment health - based on this week's entries only
    if (thisWeekEntries.length > 0) {
      const positiveEntries = thisWeekEntries.filter(e => 
        e.sentiment_data?.mood_polarity === 'Positive' || 
        ['optimistic', 'excited', 'confident', 'accomplished'].includes(e.sentiment_data?.primary_mood?.toLowerCase())).length;
      const sentimentHealth = positiveEntries > thisWeekEntries.length / 2 ? "Positive trend" : "Mixed signals";
      indicators.push({
        label: "Business Sentiment",
        value: sentimentHealth
      });
    } else {
      indicators.push({
        label: "Business Sentiment", 
        value: "No recent reflections to analyze"
      });
    }
    
    return indicators.length > 0 ? indicators : null;
  }
  
  // Helper function to get entries from this week only
  private getEntriesThisWeek(recentEntries: any[]): any[] {
    if (!recentEntries) return [];
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7); // Last 7 days
    
    return recentEntries.filter(entry => {
      const entryDate = new Date(entry.created_at || entry.entry_date);
      return entryDate >= startOfWeek;
    });
  }

  // Generate action nudges for platform engagement
  private generateActionNudges(profile: any, goals: any[], recentEntries: any[]) {
    const nudges = [];
    
    // Goal-based nudges
    const activeGoals = goals?.filter(g => ['in_progress', 'not_started'].includes(g.status)) || [];
    if (activeGoals.length === 0) {
      nudges.push({
        message: "Set your first business goal to unlock progress tracking and milestone management.",
        action_text: "Create Your First Goal",
        link: "/goals/new"
      });
    } else {
      const staleGoals = activeGoals.filter(g => {
        const updated = new Date(g.updated_at);
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return updated < oneWeekAgo;
      });
      
      if (staleGoals.length > 0) {
        nudges.push({
          message: `${staleGoals.length} goals need progress updates. Keep your momentum visible!`,
          action_text: "Update Progress",
          link: "/goals"
        });
      }
    }
    
    // Journal nudges
    if (!recentEntries || recentEntries.length === 0) {
      nudges.push({
        message: "Start capturing your business insights with your first journal entry.",
        action_text: "Write First Entry",
        link: "/journal"
      });
    } else {
      const lastEntry = recentEntries[0];
      const daysSinceLastEntry = Math.floor(
        (Date.now() - new Date(lastEntry.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastEntry >= 2) {
        nudges.push({
          message: "Your journal is waiting for today's insights and reflections.",
          action_text: "Add Today's Entry",
          link: "/journal"
        });
      }
    }
    
    // Business tools nudge
    nudges.push({
      message: "Model your business growth with financial planning calculators.",
      action_text: "Explore BizBuilder Tools",
      link: "/tools"
    });
    
    return nudges.slice(0, 3); // Return top 3 nudges
  }

  // Generate smart suggestions based on user activity
  private generateSmartSuggestions(profile: any, goals: any[], recentEntries: any[]) {
    const suggestions = [];
    
    // Goal-based suggestions
    const hasFinancialGoals = goals?.some(g => 
      g.title?.toLowerCase().includes('revenue') || 
      g.title?.toLowerCase().includes('sales') || 
      g.title?.toLowerCase().includes('profit')
    );
    
    if (hasFinancialGoals) {
      suggestions.push({
        title: "Cash Flow Projections",
        description: "Model your revenue goals with detailed cash flow planning tools",
        link: "/tools/cash-flow"
      });
    }
    
    // Journal-based suggestions
    if (recentEntries && recentEntries.length >= 3) {
      const hasNegativeSentiment = recentEntries.some(e => 
        e.sentiment_analysis?.sentiment === 'negative'
      );
      
      if (hasNegativeSentiment) {
        suggestions.push({
          title: "Business Strategy Resources",
          description: "Explore training content to overcome current business challenges",
          link: "/training"
        });
      }
    }
    
    // General business suggestions
    suggestions.push({
      title: "Document Management",
      description: "Organize important business documents with secure DocSafe storage",
      link: "/docsafe"
    });
    
    if (!goals || goals.length < 3) {
      suggestions.push({
        title: "Goal Setting Framework",
        description: "Learn effective goal-setting strategies for sustainable business growth",
        link: "/training"
      });
    }
    
    return suggestions.slice(0, 2); // Return top 2 suggestions
  }

  // Generate template data with state-aware logic (eliminates contradictions)
  private async generateSmartTemplateData(emailContent: DailyEmailContent, additionalData?: any) {
    const personalData = emailContent.personalization_data as any;
    const currentHour = new Date().getHours();
    const partOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

    // Use the actual goal and journal data passed from the email generation
    const goals = additionalData?.goals || [];
    const recentEntries = additionalData?.recentEntries || [];
    
    // Calculate stats with proper logic - USE REAL DATA
    const allGoals = goals;
    const activeGoals = allGoals.filter((g: any) => ['in_progress', 'not_started'].includes(g.status));
    const completedGoals = allGoals.filter((g: any) => g.status === 'completed');
    const totalGoals = allGoals.length;
    const successRate = totalGoals > 0 ? Math.round((completedGoals.length / totalGoals) * 100) : 0;

    console.log('📊 Smart Template Data Stats:', {
      totalGoals,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      successRate,
      goalData: goals.map((g: any) => ({ title: g.title, status: g.status }))
    });

    // Journal status with no contradictions
    const thisWeekEntries = this.getEntriesThisWeek(recentEntries || []);
    const journalStreak = this.calculateJournalStreak(recentEntries || []);
    const lastEntryDays = this.getDaysSinceLastEntry(recentEntries || []);

    // State-aware journal messaging
    let journalStatus, journalCTA;
    if (recentEntries?.length === 0) {
      journalStatus = { message: "Ready to start capturing your business insights? Create your first journal entry today." };
      journalCTA = "Write Your First Entry";
    } else if (thisWeekEntries.length === 0) {
      journalStatus = { message: "Start this week's first entry today." };
      journalCTA = "Write Today's Entry";
    } else {
      journalStatus = {
        message: "Keep your reflection streak going with today's entry.",
        streakDays: journalStreak > 0 ? journalStreak : undefined
      };
      journalCTA = "Keep The Streak Alive";
    }

    // Health check with proper status logic
    let reflectionStatus, sentimentStatus;
    if (thisWeekEntries.length === 0) {
      reflectionStatus = "Needs attention — 0 entries this week";
    } else if (thisWeekEntries.length <= 3) {
      reflectionStatus = `Getting started — ${thisWeekEntries.length} entries this week`;
    } else {
      reflectionStatus = `On track — ${thisWeekEntries.length} entries this week`;
    }

    if (!recentEntries?.length || lastEntryDays > 7) {
      sentimentStatus = "No recent reflections to analyse";
    } else {
      const latestEntry = recentEntries[0];
      const sentiment = latestEntry.sentiment_analysis?.sentiment || 'Neutral';
      sentimentStatus = `Recent sentiment: ${sentiment}`;
    }

    // State-aware action items (no contradictions)
    const actionItems = [];
    
    // Goals action
    if (totalGoals === 0) {
      actionItems.push({
        text: "Create your first goal to unlock progress tracking and milestone management",
        url: "https://bizzin.co.za/goals"
      });
    } else {
      actionItems.push({
        text: "Review your active goals and update progress",
        url: "https://bizzin.co.za/goals"
      });
    }

    // Journal action
    if (recentEntries?.length === 0) {
      actionItems.push({
        text: "Write your first journal entry and start building insights",
        url: "https://bizzin.co.za/journal"
      });
    } else if (thisWeekEntries.length === 0) {
      actionItems.push({
        text: "Write today's entry to maintain your reflection practice",
        url: "https://bizzin.co.za/journal"
      });
    } else {
      actionItems.push({
        text: "Keep the momentum going with today's reflection",
        url: "https://bizzin.co.za/journal"
      });
    }

    // Always include tools
    actionItems.push({
      text: "Explore BizBuilder Tools for financial planning",
      url: "https://bizzin.co.za/bizbuilder"
    });

    // Smart suggestions with state awareness
    const smartSuggestions = [];
    
    // Document management suggestion
    smartSuggestions.push({
      icon: "📁",
      title: "Document Management",
      description: "Organise important business documents with secure DocSafe storage",
      url: "https://bizzin.co.za/docsafe",
      cta: "Explore DocSafe"
    });

    // Goal framework suggestion (show if low goal count or poor success rate)
    if (totalGoals < 3 || successRate < 60) {
      smartSuggestions.push({
        icon: "🎯",
        title: "Goal-Setting Framework",
        description: "Learn effective goal-setting strategies for sustainable business growth",
        url: "https://bizzin.co.za/goals",
        cta: "Explore Now"
      });
    }

    // Progress tracking
    smartSuggestions.push({
      icon: "📈",
      title: "Progress Tracking",
      description: "Monitor progress with visual indicators and status updates",
      url: "https://bizzin.co.za/goals",
      cta: "View Progress"
    });

    // Goal previews with proper status mapping
    const goalPreviews = activeGoals.slice(0, 3).map((goal: any) => ({
      title: goal.title,
      description: goal.description?.substring(0, 120) + (goal.description?.length > 120 ? '...' : '') || 'No description provided',
      progress: goal.progress || 0,
      priority: goal.priority || 'Medium',
      category: goal.category || 'General',
      dueDate: goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null,
      status: this.mapGoalStatus(goal.status, goal.progress || 0),
      statusClass: this.getStatusClass(goal.status, goal.progress || 0)
    }));

    // Business insight with state awareness
    let businessInsight = null;
    if (successRate < 100 && totalGoals > 0) {
      businessInsight = {
        text: "Consider breaking down your goals into smaller milestones to improve completion rates. You're heavily focussed on Growth — check if this balance aligns with your business priorities.",
        category: "Growth"
      };
    }

    return {
      user: {
        firstName: personalData?.userName || 'Anton'
      },
      partOfDay,
      formattedDate: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      quote: {
        text: "Great things never come from comfort zones."
      },
      stats: {
        totalGoals,
        completedGoals: completedGoals.length,
        inProgressGoals: activeGoals.length,
        successRate
      },
      goalPreviews,
      journalStatus,
      journalCTA,
      healthCheck: {
        reflectionStatus,
        sentimentStatus
      },
      actionItems,
      smartSuggestions: smartSuggestions.slice(0, 3),
      journalPrompt: emailContent.journal_prompt || "What's motivating you most about your business goals right now?",
      businessInsight,
      dashboardUrl: "https://bizzin.co.za"
    };
  }

  // Helper methods for template data generation
  private mapGoalStatus(status: string, progress: number): string {
    if (status === 'completed') return 'Completed';
    if (progress === 0) return 'Not Started';
    if (progress < 100) return 'In Progress';
    return 'At Risk'; // Custom logic for at-risk goals
  }

  private getStatusClass(status: string, progress: number): string {
    if (status === 'completed') return 'completed';
    if (progress === 0) return 'not-started';
    if (progress < 100) return 'in-progress';
    return 'at-risk';
  }

  private getDaysSinceLastEntry(entries: any[]): number {
    if (!entries?.length) return Infinity;
    const lastEntry = entries[0];
    const lastEntryDate = new Date(lastEntry.created_at);
    const now = new Date();
    return Math.floor((now.getTime() - lastEntryDate.getTime()) / (24 * 60 * 60 * 1000));
  }

  // Send daily email to user
  async sendDailyEmail(emailContent: DailyEmailContent, userEmail: string, additionalData?: {
    profile?: any,
    goals?: any[],
    recentEntries?: any[]
  }): Promise<boolean> {
    try {
      const template = this.templates.get('daily-email');
      if (!template) {
        console.error('Daily email template not loaded');
        return false;
      }

      // Generate smart template data with no contradictions - pass real goal data
      const templateData = await this.generateSmartTemplateData(emailContent, {
        goals: additionalData?.goals || [],
        recentEntries: additionalData?.recentEntries || [],
        profile: additionalData?.profile
      });

      const htmlContent = template(templateData);

      console.log('Email template data:', {
        hasPersonalization: !!emailContent.personalization_data,
        userName: emailContent.personalization_data?.userName,
        totalGoals: emailContent.personalization_data?.totalGoals,
        recentEntryCount: emailContent.personalization_data?.recentEntryCount
      });

      const mailOptions = {
        from: `"Bizzin Daily Insights" <notifications@bizzin.co.za>`,
        to: userEmail,
        subject: `Your Daily Business Insights - ${new Date().toLocaleDateString()}`,
        html: htmlContent,
        text: this.generatePlainTextVersion(emailContent), // Fallback plain text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Daily email sent successfully:', result.messageId);

      // Update sent timestamp
      await supabase
        .from('daily_email_content')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', emailContent.id);

      return true;
    } catch (error) {
      console.error('Error sending daily email:', error);
      return false;
    }
  }

  private getTimeOfDayGreeting() {
    // Get current time in South Africa timezone (SAST - UTC+2)
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const southAfricaTime = new Date(utcTime + (2 * 60 * 60 * 1000)); // UTC+2
    const hour = southAfricaTime.getHours();
    
    console.log(`Server UTC time: ${now.toISOString()}`);
    console.log(`South Africa time: ${southAfricaTime.toISOString()}, Hour: ${hour}`);
    
    if (hour < 12) {
      return {
        timeOfDayGreeting: "Good morning",
        greetingEmoji: "☀️"
      };
    } else if (hour < 17) {
      return {
        timeOfDayGreeting: "Good afternoon", 
        greetingEmoji: "🌤️"
      };
    } else {
      return {
        timeOfDayGreeting: "Good evening",
        greetingEmoji: "🌙"
      };
    }
  }

  private generateUnsubscribeToken(userId: string): string {
    // Simple token generation - in production, use proper JWT or similar
    return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
  }

  private generatePlainTextVersion(content: DailyEmailContent): string {
    return `
Daily Business Insights

Journal Prompt:
${content.journal_prompt}

Goals Summary:
${content.goal_summary}

Business Insights:
${content.business_insights}

Milestone Reminders:
${content.milestone_reminders}

---
Visit Bizzin to add your journal entry and update your goals!
    `.trim();
  }

  // Get users ready for daily emails (based on their timezone and preferences)
  async getUsersForDailyEmails(southAfricaHour?: number): Promise<{ userId: string, email: string, settings: DailyEmailSettings }[]> {
    try {
      // Use provided hour (from South Africa timezone) or calculate local hour
      const currentHour = southAfricaHour ?? new Date().getHours();
      
      console.log(`Checking for users scheduled for ${currentHour}:00 emails...`);
      
      // Get users whose send time matches current hour exactly
      const { data: settings } = await supabase
        .from('daily_email_settings')
        .select(`
          *,
          user_profiles!inner(email)
        `)
        .eq('enabled', true);

      if (!settings) return [];

      // Filter users whose scheduled hour matches current hour
      const eligibleUsers = settings
        .filter((setting: any) => {
          const [sendHour] = setting.send_time.split(':').map(Number);
          return sendHour === currentHour;
        })
        .map((setting: any) => ({
          userId: setting.user_id,
          email: (setting as any).user_profiles.email,
          settings: setting
        }));

      console.log(`Found ${eligibleUsers.length} users scheduled for ${currentHour}:00`);
      return eligibleUsers;
    } catch (error) {
      console.error('Error getting users for daily emails:', error);
      return [];
    }
  }
}