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
import { initializeAISystem } from "@/lib/ai"

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
  // const { usageStatus, canCreateJournalEntry, getRemainingQuota, isPremium, isFree } = usePlans() // DISABLED TO PREVENT HEAD REQUESTS
  const usageStatus = null
  const canCreateJournalEntry = true
  const getRemainingQuota = () => ({ remaining: 999, limit: 999 })
  const isPremium = false
  const isFree = true

  // Get current user and initialize AI system
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Initialize enhanced AI system
      try {
        initializeAISystem()
      } catch (error) {
        console.warn('Failed to initialize AI system:', error)
      }
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

  // Handle adding sample entries - clears existing and generates 5 random entries each time
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
    
    const businessScenarios = [
      {
        title: "Landed our first enterprise client! 💼",
        content: "After 8 months of negotiations, we finally signed IBM as our first Fortune 500 client. The deal is worth R1.8 million annually and validates our enterprise-grade security features. The sales team worked incredibly hard, doing countless demos and addressing every technical concern. This opens doors to other big corporations who were waiting to see if we could handle enterprise-scale deployments. Already have three more enterprise prospects wanting to schedule calls next week."
      },
      {
        title: "Server outage cost us R50k in revenue today",
        content: "Our main database went down for 4 hours this morning during peak usage time. Customers couldn't access their accounts and we had to pause all payment processing. The issue was traced to a failed disk in our primary server cluster. We've been meaning to upgrade our infrastructure but kept postponing due to cost concerns. This incident shows we can't delay critical infrastructure investments any longer. Setting up redundant systems and better monitoring is now our top priority."
      },
      {
        title: "Planning our Series A funding strategy",
        content: "Met with our investment advisor today to discuss raising Series A funding. We need R15 million to scale our engineering team and expand to three new markets. Our current burn rate gives us 8 months of runway, so timing is crucial. We've identified 12 potential investors who focus on B2B SaaS companies at our stage. The pitch deck needs to demonstrate clear product-market fit and a path to R50M ARR within 24 months."
      },
      {
        title: "Competitor launched similar features to ours",
        content: "TechCrunch announced that our main competitor just raised R25 million and launched features that are eerily similar to our roadmap. Their marketing team is aggressive and they're already reaching out to our prospects. This validates our product direction but also means we need to move faster. We can't compete on funding, so we need to win on execution speed and customer experience. Time to double down on our unique differentiators."
      },
      {
        title: "Customer churn hit 8% this month - need action plan",
        content: "Our monthly churn rate jumped from 3% to 8%, which is concerning for our growth projections. Exit interviews reveal that customers are frustrated with our onboarding process and lack of advanced reporting features. Three customers mentioned switching to competitors who offer better analytics dashboards. We need to prioritize the business intelligence module we've been planning and completely redesign the first-week user experience."
      },
      {
        title: "Product launch exceeded all expectations! 🚀",
        content: "Our new mobile app launched yesterday and we already have 2,500 downloads with 4.8 star rating on both app stores. The marketing campaign generated 50,000 website visits and 1,200 trial signups. Social media engagement is through the roof - our announcement post got 500 shares and 2,000 likes. The development team delivered an amazing product and marketing executed flawlessly. This momentum could drive significant growth in Q4."
      },
      {
        title: "Struggling with work-life balance as CEO",
        content: "Been working 70-hour weeks for the past month and starting to feel the burnout. Missing family dinners, weekend plans cancelled, and barely sleeping 5 hours a night. The pressure to grow fast and meet investor expectations is overwhelming. I know this pace isn't sustainable but there's so much that needs my direct involvement. Need to hire a COO or delegate more effectively - the company's growth shouldn't depend entirely on me being available 24/7."
      },
      {
        title: "Government contract opportunity worth R5M",
        content: "Received an invitation to bid for a 3-year government digitization project worth R5 million. This would be our largest contract ever and provide stable recurring revenue. However, government projects are notorious for slow payments and bureaucratic delays. We'd need to hire 8 additional developers and invest heavily in compliance certifications. The opportunity is massive but the execution risks are equally significant."
      },
      {
        title: "Key developer gave 2 weeks notice today",
        content: "Sarah, our lead frontend developer, handed in her resignation this morning. She's been offered a senior role at Google with 40% higher salary plus equity. Losing her knowledge of our codebase is a major setback - she built most of our user interface components. We have two weeks to transition her responsibilities and find a replacement. The job market is competitive and finding someone with her skills won't be easy or cheap."
      },
      {
        title: "Exploring partnership with Microsoft Azure",
        content: "Had promising discussions with Microsoft's partner team about integrating our solution with Azure Active Directory. This could give us access to their enterprise customer base and technical resources. The partnership would require rebuilding parts of our authentication system but could accelerate our enterprise adoption by 12 months. Need to evaluate the technical complexity versus the potential market access benefits."
      },
      {
        title: "Revenue grew 45% quarter-over-quarter! 📈",
        content: "Q3 results are in and we hit R2.1 million in revenue, up 45% from Q2. Our monthly recurring revenue is now R720k with healthy growth across all customer segments. The pricing optimization we implemented in July is paying off - average contract value increased by 30%. Customer acquisition costs are down 15% thanks to improved conversion funnels. These numbers will look great in our Series A pitch deck."
      },
      {
        title: "Debating whether to pivot our business model",
        content: "Customer feedback suggests our current subscription model isn't ideal for smaller businesses. Many potential clients prefer usage-based pricing rather than fixed monthly fees. We're considering a freemium model with pay-per-transaction pricing for premium features. This would require significant changes to our billing system and revenue forecasting. The risk is cannibalizing existing revenue, but it could open up a much larger market segment."
      },
      {
        title: "Compliance audit revealed critical security gaps",
        content: "External security audit identified several vulnerabilities in our data handling processes. We're not fully compliant with POPIA regulations and our API endpoints lack proper rate limiting. Two clients have already asked for compliance certificates we can't provide. We need to invest R200k in security infrastructure and hire a dedicated compliance officer. This wasn't budgeted but it's non-negotiable for enterprise sales."
      },
      {
        title: "Team morale survey results are concerning",
        content: "Anonymous employee survey revealed that 60% of staff feel overworked and underappreciated. Several team members mentioned considering other opportunities due to unclear career progression paths. Communication between departments is poor and many feel their contributions aren't recognized. We need to address these cultural issues immediately before we lose more talent. Planning all-hands meeting and management restructuring."
      },
      {
        title: "Successful product demo at industry conference",
        content: "Our presentation at the FinTech Summit generated incredible interest - collected 180 qualified leads and scheduled 25 follow-up meetings. Three venture capital firms approached us about potential investment opportunities. The live product demonstration went perfectly and several attendees mentioned our solution addressed their exact pain points. This conference exposure could accelerate our sales pipeline by months."
      }
    ]
    
    try {
      // Select 5 random entries
      const shuffled = businessScenarios.sort(() => 0.5 - Math.random())
      const selectedEntries = shuffled.slice(0, 5)
      
      let added = 0
      for (const entry of selectedEntries) {
        // Only pass title and content - let AI analyze mood, category, and insights
        const textOnlyEntry = {
          title: entry.title,
          content: entry.content
        }
        await JournalService.createEntry(textOnlyEntry)
        added++
      }
      
      // Refresh journal entries
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      
      toast({
        title: "Random Samples Added!",
        description: `${added} diverse business scenarios created for AI analysis testing.`,
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
    // Calculate writing streak
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.entry_date || b.created_at || '').getTime() - 
      new Date(a.entry_date || a.created_at || '').getTime()
    )
    
    let streak = 0
    const today = new Date()
    let checkDate = new Date(today)
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const hasEntry = sortedEntries.some(entry => {
        const entryDate = new Date(entry.entry_date || entry.created_at || '')
        return entryDate.toDateString() === checkDate.toDateString()
      })
      
      if (hasEntry) {
        streak++
      } else if (streak > 0) {
        break // Streak broken
      }
      
      checkDate.setDate(checkDate.getDate() - 1)
    }
    
    // Calculate dominant mood
    const moodCounts = entries.reduce((acc, entry) => {
      const mood = entry.mood || entry.sentiment_data?.primary_mood
      if (mood) {
        acc[mood] = (acc[mood] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const dominantMood = Object.entries(moodCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'Mixed'
    
    // Calculate business growth entries (Achievement, Growth categories)
    const growthEntries = entries.filter(entry => {
      const category = entry.category || entry.sentiment_data?.business_category
      return category === 'Achievement' || category === 'Growth' || category === 'Success'
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Page Header with Enhanced Animations */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-3xl font-bold text-slate-900 dark:text-white"
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
              className="mt-2 text-lg text-slate-600 dark:text-slate-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Track your thoughts, insights, and business learnings. AI automatically detects mood and category.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="mt-4 sm:mt-0 flex gap-2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "backOut" }}
          >
            {entries.length > 0 && (
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button 
                  onClick={handleReAnalyzeEntries}
                  disabled={isReAnalyzing}
                  variant="outline"
                  size="sm"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/20
                    transition-all duration-300 hover:shadow-md relative overflow-hidden disabled:opacity-50"
                >
                  <motion.div
                    animate={isReAnalyzing ? { 
                      rotate: 360
                    } : { 
                      scale: [1, 1.1, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={isReAnalyzing ? {
                      duration: 1, 
                      repeat: Infinity, 
                      ease: "linear" 
                    } : { 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                  </motion.div>
                  {isReAnalyzing ? 'Re-analyzing...' : 'Update AI Analysis'}
                  
                  {/* Subtle pulse effect */}
                  <div className="absolute inset-0 bg-orange-500/10 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300" />
                </Button>
              </motion.div>
            )}
            
            {canCreateEntry() && (
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button 
                  onClick={handleCreateEntry}
                  className="bg-orange-600 hover:bg-orange-700 text-white mr-2
                    transition-all duration-300 hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/30
                    relative overflow-hidden group"
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
            
            {/* Clear All Entries Button */}
            <Button 
              onClick={async () => {
                try {
                  await JournalService.clearAllEntries()
                  queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
                  toast({
                    title: "Entries Cleared",
                    description: "All journal entries have been removed.",
                  })
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to clear entries.",
                    variant: "destructive"
                  })
                }
              }}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            
            {/* Add Random Sample Entries Button */}
            <Button 
              onClick={handleAddSamples}
              variant="outline"
              size="sm"
              className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Random Samples
            </Button>
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
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
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

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
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

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
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
        className="mb-8 flex flex-col sm:flex-row gap-4"
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
            className="pl-10 pr-10 focus:ring-orange-500 focus:border-orange-500"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
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
                            relative overflow-hidden"
                          onClick={() => handleViewEntry(entry)}
                          data-entry-card
                        >
                          {/* Animated Background Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-900/10 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <CardHeader className="pb-4 relative z-10">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-2xl" title={entry.mood || entry.sentiment_data?.primary_mood || 'No mood detected'}>
                                  {getDisplayMoodEmoji(entry)}
                                </span>
                                <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                  {entry.title}
                                </CardTitle>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-slate-500">{formatDate(entry.created_at || entry.entry_date || '')}</span>
                              {(entry.category || entry.sentiment_data?.business_category) && (
                                <Badge 
                                  variant="outline" 
                                  className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-2 py-1"
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
                          <CardContent className="pt-0 pb-4 relative z-10">
                            <div className="mb-3">
                              <p className="text-slate-700 leading-relaxed line-clamp-2">
                                {entry.content}
                              </p>
                              {entry.content.length > 200 && (
                                <button 
                                  className="text-orange-600 hover:text-orange-700 text-sm font-medium mt-1"
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
                            px-6 py-3 text-base font-medium`}
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
                    className="flex items-center justify-between w-full p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-orange-50 rounded-xl border border-slate-200 hover:border-orange-200 transition-all duration-200"
                    onClick={() => toggleSection('thisWeek')}
                    data-section-header
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full"></div>
                      <h2 className="text-lg font-semibold text-slate-900">Earlier this week</h2>
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
                            className="hover:shadow-md transition-all duration-200 cursor-pointer group border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/30"
                            onClick={() => handleViewEntry(entry)}
                            data-entry-card
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg" title={entry.mood || entry.sentiment_data?.primary_mood || 'No mood detected'}>
                                  {getDisplayMoodEmoji(entry)}
                                </span>
                                <h3 className="font-medium text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                  {entry.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                                <span>{formatDate(entry.created_at || entry.entry_date || '')}</span>
                                {getEntryDisplayData(entry).category && (
                                  <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-1.5 py-0.5">
                                    {getEntryDisplayData(entry).category}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-slate-600 text-sm line-clamp-1">
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
                    className="flex items-center justify-between w-full p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-green-50 rounded-xl border border-slate-200 hover:border-green-200 transition-all duration-200"
                    onClick={() => toggleSection('thisMonth')}
                    data-section-header
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-green-500 rounded-full"></div>
                      <h2 className="text-lg font-semibold text-slate-900">Earlier this month</h2>
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
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-4"
                      >
                        {organizedEntries.thisMonth.map((entry: JournalEntry) => (
                          <Card 
                            key={entry.id}
                            className="hover:shadow-sm transition-all duration-200 cursor-pointer group border border-slate-200 hover:border-green-300 bg-white hover:bg-green-50/30"
                            onClick={() => handleViewEntry(entry)}
                            data-entry-card
                          >
                            <CardContent className="p-3">
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