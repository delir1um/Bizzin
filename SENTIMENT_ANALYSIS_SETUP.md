# AI Business Sentiment Analysis Setup

## Database Migration Required

To enable the new AI business sentiment analysis features, you need to add a new column to your Supabase database.

### Steps to Enable AI Sentiment Analysis:

1. **Open your Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration SQL**
   Copy and paste this SQL code, then click "Run":

```sql
-- Add sentiment_data column to journal_entries table
-- This column will store AI-generated business sentiment analysis

ALTER TABLE journal_entries 
ADD COLUMN sentiment_data JSONB;

-- Create an index on sentiment_data for faster queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_sentiment_data 
ON journal_entries USING GIN (sentiment_data);

-- Add a comment to document the column
COMMENT ON COLUMN journal_entries.sentiment_data IS 'AI-generated business sentiment analysis including mood, confidence, energy, emotions, insights, and business category';
```

4. **Enable AI Sentiment Analysis in Code**
   After the database migration is complete, I'll uncomment the sentiment analysis code to start generating AI insights for all new journal entries.

## What This Enables:

✅ **Automatic Business Mood Detection** - AI analyzes your writing to detect emotions like confident, excited, stressed, focused, etc.

✅ **Energy Level Tracking** - Automatically categorizes your business energy as high, medium, or low

✅ **Business Context Recognition** - Identifies whether entries relate to growth, challenges, achievements, planning, or reflection

✅ **Personalized Business Insights** - Generates relevant feedback like "Your confidence is showing - this mindset often leads to breakthrough moments"

✅ **Smart Emotion Badges** - Visual indicators showing your business emotional state in journal entries

✅ **Pattern Recognition** - AI spots trends in your business journey and provides contextual advice

## How It Works:

The AI analyzes the content and title of your journal entries using business-focused natural language processing to:

- Detect emotions relevant to entrepreneurship
- Assign confidence levels to mood predictions  
- Generate actionable business insights
- Categorize the business context of your writing
- Track energy patterns over time

Once you run the SQL migration, create a new journal entry and you'll see the AI sentiment analysis in action!