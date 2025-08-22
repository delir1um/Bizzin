// CloudFlare Worker - Daily Digest Email System
// Replaces server-based email schedulers with reliable edge computing

import { handleEmailScheduling, sendTestEmail } from './emailProcessor.js';
import { getWorkerStats, logWorkerActivity } from './monitoring.js';

export default {
  // Cron trigger handler - runs every hour at minute 0
  async scheduled(controller, env, ctx) {
    const startTime = Date.now();
    
    try {
      console.log(`🕐 Cron trigger fired at ${new Date().toISOString()}`);
      
      // Log worker activity
      await logWorkerActivity('cron_triggered', env);
      
      // Handle email scheduling with timeout
      ctx.waitUntil(handleEmailScheduling(env));
      
      const duration = Date.now() - startTime;
      console.log(`✅ Cron processing completed in ${duration}ms`);
      
    } catch (error) {
      console.error('❌ Cron trigger error:', error);
      await logWorkerActivity('cron_error', env, error.message);
      throw error;
    }
  },
  
  // HTTP handler for manual triggers and testing
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Handle OPTIONS request for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200, 
        headers: corsHeaders 
      });
    }
    
    try {
      // Manual email trigger endpoint
      if (path === '/trigger-emails') {
        console.log('🚀 Manual email trigger requested');
        await logWorkerActivity('manual_trigger', env);
        
        const result = await handleEmailScheduling(env);
        const duration = Date.now() - startTime;
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Email processing completed',
          duration: `${duration}ms`,
          result
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Test email endpoint
      if (path === '/test-email') {
        const userId = url.searchParams.get('userId');
        
        if (!userId) {
          return new Response(JSON.stringify({
            success: false,
            error: 'userId parameter required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        console.log(`🧪 Test email requested for user: ${userId}`);
        await logWorkerActivity('test_email', env, userId);
        
        const result = await sendTestEmail(userId, env);
        const duration = Date.now() - startTime;
        
        return new Response(JSON.stringify({
          success: result.success,
          message: result.message || (result.success ? 'Test email sent successfully' : 'Test email failed'),
          duration: `${duration}ms`,
          userId
        }), {
          status: result.success ? 200 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Worker stats endpoint
      if (path === '/stats') {
        const stats = await getWorkerStats(env);
        
        return new Response(JSON.stringify({
          success: true,
          stats,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Health check endpoint
      if (path === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          worker: 'bizzin-email-worker',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          uptime: Date.now() - startTime
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Root endpoint - worker info
      if (path === '/' || path === '') {
        return new Response(JSON.stringify({
          worker: 'Bizzin Email Worker',
          version: '1.0.0',
          description: 'Reliable daily digest email system powered by CloudFlare Workers',
          endpoints: [
            'GET /health - Health check',
            'POST /trigger-emails - Manual email trigger',
            'GET /test-email?userId=<id> - Send test email',
            'GET /stats - Worker statistics'
          ],
          cron: 'Runs every hour at minute 0 (0 * * * *)',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // 404 for unknown paths
      return new Response(JSON.stringify({
        error: 'Not found',
        path,
        available_endpoints: ['/', '/health', '/trigger-emails', '/test-email', '/stats']
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('❌ Request handling error:', error);
      const duration = Date.now() - startTime;
      
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};