import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PlusCircle, Plus, Search, BookOpen, Calendar, Brain, ChevronDown, ChevronRight, Flame, TrendingUp, Heart, Sparkles, Zap, X, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { format, isToday, isThisWeek, isThisMonth, isThisYear, startOfDay, subDays, subWeeks, subMonths } from "date-fns"
import type { JournalEntry } from "@/types/journal"
import { SimpleCreateEntryModal } from "@/components/journal/SimpleCreateEntryModal"
import { ViewEntryModal } from "@/components/journal/ViewEntryModal"
import { EditEntryModal } from "@/components/journal/EditEntryModal"
import { AIMigrationDialog } from "@/components/journal/AIMigrationDialog"
import { JournalService } from "@/lib/services/journal"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { getDisplayMoodEmoji, getEntryDisplayData } from "@/lib/journalDisplayUtils"
import { usePlans } from "@/hooks/usePlans"
import { UpgradeModal } from "@/components/plans/UpgradeModal"
import { PlanLimitBanner } from "@/components/plans/PlanLimitBanner"
// AI system initializes per-request now via Hugging Face API

export function JournalPage() {
  const [user, setUser] = useState<any>(null)
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMigrationDialog, setShowMigrationDialog] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isReAnalyzing, setIsReAnalyzing] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    thisWeek: false,  // Start collapsed by default
    thisMonth: false,
    thisYear: false
  })
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  // Get plan information
  const { usageStatus, canCreateJournalEntry, getRemainingQuota, isPremium, isFree } = usePlans()

  // Get current user (AI system initializes per-request now)
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getCurrentUser()
  }, [])

  // Fetch journal entries using direct Supabase query
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching entries:', error)
        return []
      }
      
      return data || []
    },
    enabled: !!user
  })

  // Organize entries by time periods
  const organizeEntriesByTime = (entries: JournalEntry[]) => {
    const now = new Date()
    const currentYear = now.getFullYear()
    
    const results = {
      today: entries.filter(entry => {
        // Prioritize entry_date, fall back to created_at
        const entryDate = new Date(entry.entry_date || entry.created_at || '')
        return isToday(entryDate)
      }),
      thisWeek: entries.filter(entry => {
        const entryDate = new Date(entry.entry_date || entry.created_at || '')
        return !isToday(entryDate) && isThisWeek(entryDate)
      }),
      thisMonth: entries.filter(entry => {
        const entryDate = new Date(entry.entry_date || entry.created_at || '')
        return !isThisWeek(entryDate) && isThisMonth(entryDate)
      }),
      thisYear: entries.filter(entry => {
        const entryDate = new Date(entry.entry_date || entry.created_at || '')
        return !isThisMonth(entryDate) && isThisYear(entryDate)
      }),
      previousYears: {} as Record<number, JournalEntry[]>
    }
    
    // Group entries from previous years
    const previousYearEntries = entries.filter(entry => {
      const entryDate = new Date(entry.entry_date || entry.created_at || '')
      return entryDate.getFullYear() < currentYear
    })
    
    // Group by year
    previousYearEntries.forEach(entry => {
      const entryDate = new Date(entry.entry_date || entry.created_at || '')
      const year = entryDate.getFullYear()
      if (!results.previousYears[year]) {
        results.previousYears[year] = []
      }
      results.previousYears[year].push(entry)
    })
    
    return results
  }

  // Initialize expanded sections with all possible year keys
  useEffect(() => {
    if (entries.length > 0) {
      const organizedEntries = organizeEntriesByTime(entries)
      const allYears = Object.keys(organizedEntries.previousYears)
      
      setExpandedSections(prev => {
        const newSections: Record<string, boolean> = {
          ...prev,
          thisWeek: false,
          thisMonth: false,
          thisYear: false
        }
        
        // Add all previous years as collapsed by default
        allYears.forEach(year => {
          if (!(year in prev)) {
            newSections[year] = false
          } else {
            newSections[year] = prev[year] // Keep current state if it exists
          }
        })
        
        return newSections
      })
    }
  }, [entries])

  // Check for migration needs when entries are loaded
  // Auto-show re-analysis option for existing users with entries (removed auto-popup for better UX)

  // Filter entries based on search
  const filteredEntries = entries.filter((entry: JournalEntry) => {
    const query = searchQuery.toLowerCase()
    const titleMatch = entry.title.toLowerCase().includes(query)
    const contentMatch = entry.content.toLowerCase().includes(query)
    
    // Check category from multiple sources
    const category = entry.category || entry.sentiment_data?.business_category || ''
    const categoryMatch = category.toLowerCase().includes(query)
    
    // Check mood for additional searchability
    const mood = entry.mood || entry.sentiment_data?.primary_mood || ''
    const moodMatch = mood.toLowerCase().includes(query)
    
    return titleMatch || contentMatch || categoryMatch || moodMatch
  })

  const organizedEntries = organizeEntriesByTime(filteredEntries)

  // Use proper plan system data

  const toggleSection = (section: 'thisWeek' | 'thisMonth' | 'thisYear' | string) => {
    setExpandedSections(prev => {
      // If clicking on currently expanded section, collapse it
      if (prev[section]) {
        return { ...prev, [section]: false }
      }
      
      // Otherwise, collapse all and expand only the clicked section
      const newSections: Record<string, boolean> = {}
      Object.keys(prev).forEach(key => {
        newSections[key] = false
      })
      newSections[section] = true
      return newSections
    })
  }



  // All mood, category, and energy display logic is now handled by centralized getEntryDisplayData function

  // Energy label function to match view modal design
  const getEnergyLabel = (energy: string) => {
    switch (energy) {
      case 'high': return 'High Energy'
      case 'medium': return 'Medium Energy'
      case 'low': return 'Low Energy'
      default: return 'Medium Energy'
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy')
  }

  const getThisWeekCount = () => {
    return entries.filter((e: JournalEntry) => {
      const today = new Date()
      const entryDate = new Date(e.created_at || e.entry_date || '')
      const diffTime = today.getTime() - entryDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 7
    }).length
  }

  const getAIAnalyzedCount = () => {
    return entries.filter((e: JournalEntry) => 
      e.sentiment_data?.confidence && e.sentiment_data.confidence > 50
    ).length
  }

  const handleViewEntry = (entry: JournalEntry) => {
    // Always show view modal first for all entries
    setSelectedEntry(entry)
    setShowViewModal(true)
  }

  const handleEditEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry)
    setShowEditModal(true)
  }

  // Check if user can create new entries
  const canCreateEntry = () => {
    return canCreateJournalEntry
  }

  // Handle create entry
  const handleCreateEntry = () => {
    setShowWriteModal(true)
  }

  // Handle adding sample entries - clears existing and generates 10 random entries distributed over 3 months
  const handleAddSamples = async () => {
    if (!user?.id) return
    
    try {
      // First clear all existing entries
      await JournalService.clearAllEntries()
      console.log('Existing entries cleared')
    } catch (error) {
      console.error('Error clearing entries:', error)
      toast({
        title: "Error",
        description: "Failed to clear existing entries. Please try again.",
        variant: "destructive"
      })
      return
    }
    
    // Helper function to generate random date within the last 3 months
    const getRandomDateWithin3Months = () => {
      const now = new Date()
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(now.getMonth() - 3)
      
      const timeDiff = now.getTime() - threeMonthsAgo.getTime()
      const randomTime = Math.random() * timeDiff
      
      return new Date(threeMonthsAgo.getTime() + randomTime)
    }
    
    const businessScenarios = [
      {
        content: "Received word that our biggest client is canceling their contract effective next month. They represent 35% of our revenue and cited budget cuts due to their own restructuring. This is devastating news that came completely out of nowhere. Had lunch with their CTO just last week and everything seemed fine. Now I'm scrambling to understand what really happened and if there's any way to salvage this relationship. Need to immediately cut costs and accelerate deals with other prospects to fill this massive revenue gap."
      },
      {
        content: "Our patent application was approved today after 18 months of waiting! This protects our core algorithm that gives us competitive advantage in the machine learning space. Three competitors have been trying to reverse-engineer our approach, so having IP protection feels like a huge weight off my shoulders. The legal fees were steep but worth every penny. This patent could be valuable for licensing deals or as leverage in future partnerships. Time to update our investor materials with this new asset."
      },
      {
        content: "Discovered that our head of sales has been sharing confidential client information with his previous employer. Internal investigation revealed he copied our entire customer database and pricing strategies before we hired him. Legal team is exploring options but the damage is already done - competitors now know our weak points and pricing models. This breach of trust is devastating and we need to completely overhaul our data security protocols immediately."
      },
      {
        content: "Just returned from the most successful trade show in our company's history. Generated over 300 qualified leads and closed two deals worth R800k right there on the exhibition floor. Our booth was constantly crowded and industry analysts kept mentioning us in their reports. The team did an incredible job preparing interactive demos that really showcased our capabilities. Three international distributors want to partner with us for global expansion. This could be the breakthrough we've been waiting for."
      },
      {
        content: "Workplace accident occurred this morning when a forklift operator injured his back moving inventory. He's been hospitalized and will need surgery followed by months of recovery. I feel terrible about this incident and keep wondering if we could have prevented it somehow. OSHA is investigating and our insurance premiums will likely increase. More importantly, we need to review all safety protocols and invest in better equipment to protect our team. Employee welfare has to be our top priority."
      },
      {
        content: "Our subscription model is finally gaining real traction. Monthly recurring revenue hit R450k this month, up from R180k six months ago. The marketing funnel optimization we implemented is working beautifully - conversion rates improved by 60% and customer acquisition costs dropped by 25%. Retention rates are strong at 94% which indicates solid product-market fit. These metrics are exactly what investors want to see for SaaS businesses. Time to start thinking about scaling the sales team."
      },
      {
        content: "Environmental compliance officer cited us for improper waste disposal practices. Apparently our manufacturing process produces chemicals that require special handling we weren't aware of. The fine is R75k and we have 30 days to implement proper disposal procedures. This completely blindsided us because we thought we were following all regulations. Hiring an environmental consultant to audit our entire operation and ensure we're compliant going forward. Sustainability isn't just good ethics - it's becoming a business necessity."
      },
      {
        content: "Board meeting today was intense. Investors are concerned about our burn rate and want to see profitability by Q2 next year. They're not wrong - we're spending R300k monthly and only generating R180k in revenue. The runway gives us 8 months to turn things around. Need to make tough decisions about staff reductions and feature development priorities. Growth at all costs isn't sustainable. Time to focus on unit economics and operational efficiency rather than just user acquisition."
      },
      {
        content: "Breakthrough in our research lab could revolutionize the entire industry. Our team discovered a way to reduce manufacturing costs by 40% while improving product quality. Early tests show this process could be scaled to industrial production within 6 months. The implications are massive - we could undercut competitors while maintaining healthy margins. Filed provisional patents immediately and considering whether to license this technology or build manufacturing capacity ourselves. This could change everything for our company."
      },
      {
        content: "Customer service team is overwhelmed with support tickets following last week's product update. Response times have doubled and satisfaction scores are dropping. The new features work great but the user interface changes confused existing customers. Social media mentions are turning negative and several customers threatened to cancel unless we fix the usability issues. Need to decide whether to roll back the update or push forward with better onboarding materials. Sometimes progress creates temporary setbacks."
      },
      {
        content: "Received acquisition offer from a Fortune 500 company for R45 million. This is 3x our annual revenue and would provide immediate liquidity for all shareholders. The acquiring company wants to integrate our technology into their existing platform and keep most of our team. However, accepting means giving up our independence and long-term vision of building something bigger. Co-founders are split on whether to sell now or continue growing independently. Life-changing decision that affects everyone in the company."
      },
      {
        content: "Supply chain costs increased by 30% overnight due to new tariffs on imported components. Our main supplier based in Taiwan can't absorb these costs and passed them directly to us. This hits our margins hard just as we were approaching profitability. Evaluating domestic suppliers but quality and capacity concerns remain. May need to raise prices for customers which could hurt our competitive position. Global trade policies are creating uncertainty that makes business planning nearly impossible."
      },
      {
        content: "Hired our first Chief Technology Officer today after 4 months of searching. She comes from Google with 15 years of experience building scalable systems. Her starting salary is high but worth it if she can help us avoid the technical debt that's been slowing development. The engineering team is excited to have someone with her caliber of expertise. She's already identified three critical infrastructure improvements that could double our system performance. Great leaders are expensive but invaluable."
      },
      {
        content: "Cybersecurity incident last night exposed customer email addresses. Hackers gained access through an unpatched vulnerability in our payment processing system. No financial data was compromised but 15,000 customer emails are now in unknown hands. Legal team is handling regulatory notifications while we implement additional security measures. This is exactly the kind of incident that destroys customer trust and damages brand reputation. Investing heavily in cybersecurity wasn't optional - it was essential."
      },
      {
        content: "Product development milestone achieved 3 weeks ahead of schedule. Version 2.0 includes the machine learning features customers have been requesting for months. Beta testing results exceeded expectations with 95% positive feedback and significant performance improvements. Marketing team is preparing launch campaign while sales prepares outreach to enterprise prospects. This release positions us strongly against competitors who are still using rule-based systems. Innovation speed is our biggest competitive advantage."
      },
      {
        content: "Partnership negotiations with Amazon Web Services hit a roadblock over revenue sharing terms. They want 40% of subscription revenue for marketplace access while we can only afford 25% given our current margins. Access to their customer base would accelerate growth but the economics need to work for both parties. Alternative is building our own distribution channels which takes longer but preserves more margin. Strategic partnerships are complex balancing acts between growth and profitability."
      },
      {
        content: "Employee satisfaction survey revealed declining morale due to unclear career advancement opportunities. 70% of staff feel their growth has stagnated and several top performers are updating their resumes. As a startup, we've been focused on survival rather than career development structures. Need to create promotion pathways, mentorship programs, and skills training immediately. Losing talent to competitors because we failed to invest in people development would be tragic and expensive."
      },
      {
        content: "Market research confirmed that our target demographic is shifting toward mobile-first solutions. Desktop usage among our core customers dropped 40% in the past year while mobile engagement increased 150%. Our current web-based platform isn't optimized for mobile experiences which explains recent user retention challenges. Need to prioritize mobile app development immediately or risk becoming irrelevant. Technology shifts require constant adaptation or businesses get left behind."
      },
      {
        content: "Quality control discovered defects in 12% of last month's production batch. Root cause analysis traced the problem to a new supplier who cut corners on materials to offer lower prices. Customer returns are increasing and brand reputation is at risk if defective products reach market. Implementing additional inspection procedures and returning to our previous supplier despite higher costs. Quality compromises are never worth short-term savings when customer trust is involved."
      },
      {
        content: "Regulatory changes in our industry require significant compliance investments we hadn't budgeted for. New data protection laws mandate infrastructure upgrades worth R200k and annual compliance audits. Three competitors have already announced they're exiting certain markets due to compliance costs. This creates opportunity for companies willing to invest in proper compliance frameworks. Regulation often favors established players who can afford compliance over smaller competitors who cannot."
      }
    ]
    
    try {
      // Select all 20 entries for comprehensive AI testing
      const shuffled = businessScenarios.sort(() => 0.5 - Math.random())
      const selectedEntries = shuffled
      
      let added = 0
      for (const entry of selectedEntries) {
        // Generate random date within the last 3 months
        const randomDate = getRandomDateWithin3Months()
        
        // Only pass content and entry_date - let AI generate title, mood, category, and insights
        const textOnlyEntry = {
          title: '', // Let AI generate title from content
          content: entry.content,
          entry_date: randomDate.toISOString(),
          tags: [] // Add empty tags array to satisfy TypeScript
        }
        await JournalService.createEntry(textOnlyEntry)
        added++
      }
      
      // Refresh journal entries
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      
      toast({
        title: "AI Test Scenarios Added!",
        description: `${added} diverse real-world business scenarios added without titles or categories - pure AI analysis testing.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add sample entries. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle bulk re-analysis
  const handleReAnalyzeEntries = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to re-analyze entries.",
        variant: "destructive"
      })
      return
    }
    
    console.log('Starting bulk re-analysis from UI...')
    setIsReAnalyzing(true)
    
    try {
      const result = await JournalService.reAnalyzeAllEntries()
      console.log('Re-analysis result received:', result)
      
      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      
      // Show success notification
      toast({
        title: "Re-analysis Complete!",
        description: `${result.updated} entries updated with enhanced AI v3.0. ${result.errors > 0 ? `${result.errors} errors occurred.` : 'All entries now have inspirational insights!'}`,
      })
      
    } catch (error) {
      console.error('Error re-analyzing entries:', error)
      toast({
        title: "Re-analysis Failed", 
        description: (error as any)?.status || "An error occurred during re-analysis. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsReAnalyzing(false)
      console.log('Re-analysis UI state reset')
    }
  }





  const handleDeleteEntry = async (entry: JournalEntry) => {
    if (!user?.id) return
    
    try {
      console.log('Deleting journal entry:', entry.id, 'for user:', user.id)
      
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entry.id)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      // Close modals and refresh data
      handleCloseModals()
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      // queryClient.invalidateQueries({ queryKey: ['usage-status', user.id] }) // Disabled to prevent HEAD requests
      
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been successfully removed.",
      })
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast({
        title: "Error",
        description: "Failed to delete the entry. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleCloseModals = () => {
    setShowViewModal(false)
    setShowEditModal(false)
    setSelectedEntry(null)
  }

  const handleCollapseAll = () => {
    setExpandedSections({
      thisWeek: false,
      thisMonth: false,
      thisYear: false
    })
  }

  // Calculate enhanced statistics
  const calculateStats = () => {
    // Calculate writing streak - improved logic for consecutive days
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.entry_date || b.created_at || '').getTime() - 
      new Date(a.entry_date || a.created_at || '').getTime()
    )
    
    let streak = 0
    const today = startOfDay(new Date())
    let checkDate = new Date(today)
    
    // First check if there's an entry today, if not, start from yesterday
    const hasEntryToday = sortedEntries.some(entry => {
      const entryDate = startOfDay(new Date(entry.entry_date || entry.created_at || ''))
      return entryDate.getTime() === today.getTime()
    })
    
    if (!hasEntryToday) {
      // If no entry today, start checking from yesterday
      checkDate.setDate(checkDate.getDate() - 1)
    }
    
    // Check consecutive days (up to 365 days to handle long streaks)
    for (let i = 0; i < 365; i++) {
      const hasEntry = sortedEntries.some(entry => {
        const entryDate = startOfDay(new Date(entry.entry_date || entry.created_at || ''))
        return entryDate.getTime() === checkDate.getTime()
      })
      
      if (hasEntry) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1) // Move to previous day
      } else {
        break // Streak broken
      }
    }
    
    // Calculate dominant mood - improved to handle capitalization
    const moodCounts = entries.reduce((acc, entry) => {
      let mood = entry.mood || entry.sentiment_data?.primary_mood
      if (mood) {
        // Normalize mood to lowercase for consistent counting
        mood = mood.toLowerCase()
        acc[mood] = (acc[mood] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const dominantMoodEntry = Object.entries(moodCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))[0]
    
    // Capitalize first letter for display, fallback to 'Mixed'
    const dominantMood = dominantMoodEntry 
      ? dominantMoodEntry[0].charAt(0).toUpperCase() + dominantMoodEntry[0].slice(1)
      : 'Mixed'
    
    // Calculate business growth entries - FIXED: use lowercase categories
    const growthEntries = entries.filter(entry => {
      const category = (entry.category || entry.sentiment_data?.business_category || '').toLowerCase()
      // Include all growth-related categories that indicate business progress
      return category === 'achievement' || 
             category === 'growth' || 
             category === 'success' ||
             category === 'planning' || // Strategic business planning
             category === 'learning'    // Business learning and development
    }).length
    
    // Calculate average confidence
    const confidenceEntries = entries.filter(entry => 
      entry.sentiment_data?.confidence && entry.sentiment_data.confidence > 0
    )
    const avgConfidence = confidenceEntries.length > 0 
      ? Math.round(confidenceEntries.reduce((sum, entry) => 
          sum + (entry.sentiment_data?.confidence || 0), 0) / confidenceEntries.length)
      : 0

    return { streak, dominantMood, growthEntries, avgConfidence }
  }

  const stats = calculateStats()

  if (isLoading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 pb-8">
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="text-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full mb-4"
            >
              <Brain className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </motion.div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Loading your journal</h3>
            <p className="text-slate-600 dark:text-slate-400">Preparing your business insights...</p>
          </div>
        </div>
      </div>
    )
  }

  // Statistics are now directly rendered in JSX

  return (
    <div 
      className="bg-slate-50 dark:bg-slate-900 pb-8"
      onClick={(e) => {
        // Collapse all sections when clicking outside entries
        const target = e.target as HTMLElement
        const isEntryCard = target.closest('[data-entry-card]')
        const isSectionHeader = target.closest('[data-section-header]')
        const isButton = target.closest('button')
        const isInput = target.closest('input')
        const isModal = target.closest('[role="dialog"]')
        
        if (!isEntryCard && !isSectionHeader && !isButton && !isInput && !isModal) {
          handleCollapseAll()
        }
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      {/* Page Header with Enhanced Animations */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white"
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              <motion.span
                animate={{ 
                  color: ["#1e293b", "#ea7a57", "#1e293b"],
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="dark:animate-none dark:text-white"
              >
                AI Business Journal
              </motion.span>
            </motion.h1>
            <motion.p 
              className="mt-2 text-base sm:text-lg text-slate-600 dark:text-slate-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Track your thoughts, insights, and business learnings. AI automatically detects mood and category.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="flex flex-wrap gap-2 sm:gap-2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "backOut" }}
          >
            
            {canCreateEntry() && (
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button 
                  onClick={handleCreateEntry}
                  className="bg-orange-600 hover:bg-orange-700 text-white
                    transition-all duration-300 hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/30
                    relative overflow-hidden group min-h-[44px] text-sm sm:text-base px-4 sm:px-6"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  <span className="relative z-10">Write Entry</span>
                  
                  {/* Animated background shine */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                      transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  </div>
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Plan Limit Banner with Animation */}
      {usageStatus && (
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <PlanLimitBanner 
            usageStatus={usageStatus} 
            limitType="journal" 
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        </motion.div>
      )}

      {/* Statistics Overview with Smooth Animations */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 min-h-[100px] sm:min-h-[120px]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500 rounded-lg shadow-sm">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.streak}</div>
                )}
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800 min-h-[100px] sm:min-h-[120px]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.growthEntries}</div>
                )}
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Growth Wins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800 min-h-[100px] sm:min-h-[120px] sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 capitalize">{stats.dominantMood}</div>
                )}
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Dominant Mood</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      <motion.div 
        className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search your entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 focus:ring-orange-500 focus:border-orange-500 h-12 sm:h-10 text-base sm:text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 sm:h-8 sm:w-8 p-0 hover:bg-slate-100 rounded-full"
            >
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </Button>
          )}
        </div>
      </motion.div>

        {/* Chronological Entries */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
        >
          {filteredEntries.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchQuery ? 'No entries found' : 'Start your business journal'}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchQuery 
                  ? 'Try a different search term or clear your search.'
                  : 'Write your first entry to begin tracking your business journey.'
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setShowWriteModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Write First Entry
                </Button>
              )}
            </Card>
          ) : (
            <>
              {/* Today's Section - Always show */}
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
              >
                <motion.div 
                  className="flex items-center gap-3 mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
                >
                  <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-slate-900">Today</h2>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 font-medium">
                    {organizedEntries.today.length} entries
                  </Badge>
                </motion.div>
                
                {/* Today's entries or placeholder prompt */}
                {organizedEntries.today.length > 0 ? (
                  <AnimatePresence>
                    {organizedEntries.today.map((entry: JournalEntry, index: number) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.0 + index * 0.1, ease: "backOut" }}
                      >
                        <Card 
                          className="hover:shadow-lg hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30
                            hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer group 
                            border border-slate-200 hover:border-orange-300 bg-white hover:bg-orange-50/30
                            dark:bg-slate-800 dark:border-slate-700 dark:hover:border-orange-600 dark:hover:bg-orange-950/20
                            relative overflow-hidden min-h-[120px] sm:min-h-[140px] active:scale-[0.98] touch-manipulation"
                          onClick={() => handleViewEntry(entry)}
                          data-entry-card
                        >
                          {/* Animated Background Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-900/10 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <CardHeader className="pb-3 sm:pb-4 relative z-10 p-4 sm:p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-2xl" title={entry.mood || entry.sentiment_data?.primary_mood || 'No mood detected'}>
                                  {getDisplayMoodEmoji(entry)}
                                </span>
                                <CardTitle className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1 sm:line-clamp-2">
                                  {entry.title}
                                </CardTitle>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs sm:text-sm text-slate-500">{formatDate(entry.created_at || entry.entry_date || '')}</span>
                              {(entry.category || entry.sentiment_data?.business_category) && (
                                <Badge 
                                  variant="outline" 
                                  className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-2 py-1 hidden sm:inline-flex"
                                >
                                  {getEntryDisplayData(entry).category}
                                </Badge>
                              )}
                              {entry.sentiment_data?.energy && (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 font-medium flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  {getEnergyLabel(entry.sentiment_data.energy)}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 pb-3 sm:pb-4 relative z-10 px-4 sm:px-6">
                            <div className="mb-3">
                              <p className="text-sm sm:text-base text-slate-700 leading-relaxed line-clamp-2 sm:line-clamp-3">
                                {entry.content}
                              </p>
                              {entry.content.length > 200 && (
                                <button 
                                  className="text-orange-600 hover:text-orange-700 text-xs sm:text-sm font-medium mt-1 min-h-[44px] sm:min-h-auto p-2 sm:p-0 -m-2 sm:m-0 touch-manipulation"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedEntry(entry)
                                    setShowViewModal(true)
                                  }}
                                >
                                  Read more...
                                </button>
                              )}
                            </div>

                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
                  >
                    <Card className="p-8 text-center border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-all duration-300">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            Ready to capture today's business insights?
                          </h3>
                          <p className="text-slate-600 max-w-md mx-auto">
                            Start your day with reflection. What challenges will you tackle? What opportunities do you see? Document your entrepreneurial journey.
                          </p>
                        </div>
                        <Button 
                          onClick={handleCreateEntry}
                          className={`${canCreateEntry() 
                            ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                            : 'bg-slate-400 hover:bg-slate-500 text-white'} 
                            px-4 sm:px-6 py-3 text-sm sm:text-base font-medium min-h-[48px] touch-manipulation`}
                          disabled={!canCreateEntry() && !isPremium}
                        >
                          <PlusCircle className="w-5 h-5 mr-2" />
                          {canCreateEntry() ? "Write Today's Entry" : 'Upgrade for More Entries'}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </motion.div>

              {/* This Week - Medium Cards */}
              {organizedEntries.thisWeek.length > 0 && (
                <motion.div 
                  className="space-y-3 mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2, ease: "easeOut" }}
                >
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between w-full p-3 sm:p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-orange-50 rounded-xl border border-slate-200 hover:border-orange-200 transition-all duration-200 min-h-[56px] touch-manipulation"
                    onClick={() => toggleSection('thisWeek')}
                    data-section-header
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full"></div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900">Earlier this week</h2>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs font-medium">
                        {organizedEntries.thisWeek.length} entries
                      </Badge>
                    </div>
                    {expandedSections.thisWeek ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </Button>
                  
                  {expandedSections.thisWeek && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 ml-4"
                      >
                        {organizedEntries.thisWeek.map((entry: JournalEntry) => (
                          <Card 
                            key={entry.id}
                            className="hover:shadow-md transition-all duration-200 cursor-pointer group border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/30 min-h-[100px] active:scale-[0.98] touch-manipulation"
                            onClick={() => handleViewEntry(entry)}
                            data-entry-card
                          >
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg" title={entry.mood || entry.sentiment_data?.primary_mood || 'No mood detected'}>
                                  {getDisplayMoodEmoji(entry)}
                                </span>
                                <h3 className="text-sm sm:text-base font-medium text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                  {entry.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500 mb-2">
                                <span>{formatDate(entry.created_at || entry.entry_date || '')}</span>
                                {getEntryDisplayData(entry).category && (
                                  <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-1.5 py-0.5">
                                    {getEntryDisplayData(entry).category}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-slate-600 text-xs sm:text-sm line-clamp-1 sm:line-clamp-2">
                                {entry.content.length > 0 ? entry.content : 'No content available'}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </motion.div>
              )}

              {/* This Month - Condensed Cards */}
              {organizedEntries.thisMonth.length > 0 && (
                <motion.div 
                  className="space-y-3 mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.4, ease: "easeOut" }}
                >
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between w-full p-3 sm:p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-green-50 rounded-xl border border-slate-200 hover:border-green-200 transition-all duration-200 min-h-[56px] touch-manipulation"
                    onClick={() => toggleSection('thisMonth')}
                    data-section-header
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-green-500 rounded-full"></div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900">Earlier this month</h2>
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-medium">
                        {organizedEntries.thisMonth.length} entries
                      </Badge>
                    </div>
                    {expandedSections.thisMonth ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </Button>
                  
                  {expandedSections.thisMonth && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 ml-2 sm:ml-4"
                      >
                        {organizedEntries.thisMonth.map((entry: JournalEntry) => (
                          <Card 
                            key={entry.id}
                            className="hover:shadow-sm transition-all duration-200 cursor-pointer group border border-slate-200 hover:border-green-300 bg-white hover:bg-green-50/30 min-h-[80px] active:scale-[0.98] touch-manipulation"
                            onClick={() => handleViewEntry(entry)}
                            data-entry-card
                          >
                            <CardContent className="p-2 sm:p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm" title={entry.mood || entry.sentiment_data?.primary_mood || 'No mood detected'}>
                                  {getDisplayMoodEmoji(entry)}
                                </span>
                                <h3 className="font-medium text-sm text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                  {entry.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{formatDate(entry.created_at || entry.entry_date || '')}</span>
                                {getEntryDisplayData(entry).category && (
                                  <div className="w-2 h-2 rounded-full bg-orange-200" 
                                       title={getEntryDisplayData(entry).category}></div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </motion.div>
              )}

              {/* This Year - Dense List */}
              {organizedEntries.thisYear.length > 0 && (
                <motion.div 
                  className="space-y-3 mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.6, ease: "easeOut" }}
                >
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between w-full p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-purple-50 rounded-xl border border-slate-200 hover:border-purple-200 transition-all duration-200"
                    onClick={() => toggleSection('thisYear')}
                    data-section-header
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full"></div>
                      <h2 className="text-lg font-semibold text-slate-900">Earlier this year</h2>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-medium">
                        {organizedEntries.thisYear.length} entries
                      </Badge>
                    </div>
                    {expandedSections.thisYear ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </Button>
                  
                  {expandedSections.thisYear && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1 ml-4"
                      >
                        {organizedEntries.thisYear.map((entry: JournalEntry) => (
                          <div 
                            key={entry.id}
                            className="flex items-center gap-3 p-3 hover:bg-purple-50/50 rounded-lg cursor-pointer group transition-all duration-200 border border-transparent hover:border-purple-200"
                            onClick={() => handleViewEntry(entry)}
                            data-entry-card
                          >
                            <span className="text-sm" title={entry.mood || entry.sentiment_data?.primary_mood || 'No mood detected'}>
                              {getDisplayMoodEmoji(entry)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                                {entry.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>{formatDate(entry.created_at || entry.entry_date || '')}</span>
                              {getEntryDisplayData(entry).category && (
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-200" 
                                     title={getEntryDisplayData(entry).category}></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </motion.div>
              )}

              {/* Previous Years - Ultra Dense List */}
              {Object.keys(organizedEntries.previousYears).length > 0 && 
                Object.keys(organizedEntries.previousYears)
                  .sort((a, b) => parseInt(b) - parseInt(a)) // Sort years in descending order
                  .map((year, index) => (
                    <motion.div 
                      key={year} 
                      className="space-y-3 mt-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 1.8 + index * 0.2, ease: "easeOut" }}
                    >
                      <Button
                        variant="ghost"
                        className="flex items-center justify-between w-full p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-200"
                        onClick={() => toggleSection(year as any)}
                        data-section-header
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full"></div>
                          <h2 className="text-lg font-semibold text-slate-900">{year}</h2>
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-medium">
                            {organizedEntries.previousYears[parseInt(year)].length} entries
                          </Badge>
                        </div>
                        {(expandedSections as any)[year] ? (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </Button>
                      
                      {(expandedSections as any)[year] && (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-1 ml-4"
                          >
                            {organizedEntries.previousYears[parseInt(year)].map((entry: JournalEntry) => (
                              <div 
                                key={entry.id}
                                className="flex items-center gap-2 p-2.5 hover:bg-slate-50/80 rounded-lg cursor-pointer group transition-all duration-200 border border-transparent hover:border-slate-200"
                                onClick={() => handleViewEntry(entry)}
                              >
                                <span className="text-xs" title={entry.mood || (entry.sentiment_data && entry.sentiment_data.primary_mood) || 'No mood detected'}>
                                  {getDisplayMoodEmoji(entry)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-xs text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                                    {entry.title}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <span className="text-xs">{format(new Date(entry.entry_date || entry.created_at || ''), 'MMM d')}</span>
                                  {getEntryDisplayData(entry).category && (
                                    <div className="w-1 h-1 rounded-full bg-orange-200" 
                                         title={getEntryDisplayData(entry).category}></div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </motion.div>
                  ))
              }
            </>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <SimpleCreateEntryModal
        isOpen={showWriteModal}
        onClose={() => setShowWriteModal(false)}
        onEntryCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
        }}
      />

      <ViewEntryModal
        isOpen={showViewModal}
        onClose={handleCloseModals}
        entry={selectedEntry}
        onEdit={() => {
          setShowViewModal(false)
          setShowEditModal(true)
        }}
        onDelete={handleDeleteEntry}
      />

      <EditEntryModal
        isOpen={showEditModal}
        onClose={handleCloseModals}
        entry={selectedEntry}
      />

      <AIMigrationDialog
        isOpen={showMigrationDialog}
        onClose={() => setShowMigrationDialog(false)}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
          toast({
            title: "AI Analysis Updated",
            description: "Your journal entries have been enhanced with improved AI analysis.",
          })
        }}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  )
}