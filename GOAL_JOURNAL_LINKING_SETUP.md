# Goal-Journal Linking Setup Guide

## Database Migration Required

To enable goal-journal linking functionality, you need to run a database migration in your Supabase dashboard.

### Steps to Complete Setup:

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy and paste the following SQL code:

```sql
-- Add related_goal_id column to journal_entries table for goal-journal linking
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS related_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_related_goal_id 
ON journal_entries(related_goal_id);

-- Add comment for documentation
COMMENT ON COLUMN journal_entries.related_goal_id IS 'Optional reference to a related goal for cross-feature integration';
```

3. **Execute the SQL**
   - Click "Run" to execute the migration
   - You should see a success message

### What This Enables:

✅ **Goal Selection in Journal Creation** - Choose a related goal when writing entries
✅ **Goal Selection in Journal Editing** - Link existing entries to goals  
✅ **Goal Badges on Entries** - Visual indicators showing which goal an entry relates to
✅ **Cross-Feature Analytics** - Foundation for future goal-journal insights

### Verification:

After running the migration, try creating a new journal entry. You should see:
- A "Related Goal (Optional)" dropdown in the creation form
- Your active goals listed as options
- Goal badges appearing on linked entries

### Troubleshooting:

If you encounter any issues:
1. Ensure you have the necessary permissions in Supabase
2. Check that both `journal_entries` and `goals` tables exist
3. Verify the migration completed without errors in the Supabase logs

## What's Next?

Once the migration is complete, Phase 1 of Goal-Journal linking is fully functional. Future phases will include:

- **Phase 2**: Dashboard analytics showing goal-journal correlations
- **Phase 3**: AI-powered suggestions for linking entries to goals