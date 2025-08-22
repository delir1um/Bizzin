// Monitoring and Analytics for CloudFlare Worker
// Tracks worker performance, email statistics, and system health

import { getEmailAnalytics } from './supabaseClient.js';

// Log worker activity for monitoring and debugging
export async function logWorkerActivity(activityType, env, details = null) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      activity_type: activityType,
      details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
      worker_version: '1.0.0'
    };
    
    // Log to console for CloudFlare Worker logs
    console.log(`📊 [${activityType.toUpperCase()}] ${timestamp}${details ? ': ' + details : ''}`);
    
    // Store in KV for recent activity tracking (optional)
    if (env.EMAIL_CACHE) {
      const activityKey = `activity_${timestamp}_${activityType}`;
      await env.EMAIL_CACHE.put(activityKey, JSON.stringify(logEntry), { 
        expirationTtl: 86400 * 7 // 7 days
      });
    }
    
    // Log to Supabase for persistent monitoring (if needed)
    await logToSupabase(logEntry, env);
    
  } catch (error) {
    console.error('Failed to log worker activity:', error);
    // Don't throw - logging failures shouldn't break email processing
  }
}

// Get comprehensive worker statistics
export async function getWorkerStats(env) {
  try {
    const stats = {
      worker: {
        version: '1.0.0',
        environment: 'cloudflare-workers',
        timestamp: new Date().toISOString()
      },
      recent_activity: await getRecentActivity(env),
      email_analytics: await getEmailAnalytics(env, 7), // Last 7 days
      system_health: await getSystemHealth(env)
    };
    
    return stats;
    
  } catch (error) {
    console.error('Error gathering worker stats:', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Get recent worker activity from KV cache
async function getRecentActivity(env) {
  try {
    if (!env.EMAIL_CACHE) {
      return { error: 'KV cache not available' };
    }
    
    // Get activity from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const activities = [];
    const activityPrefix = 'activity_';
    
    // Note: In production, you might want to use KV list operations
    // For now, we'll return a summary based on recent successful operations
    
    return {
      last_24_hours: 'Activity tracking active',
      cache_available: true
    };
    
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return { error: error.message };
  }
}

// Check system health
async function getSystemHealth(env) {
  const health = {
    timestamp: new Date().toISOString(),
    services: {},
    overall_status: 'healthy'
  };
  
  // Check Supabase connectivity
  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY
      }
    });
    
    health.services.supabase = {
      status: response.ok ? 'healthy' : 'unhealthy',
      response_time: response.headers.get('x-response-time') || 'unknown',
      last_check: new Date().toISOString()
    };
    
    if (!response.ok) {
      health.overall_status = 'degraded';
    }
    
  } catch (error) {
    health.services.supabase = {
      status: 'error',
      error: error.message,
      last_check: new Date().toISOString()
    };
    health.overall_status = 'unhealthy';
  }
  
  // Check SMTP2GO API
  try {
    // Note: We don't want to send a test email for health check
    // Just verify we have the API key
    health.services.smtp2go = {
      status: env.SMTP2GO_API_KEY ? 'configured' : 'not_configured',
      last_check: new Date().toISOString()
    };
    
    if (!env.SMTP2GO_API_KEY) {
      health.overall_status = 'configuration_error';
    }
    
  } catch (error) {
    health.services.smtp2go = {
      status: 'error',
      error: error.message,
      last_check: new Date().toISOString()
    };
  }
  
  // Check KV cache
  try {
    if (env.EMAIL_CACHE) {
      // Test KV operation
      const testKey = `health_check_${Date.now()}`;
      await env.EMAIL_CACHE.put(testKey, 'ok', { expirationTtl: 60 });
      const testValue = await env.EMAIL_CACHE.get(testKey);
      
      health.services.kv_cache = {
        status: testValue === 'ok' ? 'healthy' : 'unhealthy',
        last_check: new Date().toISOString()
      };
    } else {
      health.services.kv_cache = {
        status: 'not_configured',
        last_check: new Date().toISOString()
      };
    }
  } catch (error) {
    health.services.kv_cache = {
      status: 'error',
      error: error.message,
      last_check: new Date().toISOString()
    };
  }
  
  return health;
}

// Log activity to Supabase for persistent monitoring
async function logToSupabase(logEntry, env) {
  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/worker_activity_log`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        ...logEntry,
        worker_id: 'cloudflare-email-worker'
      })
    });
    
    if (!response.ok && response.status !== 404) {
      // 404 might mean the table doesn't exist, which is fine
      console.warn(`Failed to log to Supabase (${response.status})`);
    }
    
  } catch (error) {
    // Don't throw - Supabase logging is optional
    console.warn('Supabase logging failed:', error.message);
  }
}

// Performance monitoring utilities
export function measurePerformance(name, fn) {
  return async (...args) => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      console.log(`⚡ ${name} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ ${name} failed after ${duration}ms:`, error);
      throw error;
    }
  };
}

// Alert thresholds and monitoring
export function shouldAlert(stats) {
  const alerts = [];
  
  // Check email success rate
  if (stats.email_analytics && stats.email_analytics.rate < 90) {
    alerts.push({
      type: 'email_failure_rate',
      message: `Email success rate is ${stats.email_analytics.rate}% (below 90% threshold)`,
      severity: 'warning'
    });
  }
  
  if (stats.email_analytics && stats.email_analytics.rate < 75) {
    alerts.push({
      type: 'email_critical_failure',
      message: `Email success rate is critically low at ${stats.email_analytics.rate}%`,
      severity: 'critical'
    });
  }
  
  // Check system health
  if (stats.system_health && stats.system_health.overall_status !== 'healthy') {
    alerts.push({
      type: 'system_health',
      message: `System health is ${stats.system_health.overall_status}`,
      severity: stats.system_health.overall_status === 'unhealthy' ? 'critical' : 'warning'
    });
  }
  
  return alerts;
}

// Export worker metrics in Prometheus format (if needed)
export function exportMetrics(stats) {
  const timestamp = Date.now();
  
  return `
# HELP bizzin_emails_sent_total Total number of emails sent
# TYPE bizzin_emails_sent_total counter
bizzin_emails_sent_total ${stats.email_analytics?.success || 0} ${timestamp}

# HELP bizzin_emails_failed_total Total number of failed emails
# TYPE bizzin_emails_failed_total counter
bizzin_emails_failed_total ${stats.email_analytics?.failed || 0} ${timestamp}

# HELP bizzin_email_success_rate Email success rate percentage
# TYPE bizzin_email_success_rate gauge
bizzin_email_success_rate ${stats.email_analytics?.rate || 0} ${timestamp}

# HELP bizzin_system_health System health status (1=healthy, 0=unhealthy)
# TYPE bizzin_system_health gauge
bizzin_system_health ${stats.system_health?.overall_status === 'healthy' ? 1 : 0} ${timestamp}
`.trim();
}