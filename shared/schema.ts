// Supabase Database Schema Types
// This file defines TypeScript types for our Supabase database tables
// All database operations use the Supabase client in @/lib/supabase

import { z } from "zod";

// Supabase Auth Users (system table - managed by Supabase Auth)
export type AuthUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: Record<string, any>;
};

// User Profiles Table - extends Supabase auth.users
export type UserProfile = {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  business_name?: string;
  business_type?: string;
  business_size?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  is_admin?: boolean;
  is_active?: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  // Email preferences
  email_notifications?: boolean;
  daily_email?: boolean;
  daily_email_time?: string; // HH:MM format in user's timezone
  timezone?: string;
  // Admin suspension fields
  is_suspended?: boolean;
  suspended_at?: string;
  suspended_by?: string; // admin user_id who suspended the account
  suspension_reason?: string;
  suspension_expires_at?: string; // optional auto-unsuspend date
};

// Daily Email Settings Table
export type DailyEmailSettings = {
  id: string;
  user_id: string;
  enabled: boolean;
  send_time: string; // HH:MM format
  timezone: string;
  content_preferences: {
    journal_prompts: boolean;
    goal_summaries: boolean;
    business_insights: boolean;
    milestone_reminders: boolean;
  };
  last_sent_at?: string;
  created_at: string;
  updated_at: string;
};

// Daily Email Content Table - stores generated content
export type DailyEmailContent = {
  id: string;
  user_id: string;
  email_date: string; // YYYY-MM-DD
  journal_prompt: string;
  goal_summary: string;
  business_insights: string;
  sentiment_trend: string;
  milestone_reminders: string;
  personalization_data: Record<string, any>;
  // Enhanced content fields
  actionable_insights?: string;
  gamification_data?: string; // JSON string
  weekly_challenge?: string;
  smart_recommendations?: string; // JSON string
  // New enhanced digest fields
  motivation_quote?: string;
  top_goal?: string; // JSON string
  journal_snapshot?: string; // JSON string  
  business_health?: string; // JSON string
  action_nudges?: string; // JSON string
  smart_suggestions?: string; // JSON string
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  created_at: string;
};

// Email Analytics Table
export type EmailAnalytics = {
  id: string;
  user_id: string;
  email_type: 'daily_digest' | 'goal_reminder' | 'milestone_alert';
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
  unsubscribed_at?: string;
  engagement_score: number; // 0-100
  content_preferences?: Record<string, any>;
  created_at: string;
};

// Admin Users Table
export type AdminUser = {
  user_id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
};

// Admin Audit Log Table - tracks all admin actions
export type AdminAuditLog = {
  id: string;
  admin_user_id: string; // who performed the action
  target_user_id: string; // who was affected by the action
  action_type: 'suspend_account' | 'unsuspend_account' | 'reset_password' | 'send_email' | 'edit_profile' | 'update_trial_days' | 'delete_account';
  action_details: Record<string, any>; // JSON object with action-specific data
  ip_address?: string;
  user_agent?: string;
  created_at: string;
};

// User Activity Log Table - tracks user actions for admin review
export type UserActivityLog = {
  id: string;
  user_id: string;
  action_type: 'login' | 'logout' | 'profile_update' | 'password_change' | 'journal_entry' | 'goal_created' | 'document_upload' | 'password_reset_request';
  details?: Record<string, any>; // JSON object with action-specific data
  ip_address?: string;
  user_agent?: string;
  created_at: string;
};

// User Plans Table - subscription management
export type UserPlan = {
  id: string;
  user_id: string;
  plan_type: 'free' | 'premium' | 'trial'; // Clear type definition for plan types
  billing_cycle?: string; // 'monthly', 'yearly'
  amount_paid?: number;
  currency?: string;
  paystack_customer_code?: string;
  paystack_subscription_code?: string;
  started_at?: string;
  expires_at?: string;
  cancelled_at?: string;
  is_trial?: boolean; // true for trial periods
  trial_ends_at?: string; // when trial expires
  referral_days_remaining?: number;
  referral_bonus_applied?: boolean; // track if referral bonus has been applied
  created_at: string;
  updated_at: string;
};

// User Referrals Table - referral program
export type UserReferral = {
  id: string;
  referrer_id: string;
  referee_id?: string;
  referral_code: string;
  referee_email?: string;
  status: string; // 'pending', 'active', 'expired'
  reward_granted: boolean;
  reward_amount?: number;
  currency?: string;
  referral_date?: string;
  activation_date?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
};

