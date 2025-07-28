import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const setupQueries = [
  // 1. Create podcast_episodes table
  `
  CREATE TABLE IF NOT EXISTS podcast_episodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    series TEXT NOT NULL,
    series_color TEXT,
    episode_number INTEGER,
    audio_url TEXT,
    transcript TEXT,
    key_takeaways JSONB,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,
  
  // 2. Create user_podcast_progress table
  `
  CREATE TABLE IF NOT EXISTS user_podcast_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    episode_id UUID NOT NULL REFERENCES podcast_episodes(id) ON DELETE CASCADE,
    progress_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_listened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, episode_id)
  );
  `,
  
  // 3. Create user_podcast_stats table
  `
  CREATE TABLE IF NOT EXISTS user_podcast_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_episodes_completed INTEGER DEFAULT 0,
    total_listening_time INTEGER DEFAULT 0,
    learning_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_streak_date DATE,
    favorite_series TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,
  
  // 4. Enable Row Level Security
  `ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE user_podcast_progress ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE user_podcast_stats ENABLE ROW LEVEL SECURITY;`,
]

const policyQueries = [
  // Podcast episodes policies
  `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'podcast_episodes' 
      AND policyname = 'Podcast episodes are viewable by authenticated users'
    ) THEN
      CREATE POLICY "Podcast episodes are viewable by authenticated users" ON podcast_episodes
      FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
  END $$;
  `,
  
  // User progress policies
  `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_podcast_progress' 
      AND policyname = 'Users can view own podcast progress'
    ) THEN
      CREATE POLICY "Users can view own podcast progress" ON user_podcast_progress
      FOR SELECT USING (auth.uid() = user_id);
    END IF;
  END $$;
  `,
  
  `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_podcast_progress' 
      AND policyname = 'Users can insert own podcast progress'
    ) THEN
      CREATE POLICY "Users can insert own podcast progress" ON user_podcast_progress
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
  END $$;
  `,
  
  `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_podcast_progress' 
      AND policyname = 'Users can update own podcast progress'
    ) THEN
      CREATE POLICY "Users can update own podcast progress" ON user_podcast_progress
      FOR UPDATE USING (auth.uid() = user_id);
    END IF;
  END $$;
  `,
  
  // User stats policies
  `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_podcast_stats' 
      AND policyname = 'Users can view own podcast stats'
    ) THEN
      CREATE POLICY "Users can view own podcast stats" ON user_podcast_stats
      FOR SELECT USING (auth.uid() = user_id);
    END IF;
  END $$;
  `,
  
  `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_podcast_stats' 
      AND policyname = 'Users can insert own podcast stats'
    ) THEN
      CREATE POLICY "Users can insert own podcast stats" ON user_podcast_stats
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
  END $$;
  `,
  
  `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_podcast_stats' 
      AND policyname = 'Users can update own podcast stats'
    ) THEN
      CREATE POLICY "Users can update own podcast stats" ON user_podcast_stats
      FOR UPDATE USING (auth.uid() = user_id);
    END IF;
  END $$;
  `
]

async function setupDatabase() {
  console.log('Setting up podcast database tables and policies...')
  
  try {
    // Execute table creation queries
    for (const query of setupQueries) {
      console.log('Executing table setup query...')
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.error('Error executing setup query:', error)
        // Continue with other queries even if one fails
      }
    }
    
    // Execute policy creation queries
    for (const query of policyQueries) {
      console.log('Executing policy setup query...')
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.error('Error executing policy query:', error)
        // Continue with other queries even if one fails
      }
    }
    
    console.log('Database setup completed!')
    
    // Verify tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('podcast_episodes')
      .select('id')
      .limit(1)
    
    if (tablesError) {
      console.error('Error verifying tables:', tablesError)
    } else {
      console.log('Tables verified - podcast system is ready!')
    }
    
  } catch (error) {
    console.error('Failed to setup database:', error)
  }
}

// Run the setup
setupDatabase()