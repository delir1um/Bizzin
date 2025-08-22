// Utility functions for CloudFlare Worker
// Retry logic, timezone handling, and common utilities

// Exponential backoff retry with jitter
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000, // 1 second
    maxDelay = 30000, // 30 seconds
    jitter = true,
    retryCondition = (error) => true // Retry all errors by default
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn(attempt);
      return { success: true, result, attempt };
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt or non-retryable errors
      if (attempt === maxRetries || !retryCondition(error)) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const delay = jitter 
        ? exponentialDelay * (0.5 + Math.random() * 0.5) // Add 50% jitter
        : exponentialDelay;
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms delay:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { success: false, error: lastError, attempts: maxRetries + 1 };
}

// Check if error is retryable
export function isRetryableError(error) {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // HTTP status codes that are retryable
  if (error.status) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }
  
  // Timeout errors
  if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
    return true;
  }
  
  // Rate limiting
  if (error.message.includes('rate limit') || error.message.includes('RATE_LIMIT')) {
    return true;
  }
  
  return false;
}

// Get South Africa time with proper timezone handling
export function getSouthAfricaTime() {
  try {
    // Use Intl API for accurate timezone handling
    const now = new Date();
    const saTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Johannesburg" }));
    
    return {
      datetime: saTime,
      hour: saTime.getHours(),
      timeSlot: `${saTime.getHours().toString().padStart(2, '0')}:00`,
      date: saTime.toISOString().split('T')[0], // YYYY-MM-DD format
      timestamp: saTime.toISOString()
    };
  } catch (error) {
    // Fallback to UTC+2 if Intl API fails
    console.warn('Using fallback timezone calculation:', error.message);
    const now = new Date();
    const saTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    
    return {
      datetime: saTime,
      hour: saTime.getHours(),
      timeSlot: `${saTime.getHours().toString().padStart(2, '0')}:00`,
      date: saTime.toISOString().split('T')[0],
      timestamp: saTime.toISOString()
    };
  }
}

// Get time window for email processing (handles cron jitter)
export function getEmailTimeWindow() {
  const saTime = getSouthAfricaTime();
  const currentHour = saTime.hour;
  
  // Include previous hour to handle cron jitter
  const prevHour = (currentHour - 1 + 24) % 24;
  
  return {
    currentSlot: `${currentHour.toString().padStart(2, '0')}:00`,
    previousSlot: `${prevHour.toString().padStart(2, '0')}:00`,
    timeSlots: [
      `${currentHour.toString().padStart(2, '0')}:00`,
      `${prevHour.toString().padStart(2, '0')}:00`
    ],
    saTime
  };
}

// Concurrency limiter
export class ConcurrencyLimiter {
  constructor(limit = 5) {
    this.limit = limit;
    this.running = 0;
    this.queue = [];
  }

  async execute(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.tryNext();
    });
  }

  tryNext() {
    if (this.running >= this.limit || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.running--;
        this.tryNext();
      });
  }
}

// Enhanced error with context
export class WorkerError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'WorkerError';
    this.context = context;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

// Format URLs with proper encoding
export function buildSupabaseUrl(baseUrl, table, params = {}) {
  const url = new URL(`/rest/v1/${table}`, baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, value);
    }
  });
  
  return url.toString();
}

// Batch array processing with size limit
export function createBatches(array, batchSize = 10) {
  const batches = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

// Safe JSON parsing
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.warn('JSON parse error:', error.message);
    return fallback;
  }
}

// Performance timing
export function createTimer(name) {
  const start = Date.now();
  
  return {
    end: () => {
      const duration = Date.now() - start;
      console.log(`⚡ ${name}: ${duration}ms`);
      return duration;
    }
  };
}

// Validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Hash string for consistent IDs
export async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get retry delay from response headers
export function getRetryDelay(response) {
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter) {
    const delay = parseInt(retryAfter) * 1000; // Convert to milliseconds
    return Math.min(delay, 60000); // Max 60 seconds
  }
  return null;
}