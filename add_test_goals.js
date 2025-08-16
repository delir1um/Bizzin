// Add test goals directly using Supabase client
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kexynehhdgyfqxvwoedfr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtleHluZWhoZGd5ZnF4dndvZWRmciIsInJvbGUiOiJhbm9uIiwiZXhwIjoyMTQwNTU4NjY5LCJpYXQiOjE3MjQ5OTg2Njl9.1GZEcNzE0LYqS-_UzY6FKpOcSVZN9eFY7ZZNdvz9Pio'
const supabase = createClient(supabaseUrl, supabaseKey)

const testGoals = [
  {
    title: 'Launch MVP Product',
    description: 'Complete development and launch our minimum viable product to gather user feedback and validate market demand.',
    deadline: '2025-09-15',
    priority: 'high',
    category: 'Product Development',
    target_value: 100,
    current_value: 75,
    status: 'in_progress',
    user_id: '9502ea97-1adb-4115-ba05-1b6b1b5fa721'
  },
  {
    title: 'Reach 1000 Newsletter Subscribers',
    description: 'Build our email list to establish a direct marketing channel and community of engaged prospects.',
    deadline: '2025-08-31',
    priority: 'medium',
    category: 'Marketing',
    target_value: 1000,
    current_value: 340,
    status: 'in_progress',
    user_id: '9502ea97-1adb-4115-ba05-1b6b1b5fa721'
  },
  {
    title: 'Complete Business Plan',
    description: 'Finalize comprehensive business plan including financial projections, market analysis, and growth strategy.',
    deadline: '2025-09-01',
    priority: 'high',
    category: 'Planning',
    target_value: 100,
    current_value: 60,
    status: 'in_progress',
    user_id: '9502ea97-1adb-4115-ba05-1b6b1b5fa721'
  },
  {
    title: 'Secure First 5 Paying Customers',
    description: 'Convert prospects into paying customers to validate our pricing model and generate initial revenue.',
    deadline: '2025-10-15',
    priority: 'high',
    category: 'Sales',
    target_value: 5,
    current_value: 2,
    status: 'in_progress',
    user_id: '9502ea97-1adb-4115-ba05-1b6b1b5fa721'
  },
  {
    title: 'Build Social Media Presence',
    description: 'Establish consistent brand presence across LinkedIn, Twitter, and Instagram to increase brand awareness.',
    deadline: '2025-12-31',
    priority: 'medium',
    category: 'Marketing',
    target_value: 10000,
    current_value: 1200,
    status: 'in_progress',
    user_id: '9502ea97-1adb-4115-ba05-1b6b1b5fa721'
  },
  {
    title: 'Hire First Employee',
    description: 'Recruit and onboard our first team member to help scale operations and product development.',
    deadline: '2025-11-30',
    priority: 'low',
    category: 'Team Building',
    target_value: 1,
    current_value: 0,
    status: 'not_started',
    user_id: '9502ea97-1adb-4115-ba05-1b6b1b5fa721'
  }
]

async function addTestGoals() {
  console.log('Adding test goals to Supabase...')
  
  for (const goal of testGoals) {
    // Calculate progress percentage
    const progress = goal.target_value > 0 ? Math.round((goal.current_value / goal.target_value) * 100) : 0
    
    const goalWithProgress = {
      ...goal,
      progress
    }
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([goalWithProgress])
        .select()
      
      if (error) {
        console.error('❌ Error adding goal:', goal.title, error)
      } else {
        console.log('✅ Added goal:', goal.title, `(${progress}% complete)`)
      }
    } catch (err) {
      console.error('❌ Exception adding goal:', goal.title, err)
    }
  }
  
  console.log('Finished adding test goals!')
}

addTestGoals()