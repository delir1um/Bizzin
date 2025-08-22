// Supabase Client for CloudFlare Workers
// Handles all database interactions for user data, email settings, and logging

// Get eligible users for email sending
export async function getEligibleUsers(timeSlot, env, specificUserId = null) {
  try {
    let query = `${env.SUPABASE_URL}/rest/v1/daily_email_settings?enabled=eq.true&select=user_id,send_time,content_preferences,user_profiles(email,full_name,business_name,business_type)`;
    
    // If specific user ID provided (for test emails)
    if (specificUserId) {
      query = `${env.SUPABASE_URL}/rest/v1/daily_email_settings?user_id=eq.${specificUserId}&enabled=eq.true&select=user_id,send_time,content_preferences,user_profiles(email,full_name,business_name,business_type)`;
    } else if (timeSlot) {
      // Filter by specific time slot
      query += `&send_time=eq.${timeSlot}`;
    }
    
    const response = await fetch(query, {
      method: 'GET',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase query failed (${response.status}): ${errorText}`);
    }
    
    const users = await response.json();
    
    if (!Array.isArray(users)) {
      console.error('Invalid response format from Supabase:', users);
      return [];
    }
    
    // Filter out users without proper email configuration
    const validUsers = users.filter(user => {
      const profile = user.user_profiles;
      if (!profile || !profile.email) {
        console.warn(`User ${user.user_id} has no email address, skipping`);
        return false;
      }
      return true;
    });
    
    console.log(`📊 Found ${validUsers.length} valid users (${users.length - validUsers.length} excluded)`);
    
    return validUsers;
    
  } catch (error) {
    console.error('❌ Error fetching eligible users:', error);
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
}

// Check if email was already sent today for a specific user
export async function checkEmailAlreadySent(userId, date, env) {
  try {
    const query = `${env.SUPABASE_URL}/rest/v1/email_delivery_log?user_id=eq.${userId}&email_type=eq.daily_digest&sent_at=gte.${date}T00:00:00.000Z&sent_at=lt.${date}T23:59:59.999Z&limit=1`;
    
    const response = await fetch(query, {
      method: 'GET',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Error checking email status (${response.status}):`, await response.text());
      return false; // Assume not sent if we can't check
    }
    
    const logs = await response.json();
    const alreadySent = Array.isArray(logs) && logs.length > 0;
    
    if (alreadySent) {
      console.log(`📧 Email already sent today for user ${userId} at ${logs[0].sent_at}`);
    }
    
    return alreadySent;
    
  } catch (error) {
    console.error('Error checking email delivery status:', error);
    return false; // Assume not sent if check fails
  }
}

// Log email delivery to database
export async function logEmailDelivery(userId, emailType, success, env, messageId = null, errorMessage = null) {
  try {
    const logEntry = {
      user_id: userId,
      email_type: emailType,
      sent_at: success ? new Date().toISOString() : null,
      delivery_status: success ? 'sent' : 'failed',
      message_id: messageId,
      error_message: success ? null : errorMessage,
      processing_time: null, // Could be added if needed
      worker_id: 'cloudflare-worker'
    };
    
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/email_delivery_log`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(logEntry)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to log email delivery (${response.status}):`, errorText);
      return false;
    }
    
    console.log(`📝 Email delivery logged: ${success ? 'SUCCESS' : 'FAILURE'} for user ${userId}`);
    return true;
    
  } catch (error) {
    console.error('Error logging email delivery:', error);
    return false;
  }
}

// Get user profile data for email personalization
export async function getUserProfile(userId, env) {
  try {
    const query = `${env.SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${userId}&select=*`;
    
    const response = await fetch(query, {
      method: 'GET',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile (${response.status})`);
    }
    
    const profiles = await response.json();
    
    if (!Array.isArray(profiles) || profiles.length === 0) {
      console.warn(`No profile found for user ${userId}`);
      return null;
    }
    
    return profiles[0];
    
  } catch (error) {
    console.error(`Error fetching user profile for ${userId}:`, error);
    return null;
  }
}

// Get user's goals for email content
export async function getUserGoals(userId, env) {
  try {
    const query = `${env.SUPABASE_URL}/rest/v1/goals?user_id=eq.${userId}&select=*,milestones(*)&limit=5&order=created_at.desc`;
    
    const response = await fetch(query, {
      method: 'GET',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Error fetching goals (${response.status}):`, await response.text());
      return [];
    }
    
    const goals = await response.json();
    return Array.isArray(goals) ? goals : [];
    
  } catch (error) {
    console.error(`Error fetching goals for user ${userId}:`, error);
    return [];
  }
}

// Get user's recent journal entries for email content
export async function getUserJournalEntries(userId, env, limit = 10) {
  try {
    const query = `${env.SUPABASE_URL}/rest/v1/journal_entries?user_id=eq.${userId}&select=*&order=created_at.desc&limit=${limit}`;
    
    const response = await fetch(query, {
      method: 'GET',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Error fetching journal entries (${response.status}):`, await response.text());
      return [];
    }
    
    const entries = await response.json();
    return Array.isArray(entries) ? entries : [];
    
  } catch (error) {
    console.error(`Error fetching journal entries for user ${userId}:`, error);
    return [];
  }
}

// Get email analytics for monitoring
export async function getEmailAnalytics(env, days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const query = `${env.SUPABASE_URL}/rest/v1/email_delivery_log?sent_at=gte.${startDate.toISOString()}&select=*&order=sent_at.desc&limit=1000`;
    
    const response = await fetch(query, {
      method: 'GET',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch analytics (${response.status})`);
    }
    
    const logs = await response.json();
    
    if (!Array.isArray(logs)) {
      return { total: 0, success: 0, failed: 0, rate: 0 };
    }
    
    const stats = logs.reduce((acc, log) => {
      acc.total++;
      if (log.delivery_status === 'sent') {
        acc.success++;
      } else {
        acc.failed++;
      }
      return acc;
    }, { total: 0, success: 0, failed: 0 });
    
    stats.rate = stats.total > 0 ? (stats.success / stats.total * 100).toFixed(1) : 0;
    
    return stats;
    
  } catch (error) {
    console.error('Error fetching email analytics:', error);
    return { total: 0, success: 0, failed: 0, rate: 0, error: error.message };
  }
}

// Store daily email content (if needed for auditing)
export async function storeDailyEmailContent(userId, emailContent, env) {
  try {
    const contentRecord = {
      user_id: userId,
      email_date: new Date().toISOString().split('T')[0],
      subject: emailContent.subject,
      content: emailContent.html_content,
      template_version: emailContent.template_version || '1.0',
      generated_at: new Date().toISOString()
    };
    
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/daily_email_content`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(contentRecord)
    });
    
    if (!response.ok && response.status !== 409) { // 409 = duplicate key (already exists for today)
      console.error(`Failed to store email content (${response.status}):`, await response.text());
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Error storing email content:', error);
    return false;
  }
}