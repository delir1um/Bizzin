// Email Processing Logic - CloudFlare Worker
// Handles batch processing, retry logic, and email orchestration

import { getEligibleUsers, checkEmailAlreadySent, logEmailDelivery } from './supabaseClient.js';
import { sendEmail, generateEmailContent } from './emailSender.js';
import { logWorkerActivity } from './monitoring.js';
import { getSouthAfricaTime, getEmailTimeWindow, createBatches, ConcurrencyLimiter, WorkerError } from './utils.js';

// Main email processing function called by cron trigger
export async function handleEmailScheduling(env) {
  const startTime = Date.now();
  
  try {
    // Get current South Africa time with proper timezone handling
    const { timeSlots, saTime, currentSlot } = getEmailTimeWindow();
    const southAfricaTime = saTime.datetime;
    
    console.log(`🕐 Processing emails for SA time window: ${timeSlots.join(', ')}`);
    console.log(`📅 Server UTC: ${new Date().toISOString()}`);
    console.log(`🌍 SA Time: ${saTime.timestamp}`);
    
    // Get eligible users from Supabase (using time window to handle cron jitter)
    const users = await getEligibleUsers(timeSlots, env);
    
    if (!users || users.length === 0) {
      console.log(`📭 No users scheduled for time slots: ${timeSlots.join(', ')}`);
      await logWorkerActivity('no_users', env, timeSlots.join(','));
      return {
        success: true,
        message: `No users scheduled for time slots: ${timeSlots.join(', ')}`,
        usersProcessed: 0,
        emailsSent: 0,
        duration: Date.now() - startTime
      };
    }
    
    console.log(`👥 Processing ${users.length} users for time slots: ${timeSlots.join(', ')}`);
    await logWorkerActivity('processing_started', env, `${users.length} users for ${timeSlots.join(',')}`);
    
    // Process emails in batches with concurrency limiting
    const BATCH_SIZE = 8; // Reduced for better reliability
    const batches = createBatches(users, BATCH_SIZE);
    const concurrencyLimiter = new ConcurrencyLimiter(3); // Max 3 concurrent operations
    
    let totalSent = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const results = [];
    
    console.log(`📦 Processing ${batches.length} batches of up to ${BATCH_SIZE} users each`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchStartTime = Date.now();
      
      console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} users)`);
      
      // Process batch with Promise.allSettled and concurrency limiting
      const batchResults = await Promise.allSettled(
        batch.map(user => concurrencyLimiter.execute(
          () => processUserEmail(user, env, southAfricaTime)
        ))
      );
      
      // Analyze batch results
      const batchStats = batchResults.reduce((stats, result, index) => {
        if (result.status === 'fulfilled') {
          const userResult = result.value;
          results.push(userResult);
          
          if (userResult.success) {
            if (userResult.skipped) {
              stats.skipped++;
            } else {
              stats.sent++;
            }
          } else {
            stats.errors++;
            console.error(`❌ User ${batch[index].user_id} failed: ${userResult.error}`);
          }
        } else {
          stats.errors++;
          console.error(`❌ Batch processing error for user ${batch[index]?.user_id}:`, result.reason);
          results.push({
            success: false,
            userId: batch[index]?.user_id,
            error: result.reason?.message || 'Unknown batch error'
          });
        }
        return stats;
      }, { sent: 0, skipped: 0, errors: 0 });
      
      totalSent += batchStats.sent;
      totalSkipped += batchStats.skipped;
      totalErrors += batchStats.errors;
      
      const batchDuration = Date.now() - batchStartTime;
      console.log(`✅ Batch ${i + 1} completed in ${batchDuration}ms: ${batchStats.sent} sent, ${batchStats.skipped} skipped, ${batchStats.errors} errors`);
      
      // Small delay between batches to prevent rate limiting
      if (i < batches.length - 1) {
        console.log(`⏳ Waiting 2s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    const totalDuration = Date.now() - startTime;
    const finalResult = {
      success: true,
      message: `Email processing completed for ${currentTimeSlot}`,
      usersProcessed: users.length,
      emailsSent: totalSent,
      emailsSkipped: totalSkipped,
      errors: totalErrors,
      duration: totalDuration,
      timeSlots: timeSlots,
      results: results.slice(0, 10) // Limit result details in response
    };
    
    console.log(`🎯 Final Results: ${totalSent} sent, ${totalSkipped} skipped, ${totalErrors} errors in ${totalDuration}ms`);
    await logWorkerActivity('processing_completed', env, JSON.stringify(finalResult));
    
    return finalResult;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('💥 Critical error in email processing:', error);
    
    await logWorkerActivity('critical_error', env, error.message);
    
    return {
      success: false,
      error: error.message,
      duration,
      usersProcessed: 0,
      emailsSent: 0
    };
  }
}

