// Plans API Routes - User billing and subscription management
import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// User authentication middleware
const requireUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required: Missing or invalid Authorization header' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token with Supabase
    const { data: userJWT, error: jwtError } = await supabase.auth.getUser(token);
    
    if (jwtError || !userJWT.user) {
      return res.status(401).json({ 
        error: 'Authentication failed: Invalid or expired token' 
      });
    }

    // Attach verified user to request
    (req as any).authenticatedUser = userJWT.user;
    next();
  } catch (error) {
    console.error('❌ User authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Get user plan details with payment information
router.get('/user-plan-details', requireUser, async (req, res) => {
  try {
    const userId = (req as any).authenticatedUser.id;
    
    console.log(`📋 Fetching plan details for user: ${userId}`);
    
    // Get user plan with payment status and subscription details  
    const { data: userPlan, error } = await supabase
      .from('user_plans')
      .select(`
        id,
        plan_type,
        expires_at,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user plan:', error);
      return res.status(500).json({ error: 'Failed to fetch plan details' });
    }

    if (!userPlan) {
      // Return default free plan if no plan exists
      return res.json({
        plan_type: 'free',
        expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    console.log(`✅ Plan details retrieved for user: ${userId}`);
    res.json(userPlan);
  } catch (error) {
    console.error('❌ Error in user-plan-details endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current plan status and usage (this might already exist elsewhere, but keeping it simple)
router.get('/status', requireUser, async (req, res) => {
  try {
    const userId = (req as any).authenticatedUser.id;
    
    console.log(`📊 Fetching plan status for user: ${userId}`);
    
    // Get user plan status
    const { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('plan_type, expires_at')
      .eq('user_id', userId)
      .single();

    if (planError) {
      console.error('Error fetching plan status:', planError);
      return res.status(500).json({ error: 'Failed to fetch plan status' });
    }

    // Get usage data if needed
    const { data: usage, error: usageError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (usageError && usageError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.warn('Warning fetching usage data:', usageError);
    }

    const response = {
      plan: userPlan || { plan_type: 'free', payment_status: 'free' },
      usage: usage || null
    };

    console.log(`✅ Plan status retrieved for user: ${userId}`);
    res.json(response);
  } catch (error) {
    console.error('❌ Error in plan status endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;