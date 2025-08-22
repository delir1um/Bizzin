// Email Sender - SMTP2GO API Integration for CloudFlare Workers
// Handles email content generation and sending via SMTP2GO API

import { getUserProfile, getUserGoals, getUserJournalEntries, storeDailyEmailContent } from './supabaseClient.js';

// Generate personalized email content for a user
export async function generateEmailContent(userId, env) {
  try {
    console.log(`📝 Generating email content for user ${userId}`);
    
    // Fetch user data in parallel for efficiency
    const [profile, goals, journalEntries] = await Promise.all([
      getUserProfile(userId, env),
      getUserGoals(userId, env),
      getUserJournalEntries(userId, env, 5)
    ]);
    
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    // Generate personalized content based on user data
    const emailContent = {
      subject: generateEmailSubject(profile, goals),
      html_content: generateHtmlContent(profile, goals, journalEntries),
      text_content: generateTextContent(profile, goals, journalEntries),
      template_version: '1.0',
      user_id: userId
    };
    
    // Store content for auditing (optional)
    await storeDailyEmailContent(userId, emailContent, env);
    
    console.log(`✅ Email content generated for ${profile.full_name || profile.email}`);
    return emailContent;
    
  } catch (error) {
    console.error(`❌ Error generating email content for user ${userId}:`, error);
    return null;
  }
}

// Generate personalized email subject
function generateEmailSubject(profile, goals) {
  const name = profile.full_name || profile.email?.split('@')[0] || 'Entrepreneur';
  const date = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Dynamic subject based on user's goals
  if (goals && goals.length > 0) {
    const activeGoals = goals.filter(g => g.status === 'active' || !g.status);
    if (activeGoals.length > 0) {
      return `${name}, your daily business fuel for ${date} 🎯`;
    }
  }
  
  return `${name}, your daily business insights for ${date} 💼`;
}

