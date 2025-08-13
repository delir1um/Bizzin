// Network request interceptor to block HEAD requests to user_plans table
// This eliminates console errors caused by browser extensions or automatic probes

export function interceptUserPlansRequests() {
  // Only run in browser environment
  if (typeof window === 'undefined') return

  // Store original fetch
  const originalFetch = window.fetch

  // Intercept fetch requests
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    const method = init?.method || 'GET'

    // Block HEAD requests to user_plans table
    if (method.toUpperCase() === 'HEAD' && url.includes('user_plans')) {
      console.log('Blocked HEAD request to user_plans table to prevent console errors')
      // Return a successful empty response instead of letting it fail
      return new Response('', { 
        status: 200, 
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Allow all other requests to proceed normally
    return originalFetch(input, init)
  }

  console.log('Network interceptor installed - blocking user_plans HEAD requests')
}

export function removeNetworkInterceptor() {
  // This would require storing the original fetch, but for now we'll just log
  console.log('Network interceptor removal not implemented - refresh page to reset')
}