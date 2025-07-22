-- Journal Entries Migration
-- Run this in your Supabase SQL Editor

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood TEXT,
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reading_time INTEGER DEFAULT 1
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags ON journal_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_journal_entries_content_search ON journal_entries USING GIN(to_tsvector('english', title || ' ' || content));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can only see their own journal entries" ON journal_entries;
CREATE POLICY "Users can only see their own journal entries"
    ON journal_entries FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only insert their own journal entries" ON journal_entries;
CREATE POLICY "Users can only insert their own journal entries"
    ON journal_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only update their own journal entries" ON journal_entries;
CREATE POLICY "Users can only update their own journal entries"
    ON journal_entries FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only delete their own journal entries" ON journal_entries;
CREATE POLICY "Users can only delete their own journal entries"
    ON journal_entries FOR DELETE
    USING (auth.uid() = user_id);

-- Insert some sample data for testing (optional)
INSERT INTO journal_entries (title, content, mood, tags, category, user_id) VALUES
('Getting Started', 'Today I''m setting up my business journal to track my entrepreneurial journey. Excited to document my progress and learnings.', 'Optimistic', ARRAY['Setup', 'Planning'], 'Personal', auth.uid()),
('Market Research Day', 'Spent the day analyzing competitor pricing and features. Found some interesting gaps in the market that we could potentially fill.', 'Thoughtful', ARRAY['Research', 'Competition'], 'Research', auth.uid())
ON CONFLICT DO NOTHING;