// Generate HTML email content
function generateHtmlContent(profile, goals, journalEntries) {
  const name = profile.full_name || 'Entrepreneur';
  const businessType = profile.business_type || 'Business';
  const businessName = profile.business_name || businessType;
  
  // Calculate progress metrics
  const goalStats = calculateGoalStats(goals);
  const journalStreak = calculateJournalStreak(journalEntries);
  const motivationalQuote = getMotivationalQuote();
  
  // Generate dynamic insights
  const insights = generateBusinessInsights(goals, journalEntries, profile);
  const actionItems = generateActionItems(goals, journalEntries);
  
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Your Daily Business Fuel</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td style="padding: 20px 0;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px 40px; border-radius: 8px 8px 0 0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #ffffff; font-size: 28px; font-weight: bold; text-align: center;">
                                        🎯 Your Daily Business Fuel
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #fed7aa; font-size: 16px; text-align: center; padding-top: 10px;">
                                        ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 30px 40px 20px;">
                            <h2 style="color: #1f2937; margin: 0; font-size: 24px;">Good morning, ${name}! 👋</h2>
                            <p style="color: #6b7280; margin: 10px 0 0; font-size: 16px; line-height: 1.5;">
                                Ready to fuel your ${businessName} success today? Here's your personalized business insight digest.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Motivational Quote -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 20px; text-align: center;">
                                        <p style="color: #1f2937; font-size: 18px; font-style: italic; margin: 0; line-height: 1.4;">
                                            "${motivationalQuote.text}"
                                        </p>
                                        <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0;">
                                            — ${motivationalQuote.author}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Stats Grid -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="48%" style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; vertical-align: top;">
                                        <h3 style="color: #059669; margin: 0 0 8px; font-size: 18px;">🎯 Goal Progress</h3>
                                        <p style="color: #047857; margin: 0; font-size: 24px; font-weight: bold;">
                                            ${goalStats.activeGoals}/${goalStats.totalGoals}
                                        </p>
                                        <p style="color: #6b7280; margin: 5px 0 0; font-size: 14px;">Active goals</p>
                                    </td>
                                    <td width="4%"></td>
                                    <td width="48%" style="background-color: #eff6ff; border-radius: 8px; padding: 20px; vertical-align: top;">
                                        <h3 style="color: #2563eb; margin: 0 0 8px; font-size: 18px;">📝 Journal Streak</h3>
                                        <p style="color: #1d4ed8; margin: 0; font-size: 24px; font-weight: bold;">
                                            ${journalStreak} days
                                        </p>
                                        <p style="color: #6b7280; margin: 5px 0 0; font-size: 14px;">Reflection habit</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Business Insights -->
                    ${insights.length > 0 ? `
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 20px;">💡 Your Business Insights</h3>
                            ${insights.map(insight => `
                            <div style="background-color: #f8fafc; border-left: 4px solid #f97316; padding: 15px; margin-bottom: 10px; border-radius: 0 8px 8px 0;">
                                <p style="color: #1f2937; margin: 0; font-size: 16px; line-height: 1.5;">${insight}</p>
                            </div>
                            `).join('')}
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Action Items -->
                    ${actionItems.length > 0 ? `
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 20px;">🚀 Today's Action Items</h3>
                            <ul style="color: #4b5563; margin: 0; padding-left: 20px; font-size: 16px; line-height: 1.6;">
                                ${actionItems.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
                            </ul>
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- CTA -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="text-align: center; padding: 20px 0;">
                                        <a href="https://bizzin.replit.app" style="background-color: #f97316; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                                            Open Bizzin Dashboard →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #9ca3af; margin: 0; font-size: 14px; text-align: center;">
                                Keep building your entrepreneurial success! 🚀<br>
                                <a href="#" style="color: #6b7280; text-decoration: none;">Update email preferences</a> | 
                                <a href="#" style="color: #6b7280; text-decoration: none;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Generate plain text version
function generateTextContent(profile, goals, journalEntries) {
  const name = profile.full_name || 'Entrepreneur';
  const businessName = profile.business_name || profile.business_type || 'Business';
  const goalStats = calculateGoalStats(goals);
  const journalStreak = calculateJournalStreak(journalEntries);
  const motivationalQuote = getMotivationalQuote();
  
  return `
BIZZIN - YOUR DAILY BUSINESS FUEL
${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Good morning, ${name}!

Ready to fuel your ${businessName} success today? Here's your personalized business insight digest.

TODAY'S INSPIRATION
"${motivationalQuote.text}" - ${motivationalQuote.author}

YOUR PROGRESS SNAPSHOT
🎯 Goals: ${goalStats.activeGoals}/${goalStats.totalGoals} active
📝 Journal Streak: ${journalStreak} days

Ready to make today count? Open your Bizzin dashboard: https://bizzin.replit.app

---
Keep building your entrepreneurial success! 🚀
Update preferences or unsubscribe at any time.
`;
}

// Send email via SMTP2GO API
export async function sendEmail(emailContent, recipientEmail, env) {
  try {
    console.log(`📤 Sending email to ${recipientEmail} via SMTP2GO API`);
    
    // Prepare email payload for SMTP2GO API
    const emailPayload = {
      to: [recipientEmail],
      from: 'notifications@bizzin.co.za',
      subject: emailContent.subject,
      html_body: emailContent.html_content,
      text_body: emailContent.text_content,
      custom_headers: [
        {
          header: 'Reply-To',
          value: 'support@bizzin.co.za'
        }
      ]
    };
    
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': env.SMTP2GO_API_KEY
      },
      body: JSON.stringify(emailPayload)
    });
    
    const result = await response.json();
    
    if (response.ok && result.request_id) {
      console.log(`✅ Email sent successfully via SMTP2GO - ID: ${result.request_id}`);
      return {
        success: true,
        messageId: result.request_id,
        service: 'smtp2go'
      };
    } else {
      console.error('❌ SMTP2GO API error:', result);
      return {
        success: false,
        error: result.error || 'SMTP2GO API error',
        response: result
      };
    }
    
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper Functions

function calculateGoalStats(goals) {
  if (!goals || goals.length === 0) {
    return { totalGoals: 0, activeGoals: 0, completedGoals: 0 };
  }
  
  const activeGoals = goals.filter(g => g.status === 'active' || !g.status).length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  
  return {
    totalGoals: goals.length,
    activeGoals,
    completedGoals
  };
}

function calculateJournalStreak(entries) {
  if (!entries || entries.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check for consecutive days with journal entries
  for (let i = 0; i < 30; i++) { // Max 30 day streak check
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    
    const hasEntry = entries.some(entry => {
      const entryDate = new Date(entry.created_at);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === checkDate.getTime();
    });
    
    if (hasEntry) {
      streak++;
    } else if (i > 0) { // Allow for today not having an entry yet
      break;
    }
  }
  
  return streak;
}

function getMotivationalQuote() {
  const quotes = [
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" }
  ];
  
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  return quotes[dayOfYear % quotes.length];
}

function generateBusinessInsights(goals, journalEntries, profile) {
  const insights = [];
  
  // Goal-based insights
  if (goals && goals.length > 0) {
    const overdueGoals = goals.filter(g => g.target_date && new Date(g.target_date) < new Date() && g.status !== 'completed');
    if (overdueGoals.length > 0) {
      insights.push(`You have ${overdueGoals.length} goal${overdueGoals.length > 1 ? 's' : ''} that need attention. Consider breaking them into smaller milestones.`);
    }
    
    const recentGoals = goals.filter(g => {
      const goalDate = new Date(g.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return goalDate > weekAgo;
    });
    
    if (recentGoals.length > 0) {
      insights.push(`Great momentum! You've set ${recentGoals.length} new goal${recentGoals.length > 1 ? 's' : ''} this week. Keep that ambition flowing.`);
    }
  }
  
  // Journal-based insights
  if (journalEntries && journalEntries.length > 0) {
    const recentEntries = journalEntries.filter(e => {
      const entryDate = new Date(e.created_at);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return entryDate > threeDaysAgo;
    });
    
    if (recentEntries.length >= 3) {
      insights.push(`Excellent reflection habit! You've journaled consistently this week. This self-awareness is key to business growth.`);
    }
  }
  
  // Default insight if no specific patterns found
  if (insights.length === 0) {
    insights.push(`Remember: every successful entrepreneur started with a single step. Your journey matters, and today is another opportunity to move forward.`);
  }
  
  return insights.slice(0, 3); // Max 3 insights
}

function generateActionItems(goals, journalEntries) {
  const actions = [];
  
  // Goal-based actions
  if (goals && goals.length > 0) {
    const goalsWithoutProgress = goals.filter(g => 
      g.status === 'active' && (!g.milestones || g.milestones.length === 0)
    );
    
    if (goalsWithoutProgress.length > 0) {
      actions.push('Break down your active goals into specific, measurable milestones');
    }
    
    const staleGoals = goals.filter(g => {
      const goalDate = new Date(g.updated_at || g.created_at);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      return goalDate < twoWeeksAgo && g.status === 'active';
    });
    
    if (staleGoals.length > 0) {
      actions.push('Review and update your goals - some haven\'t been touched in weeks');
    }
  }
  
  // Journal-based actions
  if (journalEntries && journalEntries.length > 0) {
    const yesterdayEntry = journalEntries.find(e => {
      const entryDate = new Date(e.created_at);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === yesterday.getTime();
    });
    
    if (!yesterdayEntry) {
      actions.push('Take 5 minutes to reflect on yesterday\'s wins and lessons');
    }
  } else {
    actions.push('Start your entrepreneurial journal - even 2 minutes of daily reflection helps');
  }
  
  // Default actions
  if (actions.length === 0) {
    actions.push('Set one small, achievable goal for today');
    actions.push('Connect with one person in your business network');
  }
  
  return actions.slice(0, 4); // Max 4 action items
}