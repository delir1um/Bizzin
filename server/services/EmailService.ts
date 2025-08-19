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
    // Initialize email transporter with SMTP2GO
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.smtp2go.com',
      port: parseInt(process.env.SMTP_PORT || '2525'),
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.SMTP_USER || 'bizzin',  // Keep original working username
        pass: process.env.SMTP_PASSWORD || process.env.EMAIL_APP_PASSWORD,
      },
    });
  }

  // Load and compile email templates
  async loadTemplates() {
    try {
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

      const templatePath = path.join(process.cwd(), 'server', 'templates', 'daily-email.hbs');
      const templateSource = await fs.readFile(templatePath, 'utf-8');
      this.templates.set('daily-email', handlebars.compile(templateSource));
      console.log('Email templates loaded successfully');
    } catch (error) {
      console.error('Failed to load email templates:', error);
    }
  }

  // Generate personalized daily email content
  async generateDailyEmailContent(userId: string): Promise<DailyEmailContent | null> {
    try {
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

      // Filter active goals for email content
      const activeGoals = goals?.filter(g => g.status === 'active') || [];
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

      // Generate personalized content using total goals for stats
      const content = await this.generatePersonalizedContent(profile, goals || [], recentEntries || [], totalGoals);
      
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

  // Generate personalized content based on user data
  private async generatePersonalizedContent(
    profile: any, 
    goals: any[], 
    recentEntries: any[],
    totalGoals?: number
  ) {
    const userName = profile.full_name?.split(' ')[0] || profile.full_name || 'there';
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Analyze recent sentiment patterns
    const sentimentTrend = this.analyzeSentimentTrend(recentEntries);
    
    // Generate contextual journal prompt
    const journalPrompt = this.generateJournalPrompt(profile, goals, sentimentTrend, recentEntries);
    
    // Create goals summary
    const goalSummary = this.generateGoalSummary(goals);
    
    // Generate business insights
    const businessInsights = this.generateBusinessInsights(profile, goals, recentEntries, sentimentTrend);
    
    // Create milestone reminders
    const milestoneReminders = this.generateMilestoneReminders(goals);

    return {
      journalPrompt,
      goalSummary,
      businessInsights,
      sentimentTrend: JSON.stringify(sentimentTrend),
      milestoneReminders,
      personalizationData: {
        userName,
        currentDate,
        totalGoals: totalGoals || goals?.length || 0,
        recentEntryCount: recentEntries?.length || 0,
        businessType: profile.business_type,
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

    // Business category insights
    if (goals) {
      const categories = goals.reduce((acc: any, goal: any) => {
        acc[goal.category] = (acc[goal.category] || 0) + 1;
        return acc;
      }, {});
      
      const topCategory = Object.entries(categories).sort(([,a], [,b]) => (b as number) - (a as number))[0];
      if (topCategory) {
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

  // Send daily email to user
  async sendDailyEmail(emailContent: DailyEmailContent, userEmail: string): Promise<boolean> {
    try {
      const template = this.templates.get('daily-email');
      if (!template) {
        console.error('Daily email template not loaded');
        return false;
      }

      const htmlContent = template({
        ...emailContent,
        personalization: emailContent.personalization_data,
        baseUrl: process.env.BASE_URL || 'https://bizzin.co.za',
        unsubscribeUrl: `${process.env.BASE_URL || 'https://bizzin.co.za'}/unsubscribe?token=${this.generateUnsubscribeToken(emailContent.user_id)}`
      });

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
  async getUsersForDailyEmails(): Promise<{ userId: string, email: string, settings: DailyEmailSettings }[]> {
    try {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      
      // Get users whose send time matches current time (with 1-hour window)
      const { data: settings } = await supabase
        .from('daily_email_settings')
        .select(`
          *,
          user_profiles!inner(email)
        `)
        .eq('enabled', true);

      if (!settings) return [];

      return settings
        .filter((setting: any) => {
          const [sendHour, sendMinute] = setting.send_time.split(':').map(Number);
          // Allow 1-hour window for sending
          return Math.abs(currentHour - sendHour) <= 1 && Math.abs(currentMinute - sendMinute) <= 30;
        })
        .map((setting: any) => ({
          userId: setting.user_id,
          email: (setting as any).user_profiles.email,
          settings: setting
        }));
    } catch (error) {
      console.error('Error getting users for daily emails:', error);
      return [];
    }
  }
}