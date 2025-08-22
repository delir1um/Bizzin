// Security utilities for CloudFlare Worker
// Authentication, rate limiting, and CORS protection

// Authenticate requests using API token or HMAC
export async function authenticateRequest(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return { authenticated: false, error: 'Missing Authorization header' };
    }

    // Support Bearer token format
    const token = authHeader.replace('Bearer ', '');
    
    // Check against configured admin token
    if (env.WORKER_ADMIN_TOKEN && token === env.WORKER_ADMIN_TOKEN) {
      return { authenticated: true, method: 'token' };
    }

    // Fallback to basic HMAC validation if configured
    if (env.WORKER_HMAC_SECRET) {
      const timestamp = request.headers.get('X-Timestamp');
      const signature = request.headers.get('X-Signature');
      
      if (timestamp && signature) {
        const hmacResult = await validateHmacSignature(request, timestamp, signature, env.WORKER_HMAC_SECRET);
        if (hmacResult.valid) {
          return { authenticated: true, method: 'hmac' };
        }
      }
    }

    return { authenticated: false, error: 'Invalid authentication credentials' };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return { authenticated: false, error: 'Authentication system error' };
  }
}

// HMAC signature validation
async function validateHmacSignature(request, timestamp, signature, secret) {
  try {
    // Check timestamp (prevent replay attacks)
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);
    
    if (Math.abs(now - requestTime) > 300) { // 5 minute window
      return { valid: false, error: 'Request timestamp too old' };
    }

    // Build string to sign
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname + url.search;
    const body = request.method !== 'GET' ? await request.clone().text() : '';
    
    const stringToSign = `${method}\n${path}\n${timestamp}\n${body}`;
    
    // Calculate expected signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return { valid: signature === expectedSignature };
    
  } catch (error) {
    console.error('HMAC validation error:', error);
    return { valid: false, error: 'Signature validation failed' };
  }
}

// Rate limiting using CloudFlare KV
export async function checkRateLimit(endpoint, request, env) {
  try {
    if (!env.EMAIL_CACHE) {
      return { allowed: true }; // No rate limiting if KV not available
    }

    // Use IP address for rate limiting key
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Forwarded-For') || 
                     'unknown';
    
    const rateLimitKey = `rate_limit_${endpoint}_${clientIP}`;
    const now = Math.floor(Date.now() / 1000);
    
    // Get current rate limit data
    const rateLimitData = await env.EMAIL_CACHE.get(rateLimitKey);
    
    let requests = [];
    if (rateLimitData) {
      const data = JSON.parse(rateLimitData);
      requests = data.requests || [];
    }
    
    // Remove requests older than 1 hour
    requests = requests.filter(timestamp => now - timestamp < 3600);
    
    // Define rate limits per endpoint
    const limits = {
      'trigger-emails': 10,  // 10 per hour
      'test-email': 20,      // 20 per hour
      'stats': 100           // 100 per hour
    };
    
    const limit = limits[endpoint] || 60; // Default 60 per hour
    
    if (requests.length >= limit) {
      const oldestRequest = Math.min(...requests);
      const retryAfter = 3600 - (now - oldestRequest);
      
      return { 
        allowed: false, 
        retryAfter: Math.max(retryAfter, 60) // Minimum 1 minute
      };
    }
    
    // Add current request
    requests.push(now);
    
    // Store updated rate limit data
    await env.EMAIL_CACHE.put(rateLimitKey, JSON.stringify({
      requests,
      lastUpdated: now
    }), { expirationTtl: 3600 }); // 1 hour TTL
    
    return { allowed: true };
    
  } catch (error) {
    console.error('Rate limiting error:', error);
    return { allowed: true }; // Allow on error to avoid breaking functionality
  }
}

// Get appropriate CORS headers based on origin
export function getCorsHeaders(origin, env) {
  // Default headers for unknown origins
  const defaultHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Timestamp, X-Signature',
    'Access-Control-Max-Age': '86400',
  };

  // Check if origin is in allowed list
  const allowedOrigins = env.ALLOWED_ORIGINS 
    ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['https://bizzin.replit.app', 'http://localhost:5000', 'http://localhost:3000'];

  if (origin && allowedOrigins.includes(origin)) {
    return {
      ...defaultHeaders,
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true'
    };
  }

  // For health checks and public endpoints, allow any origin
  return {
    ...defaultHeaders,
    'Access-Control-Allow-Origin': '*'
  };
}

// Security headers for all responses
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'none'; script-src 'none'; object-src 'none';"
  };
}

// Validate request payload size
export function validateRequestSize(request, maxSizeKB = 100) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxSizeKB * 1024) {
    return { valid: false, error: `Request too large. Maximum ${maxSizeKB}KB allowed.` };
  }
  return { valid: true };
}

// Simple API key validation (alternative to HMAC)
export function validateApiKey(request, env) {
  const apiKey = request.headers.get('X-API-Key');
  
  if (!apiKey) {
    return { valid: false, error: 'Missing API key' };
  }
  
  if (env.WORKER_API_KEY && apiKey === env.WORKER_API_KEY) {
    return { valid: true };
  }
  
  return { valid: false, error: 'Invalid API key' };
}