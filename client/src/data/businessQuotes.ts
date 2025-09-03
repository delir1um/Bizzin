// Re-export shared business quotes service for client-side usage
export type { BusinessQuote } from '../../../shared/quotes';
export { businessQuotes, BusinessQuoteService } from '../../../shared/quotes';

// This file now imports all quotes functionality from the centralized shared service
// All daily rotation logic is managed in shared/quotes.ts