// Process individual user email with comprehensive error handling
export async function processUserEmail(userSetting, env, southAfricaTime) {
  const userId = userSetting.user_id;
  const userEmail = userSetting.user_profiles?.email;
  
  try {
    // Validate user data
    if (!userId) {
      throw new Error('Missing user_id');
    }
    
    if (!userEmail) {
      throw new Error('Missing user email address');
    }
    
    const today = southAfricaTime.toISOString().split('T')[0];
    
    // Check if email already sent today using CloudFlare KV for fast caching
    const cacheKey = `email_sent_${userId}_${today}`;
    const cachedSent = await env.EMAIL_CACHE?.get(cacheKey);
    
    if (cachedSent) {
      console.log(`🚫 Email already sent today (cached) for user ${userId}`);
      return {
        success: true,
        userId,
        skipped: true,
        reason: 'already_sent_cached'
      };
    }
    
    // Double-check with database (fallback if cache fails)
    const dbAlreadySent = await checkEmailAlreadySent(userId, today, env);
    
    if (dbAlreadySent) {
      console.log(`🚫 Email already sent today (database) for user ${userId}`);
      // Update cache for next time
      await env.EMAIL_CACHE?.put(cacheKey, 'sent', { expirationTtl: 86400 }); // 24 hours
      return {
        success: true,
        userId,
        skipped: true,
        reason: 'already_sent_database'
      };
    }
    
    console.log(`📧 Generating email for user ${userId} (${userEmail})`);
    
    // Generate personalized email content
    const emailContent = await generateEmailContent(userId, env);
    
    if (!emailContent) {
      throw new Error('Failed to generate email content');
    }
    
    console.log(`📤 Sending email to ${userEmail}...`);
    
    // Send email via SMTP2GO API
    const emailSent = await sendEmail(emailContent, userEmail, env);
    
    if (emailSent.success) {
      // Cache the successful send
      await env.EMAIL_CACHE?.put(cacheKey, 'sent', { expirationTtl: 86400 }); // 24 hours
      
      // Log to Supabase database
      await logEmailDelivery(userId, 'daily_digest', true, env, emailSent.messageId);
      
      console.log(`✅ Email sent successfully to ${userEmail} (ID: ${emailSent.messageId})`);
      
      return {
        success: true,
        userId,
        email: userEmail,
        messageId: emailSent.messageId,
        skipped: false
      };
    } else {
      throw new Error(`Email sending failed: ${emailSent.error}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing email for user ${userId}:`, error);
    
    // Log failed email attempt
    try {
      await logEmailDelivery(userId, 'daily_digest', false, env, null, error.message);
    } catch (logError) {
      console.error('Failed to log email failure:', logError);
    }
    
    return {
      success: false,
      userId,
      email: userEmail,
      error: error.message,
      skipped: false
    };
  }
}

// Test email function for manual triggers
export async function sendTestEmail(userId, env) {
  try {
    console.log(`🧪 Sending test email for user: ${userId}`);
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required'
      };
    }
    
    // Get user data for test email
    const users = await getEligibleUsers(null, env, userId); // Special mode for single user
    
    if (!users || users.length === 0) {
      return {
        success: false,
        error: 'User not found or not configured for emails'
      };
    }
    
    const user = users[0];
    const southAfricaTime = new Date(new Date().getTime() + (2 * 60 * 60 * 1000));
    
    // Process the test email
    const result = await processUserEmail(user, env, southAfricaTime);
    
    if (result.success && !result.skipped) {
      await logWorkerActivity('test_email_sent', env, userId);
      return {
        success: true,
        message: `Test email sent successfully to ${user.user_profiles?.email}`,
        userId,
        messageId: result.messageId
      };
    } else if (result.skipped) {
      return {
        success: false,
        error: `Test email skipped: ${result.reason}`,
        userId
      };
    } else {
      return {
        success: false,
        error: result.error,
        userId
      };
    }
    
  } catch (error) {
    console.error('Test email error:', error);
    await logWorkerActivity('test_email_error', env, `${userId}: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      userId
    };
  }
}

// Utility function to chunk array into batches
export function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}