-- Create the journal_entries table with proper schema
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood TEXT,
    category TEXT,
    tags TEXT[],
    reading_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own journal entries" ON journal_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries" ON journal_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" ON journal_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" ON journal_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at);