// Early Signups Table - pre-launch leads
export type EarlySignup = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  business_name?: string;
  business_type?: string;
  phone?: string;
  referral_source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  notes?: string;
  is_converted: boolean;
  converted_user_id?: string;
  created_at: string;
  updated_at: string;
};

// Journal Entries Table
export type JournalEntry = {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  mood?: string;
  energy_level?: number;
  categories?: string[];
  tags?: string[];
  ai_sentiment?: string;
  ai_insights?: string;
  is_favorite: boolean;
  goal_id?: string;
  created_at: string;
  updated_at: string;
};

// Goals Table
export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  target_value?: number;
  current_value?: number;
  unit?: string;
  deadline: string; // ISO date string (renamed from target_date for consistency)
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'at_risk';
  completion_date?: string;
  reflection?: string; // renamed from notes for consistency
  progress: number; // 0-100
  progress_type: 'manual' | 'milestone'; // How progress is tracked
  created_at: string;
  updated_at: string;
};

// Documents Table
export type Document = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  category?: string;
  tags?: string[];
  is_favorite: boolean;
  upload_status: string;
  created_at: string;
  updated_at: string;
};

// Platform Settings Table
export type PlatformSettings = {
  id: string;
  pre_launch_mode: boolean;
  launch_message: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  created_at: string;
  updated_at: string;
};

// Podcast Episodes Table
export type PodcastEpisode = {
  id: string;
  title: string;
  description?: string;
  series: string;
  episode_number: number;
  duration: number; // in seconds
  has_video: boolean;
  video_url?: string;
  audio_url?: string;
  video_thumbnail?: string;
  transcript?: string;
  key_takeaways?: string[];
  difficulty?: string;
  series_color?: string;
  created_at: string;
  updated_at: string;
};

// User Podcast Progress Table
export type UserPodcastProgress = {
  id: string;
  user_id: string;
  episode_id: string;
  progress_seconds: number;
  completed: boolean;
  completed_at?: string;
  last_media_type?: string; // Track whether last played as 'audio' or 'video'
  created_at: string;
  updated_at: string;
};

// Footer Content Table - manages website footer legal content
export type FooterContent = {
  id: string;
  type: 'privacy' | 'terms' | 'contact';
  title: string;
  content: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

// Zod Validation Schemas
export const createUserProfileSchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional(),
  business_name: z.string().optional(),
  business_type: z.string().optional(),
  business_size: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  avatar_url: z.string().url().optional(),
});

export const createJournalEntrySchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  mood: z.string().optional(),
  energy_level: z.number().int().min(1).max(10).optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  goal_id: z.string().uuid().optional(),
});

export const createGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  target_value: z.number().positive().optional(),
  current_value: z.number().min(0).optional(),
  unit: z.string().optional(),
  deadline: z.string(), // ISO date string
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'at_risk']),
  progress: z.number().min(0).max(100),
  progress_type: z.enum(['manual', 'milestone']).default('manual'),
  reflection: z.string().optional(),
});

export const createMilestoneSchema = z.object({
  goal_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  due_date: z.string().optional(), // ISO date string
  weight: z.number().positive().default(1),
  order_index: z.number().int().min(0),
});

export const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  due_date: z.string().optional(),
  weight: z.number().positive().optional(),
  order_index: z.number().int().min(0).optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  target_value: z.number().positive().optional(),
  current_value: z.number().min(0).optional(),
  unit: z.string().optional(),
  deadline: z.string().optional(), // ISO date string
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'at_risk']).optional(),
  progress: z.number().min(0).max(100).optional(),
  progress_type: z.enum(['manual', 'milestone']).optional(),
  reflection: z.string().optional(),
});

export const createDocumentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  file_name: z.string().min(1),
  file_size: z.number().positive(),
  file_type: z.string().min(1),
  file_url: z.string().url(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const createEarlySignupSchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  business_name: z.string().optional(),
  business_type: z.string().optional(),
  phone: z.string().optional(),
  referral_source: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePlatformSettingsSchema = z.object({
  pre_launch_mode: z.boolean().optional(),
  launch_message: z.string().optional(),
  maintenance_mode: z.boolean().optional(),
  maintenance_message: z.string().optional(),
});

export const createPodcastEpisodeSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  series: z.string().min(1),
  episode_number: z.number().int().positive(),
  duration: z.number().int().positive(),
  has_video: z.boolean().default(false),
  video_url: z.string().url().or(z.literal("")).optional(),
  audio_url: z.string().url().or(z.literal("")).optional(),
  video_thumbnail: z.string().url().or(z.literal("")).optional(),
  transcript: z.string().optional(),
  key_takeaways: z.array(z.string()).optional(),
  difficulty: z.string().optional(),
  series_color: z.string().optional(),
});

