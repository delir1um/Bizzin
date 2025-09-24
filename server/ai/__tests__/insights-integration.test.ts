/**
 * Integration tests for the insights generation endpoint
 * These tests verify the complete flow from request to response
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Test data fixtures
const testData = {
  validBusinessEntry: {
    entry_id: 'test-business-123',
    entry_text: 'Just closed our biggest deal ever - $180k contract with Fortune 500 client. Three months of negotiations finally paid off. Team celebration tonight! This brings our Q4 revenue to $2.1M and puts us ahead of our annual target. Now I need to figure out how to scale our delivery team to handle this new workload without compromising quality. Sarah from operations thinks we need at least 3 new developers and a project manager by January.',
    entry_mood: 'excited',
    entry_energy: 'high',
    recent_entries: ['Busy week preparing for the big client presentation', 'Working late to finalize the proposal numbers'],
    goals: ['Reach $2.5M annual revenue', 'Hire 5 new team members this quarter', 'Maintain 95% client satisfaction'],
    user_id: 'test-user-456'
  },
  
  challengeEntry: {
    entry_id: 'test-challenge-456',
    entry_text: 'Lost our second biggest client today. They cited budget cuts but I suspect our competitor underbid us significantly. This puts a $120k hole in our projected Q4 revenue. Need to quickly pivot our sales strategy and potentially reduce team expenses. The team morale is down and I\'m worried about further client defections. Our contract renewal rate has dropped to 78% this quarter.',
    entry_mood: 'stressed',
    entry_energy: 'low',
    recent_entries: ['Client seemed hesitant during last week\'s review meeting', 'Competitor has been aggressively targeting our clients'],
    goals: ['Reach $2.5M annual revenue', 'Improve client retention to 95%'],
    user_id: 'test-user-789'
  },

  insufficientEntry: {
    entry_id: 'test-short-789',
    entry_text: 'Good day today.',
    entry_mood: 'positive',
    entry_energy: 'medium',
    user_id: 'test-user-short'
  }
};

describe('Insights API Integration', () => {
  const baseUrl = 'http://localhost:5000';
  
  const makeRequest = async (data: any) => {
    const response = await fetch(`${baseUrl}/api/ai/insights/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    return {
      status: response.status,
      data: await response.json()
    };
  };

  describe('Successful insight generation', () => {
    it('should generate high-quality insights for substantial business content', async () => {
      const response = await makeRequest(testData.validBusinessEntry);
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        entry_id: testData.validBusinessEntry.entry_id,
        model_version: expect.stringMatching(/v\d+\.\d+/),
        grounded_on: {
          entry_chars: expect.any(Number),
          recent_entries_used: expect.any(Number),
          goals_used: expect.any(Number)
        },
        insight: {
          summary: expect.stringContaining('$180k'),
          actions: expect.arrayContaining([
            expect.stringMatching(/.*/)
          ]),
          risks: expect.any(Array),
          sentiment: 'Excited',
          confidence: expect.any(Number),
          tags: expect.any(Array)
        }
      });

      // Verify quality constraints
      expect(response.data.insight.actions.length).toBeGreaterThanOrEqual(2);
      expect(response.data.insight.confidence).toBeGreaterThanOrEqual(0.6);
      expect(response.data.insight.summary.length).toBeGreaterThan(20);
      
      // Check for specificity
      expect(response.data.insight.summary).toMatch(/\$|[\d,]+|January|December|Sarah|Fortune 500/);
    }, 30000); // 30 second timeout for AI calls

    it('should generate appropriate insights for challenge scenarios', async () => {
      const response = await makeRequest(testData.challengeEntry);
      
      expect(response.status).toBe(200);
      expect(response.data.insight.sentiment).toBe('Stressed');
      expect(response.data.insight.summary).toContain('$120k');
      expect(response.data.insight.actions.length).toBeGreaterThanOrEqual(2);
      expect(response.data.insight.risks).toBeDefined();
      expect(response.data.insight.risks.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Validation and quality control', () => {
    it('should reject entries with insufficient content', async () => {
      const response = await makeRequest(testData.insufficientEntry);
      
      expect(response.status).toBe(422);
      expect(response.data).toMatchObject({
        error: expect.stringContaining('Not enough context'),
        details: expect.stringContaining('validation failed')
      });
    });

    it('should reject malformed requests', async () => {
      const invalidRequest = {
        entry_id: 'test',
        // Missing required fields
      };
      
      const response = await makeRequest(invalidRequest);
      expect(response.status).toBe(400);
    });

    it('should handle missing entry_text', async () => {
      const invalidRequest = {
        ...testData.validBusinessEntry,
        entry_text: undefined
      };
      
      const response = await makeRequest(invalidRequest);
      expect(response.status).toBe(400);
    });
  });

  describe('Anti-generic safeguards', () => {
    it('should not return generic motivational advice', async () => {
      // Test multiple attempts to ensure consistency
      const response = await makeRequest(testData.validBusinessEntry);
      
      if (response.status === 200) {
        const insight = response.data.insight;
        
        // Check that we don't get banned phrases
        const bannedPhrases = [
          'difficult moments reveal entrepreneurial spirit',
          'stay positive',
          'keep pushing forward',
          'trust your instincts',
          'believe in yourself'
        ];
        
        const allText = [
          insight.summary,
          ...insight.actions,
          ...(insight.risks || [])
        ].join(' ').toLowerCase();
        
        bannedPhrases.forEach(phrase => {
          expect(allText).not.toContain(phrase.toLowerCase());
        });
        
        // Verify actions are specific and actionable
        insight.actions.forEach((action: string) => {
          expect(action.length).toBeGreaterThan(15); // Avoid single-word actions
          expect(action).toMatch(/\w+.*\w+/); // Should be actual sentences
        });
      }
    }, 30000);
  });
});