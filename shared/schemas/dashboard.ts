import { z } from 'zod'

// Dashboard Metrics Schemas for API boundaries
export const JournalStatsSchema = z.object({
  totalEntries: z.number().min(0),
  streak: z.number().min(0),
  thisWeekCount: z.number().min(0),
  aiAnalysisRate: z.number().min(0).max(100),
  dominantMood: z.string(),
  writingStreak: z.number().min(0),
})

export const GoalsStatsSchema = z.object({
  activeCount: z.number().min(0),
  completedCount: z.number().min(0),
  averageProgress: z.number().min(0).max(100),
  urgentCount: z.number().min(0),
  completedThisMonth: z.number().min(0),
  highPriorityCount: z.number().min(0),
  milestoneGoalsCount: z.number().min(0),
  manualGoalsCount: z.number().min(0),
  hasAnyMilestoneGoals: z.boolean(),
})

export const StorageStatsSchema = z.object({
  storage_used: z.number().min(0),
  storage_limit: z.number().min(1),
  total_documents: z.number().min(0),
  storage_percentage: z.number().min(0).max(100),
})

export const BusinessHealthMetricsSchema = z.object({
  burnoutRisk: z.number().min(0).max(100),
  growthMomentum: z.number().min(0).max(100),
  recoveryResilience: z.number().min(0).max(100),
  overallHealth: z.number().min(0).max(100),
})

// Date range params for API calls
export const DashboardParamsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  userId: z.string().uuid(),
})

// Type exports
export type JournalStats = z.infer<typeof JournalStatsSchema>
export type GoalsStats = z.infer<typeof GoalsStatsSchema>
export type StorageStats = z.infer<typeof StorageStatsSchema>
export type BusinessHealthMetrics = z.infer<typeof BusinessHealthMetricsSchema>
export type DashboardParams = z.infer<typeof DashboardParamsSchema>