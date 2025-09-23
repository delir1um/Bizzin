// Fix milestone progress synchronization for existing goals
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMilestoneProgressSync() {
  console.log('🔄 Fixing Milestone Progress Synchronization');
  
  try {
    // Find all milestone-based goals
    const { data: milestoneGoals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .like('description', '%[MILESTONE_BASED]%');
      
    if (goalsError) {
      console.log('❌ Error fetching milestone goals:', goalsError.message);
      return;
    }
    
    console.log(`Found ${milestoneGoals?.length || 0} milestone-based goals`);
    
    for (const goal of milestoneGoals || []) {
      console.log(`\n🎯 Processing goal: ${goal.title}`);
      console.log(`Current goal progress: ${goal.progress}%`);
      
      // Get milestones for this goal
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('goal_id', goal.id)
        .order('order_index', { ascending: true });
        
      if (milestonesError) {
        console.log(`❌ Error fetching milestones for ${goal.title}:`, milestonesError.message);
        continue;
      }
      
      if (!milestones || milestones.length === 0) {
        console.log(`⚠️ No milestones found for ${goal.title}`);
        continue;
      }
      
      console.log(`📊 Found ${milestones.length} milestones:`);
      milestones.forEach((milestone, index) => {
        console.log(`  ${index + 1}. ${milestone.title} (${milestone.weight}%) - ${milestone.completed ? 'COMPLETED' : 'PENDING'}`);
      });
      
      // Calculate correct progress based on milestones
      const totalWeight = milestones.reduce((sum, m) => sum + (m.weight || 0), 0);
      const completedWeight = milestones
        .filter(m => m.completed)
        .reduce((sum, m) => sum + (m.weight || 0), 0);
      const correctProgress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
      
      console.log(`Milestone calculation: ${completedWeight}/${totalWeight} = ${correctProgress}%`);
      
      if (goal.progress !== correctProgress) {
        console.log(`🔄 Syncing: ${goal.progress}% → ${correctProgress}%`);
        
        // Update goal progress to match milestone calculation
        const { error: updateError } = await supabase
          .from('goals')
          .update({ progress: correctProgress })
          .eq('id', goal.id);
          
        if (updateError) {
          console.log(`❌ Failed to update ${goal.title}:`, updateError.message);
        } else {
          console.log(`✅ ${goal.title} progress synced to ${correctProgress}%`);
        }
      } else {
        console.log(`✅ ${goal.title} already in sync at ${correctProgress}%`);
      }
    }
    
    console.log('\n🎉 Progress synchronization complete!');
    console.log('All milestone-based goals now show correct progress based on milestone completion.');
    
  } catch (error) {
    console.error('❌ Sync process failed:', error);
  }
}

fixMilestoneProgressSync();