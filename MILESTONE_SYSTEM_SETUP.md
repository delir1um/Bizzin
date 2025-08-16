# Milestone System Database Setup

## Overview
This document provides the SQL commands needed to set up the milestone system for goal tracking. The system extends the existing goals table and adds a new milestones table for granular progress tracking.

## Prerequisites
- Access to Supabase dashboard
- Existing goals table in the database

## Setup Instructions

### Step 1: Add progress_type Column to Goals Table

Run this SQL in the Supabase SQL Editor:

```sql
-- Add progress_type column to existing goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS progress_type VARCHAR(20) DEFAULT 'manual' CHECK (progress_type IN ('manual', 'milestone'));

-- Update existing goals to use manual progress type by default
UPDATE goals SET progress_type = 'manual' WHERE progress_type IS NULL;
```

### Step 2: Create Milestones Table

Run this SQL in the Supabase SQL Editor:

```sql
-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date TIMESTAMPTZ,
  weight INTEGER DEFAULT 1 CHECK (weight > 0),
  order_index INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_order ON milestones(goal_id, order_index);
```

### Step 3: Enable Row Level Security

```sql
-- Enable RLS on milestones table
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for data security
CREATE POLICY "Users can view their own milestones" ON milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones" ON milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones" ON milestones
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milestones" ON milestones
  FOR DELETE USING (auth.uid() = user_id);
```

### Step 4: Create Update Trigger

```sql
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on milestones
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Verification

After running the SQL commands, verify the setup by running:

```bash
node verify_milestone_setup.js
```

This will test the database connection and create sample milestone data for testing.

## Features Enabled

- **Milestone-based Progress Tracking**: Goals can now use milestone completion to automatically calculate progress
- **Weighted Milestones**: Each milestone can have a weight for proportional progress calculation
- **Milestone Management**: Full CRUD operations for milestones with proper data validation
- **User Data Security**: Row Level Security ensures users can only access their own milestones
- **Automatic Progress Updates**: Goal progress updates automatically when milestones are completed

## Testing the System

1. Create a goal with `progress_type` set to `'milestone'`
2. Add milestones to the goal using the milestone management interface
3. Check off milestones and observe automatic progress calculation
4. Verify that progress updates reflect the proportion of completed milestones