export const updatePodcastEpisodeSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  series: z.string().min(1).optional(),
  episode_number: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),
  has_video: z.boolean().optional(),
  video_url: z.string().url().or(z.literal("")).optional(),
  audio_url: z.string().url().or(z.literal("")).optional(),
  video_thumbnail: z.string().url().or(z.literal("")).optional(),
  transcript: z.string().optional(),
  key_takeaways: z.array(z.string()).optional(),
  difficulty: z.string().optional(),
  series_color: z.string().optional(),
});

export const createFooterContentSchema = z.object({
  type: z.enum(['privacy', 'terms', 'contact']),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  is_published: z.boolean().default(true),
});

export const updateFooterContentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  is_published: z.boolean().optional(),
});

// Calculator History Table - store saved calculations
export type CalculatorHistory = {
  id: string;
  user_id: string;
  calculator_type: string; // 'cash_flow', 'break_even', 'business_budget', 'loan_amortisation'
  calculation_name: string;
  calculation_data: Record<string, any>; // JSON data with inputs and results
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
};

// Zod schemas for validation
export const createCalculatorHistorySchema = z.object({
  user_id: z.string().uuid(),
  calculator_type: z.enum(['cash_flow', 'break_even', 'business_budget', 'loan_amortisation']),
  calculation_name: z.string().min(1).max(100),
  calculation_data: z.record(z.any()),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateCalculatorHistorySchema = z.object({
  calculation_name: z.string().min(1).max(100).optional(),
  calculation_data: z.record(z.any()).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Admin action schemas
export const suspendUserSchema = z.object({
  reason: z.string().min(1).max(500),
  expires_at: z.string().optional(), // ISO date string for auto-unsuspend
});

export const createAdminAuditLogSchema = z.object({
  admin_user_id: z.string().uuid(),
  target_user_id: z.string().uuid(),
  action_type: z.enum(['suspend_account', 'unsuspend_account', 'reset_password', 'send_email', 'edit_profile', 'update_trial_days', 'delete_account']),
  action_details: z.record(z.any()),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

export const createUserActivityLogSchema = z.object({
  user_id: z.string().uuid(),
  action_type: z.enum(['login', 'logout', 'profile_update', 'password_change', 'journal_entry', 'goal_created', 'document_upload', 'password_reset_request']),
  details: z.record(z.any()).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

export const sendAdminEmailSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1),
  email_type: z.enum(['notification', 'warning', 'account_update', 'system_message']).default('notification'),
});

export const updateUserProfileAdminSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional(),
  business_name: z.string().optional(),
  business_type: z.string().optional(),
  business_size: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  is_active: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
  daily_email: z.boolean().optional(),
});

// Type inference from schemas
export type CreateUserProfile = z.infer<typeof createUserProfileSchema>;
export type CreateJournalEntry = z.infer<typeof createJournalEntrySchema>;
export type CreateGoal = z.infer<typeof createGoalSchema>;
export type CreateMilestone = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestone = z.infer<typeof updateMilestoneSchema>;
export type CreateDocument = z.infer<typeof createDocumentSchema>;
export type CreateEarlySignup = z.infer<typeof createEarlySignupSchema>;
export type UpdatePlatformSettings = z.infer<typeof updatePlatformSettingsSchema>;
export type CreatePodcastEpisode = z.infer<typeof createPodcastEpisodeSchema>;
export type UpdatePodcastEpisode = z.infer<typeof updatePodcastEpisodeSchema>;
export type CreateCalculatorHistory = z.infer<typeof createCalculatorHistorySchema>;
export type UpdateCalculatorHistory = z.infer<typeof updateCalculatorHistorySchema>;
export type CreateFooterContent = z.infer<typeof createFooterContentSchema>;
export type UpdateFooterContent = z.infer<typeof updateFooterContentSchema>;
export type SuspendUser = z.infer<typeof suspendUserSchema>;
export type CreateAdminAuditLog = z.infer<typeof createAdminAuditLogSchema>;
export type CreateUserActivityLog = z.infer<typeof createUserActivityLogSchema>;
export type SendAdminEmail = z.infer<typeof sendAdminEmailSchema>;
export type UpdateUserProfileAdmin = z.infer<typeof updateUserProfileAdminSchema>;