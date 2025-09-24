import { Insight, InsightResponse } from '../insights';
import type { TInsightResponse, TInsight } from '../insights';

describe('Insights Schema Validation', () => {
  describe('Insight schema validation', () => {
    const validInsight = {
      summary: 'Closed $180k contract bringing Q4 revenue to $2.1M and exceeding annual target',
      actions: ['Draft job descriptions for 3 developers by 15 December', 'Schedule recruitment meetings by 20 December'],
      risks: ['January hiring timeline may be too aggressive'],
      sentiment: 'Excited' as const,
      confidence: 0.9,
      tags: ['scaling', 'recruitment']
    };

    it('should validate valid insight', () => {
      const result = Insight.safeParse(validInsight);
      expect(result.success).toBe(true);
    });

    it('should reject insight with short summary', () => {
      const invalidInsight = {
        ...validInsight,
        summary: 'short' // Less than 30 characters
      };
      const result = Insight.safeParse(invalidInsight);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 30');
      }
    });

    it('should reject insight with invalid sentiment', () => {
      const invalidInsight = {
        ...validInsight,
        sentiment: 'InvalidSentiment' as any
      };
      const result = Insight.safeParse(invalidInsight);
      expect(result.success).toBe(false);
    });

    it('should reject insight with low confidence', () => {
      const invalidInsight = {
        ...validInsight,
        confidence: 1.5 // Invalid: above 1.0
      };
      const result = Insight.safeParse(invalidInsight);
      expect(result.success).toBe(false);
    });

    it('should allow optional risks field', () => {
      const insightWithoutRisks = {
        ...validInsight,
        risks: undefined
      };
      const result = Insight.safeParse(insightWithoutRisks);
      expect(result.success).toBe(true);
    });

    it('should reject insight with insufficient actions', () => {
      const invalidInsight = {
        ...validInsight,
        actions: ['Only one action'] // Less than 2 actions
      };
      const result = Insight.safeParse(invalidInsight);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2');
      }
    });
  });

  describe('InsightResponse schema validation', () => {
    const validResponse: TInsightResponse = {
      entry_id: 'test-123',
      model_version: 'v1.0',
      grounded_on: {
        entry_chars: 435,
        recent_entries_used: 2,
        goals_used: 3
      },
      insight: {
        summary: 'Closed $180k contract, bringing Q4 revenue to $2.1M',
        actions: [
          'Draft job descriptions for 3 developers by 15 December',
          'Schedule recruitment meetings by 20 December'
        ],
        risks: [
          'January hiring timeline may be aggressive',
          'Rapid expansion could strain management'
        ],
        sentiment: 'Excited',
        confidence: 0.9,
        tags: ['scaling', 'recruitment']
      }
    };

    it('should validate valid response', () => {
      const result = InsightResponse.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject response with insufficient actions', () => {
      const invalidResponse = {
        ...validResponse,
        insight: {
          ...validResponse.insight,
          actions: ['Only one action'] // Less than 2 actions
        }
      };
      const result = InsightResponse.safeParse(invalidResponse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2');
      }
    });

    it('should reject response with invalid sentiment', () => {
      const invalidResponse = {
        ...validResponse,
        insight: {
          ...validResponse.insight,
          sentiment: 'InvalidSentiment' as any
        }
      };
      const result = InsightResponse.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should allow optional risks field', () => {
      const responseWithoutRisks = {
        ...validResponse,
        insight: {
          ...validResponse.insight,
          risks: undefined
        }
      };
      const result = InsightResponse.safeParse(responseWithoutRisks);
      expect(result.success).toBe(true);
    });

    it('should validate grounded_on metadata', () => {
      const invalidResponse = {
        ...validResponse,
        grounded_on: {
          entry_chars: -1, // Invalid negative value
          recent_entries_used: 2,
          goals_used: 3
        }
      };
      const result = InsightResponse.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });
});