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
};

// Admin Users Table
export type AdminUser = {
  user_id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
};

// User Plans Table - subscription management
export type UserPlan = {
  id: string;
  user_id: string;
  plan_type: string; // 'free' or 'premium'
  billing_cycle?: string; // 'monthly', 'yearly'
  amount_paid?: number;
  currency?: string;
  paystack_customer_code?: string;
  paystack_subscription_code?: string;
  started_at?: string;
  expires_at?: string;
  cancelled_at?: string;
  referral_days_remaining?: number;
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

// Type inference from schemas
export type CreateUserProfile = z.infer<typeof createUserProfileSchema>;
export type CreateJournalEntry = z.infer<typeof createJournalEntrySchema>;
export type CreateGoal = z.infer<typeof createGoalSchema>;
export type CreateDocument = z.infer<typeof createDocumentSchema>;
export type CreateEarlySignup = z.infer<typeof createEarlySignupSchema>;
export type UpdatePlatformSettings = z.infer<typeof updatePlatformSettingsSchema>;
export type CreateCalculatorHistory = z.infer<typeof createCalculatorHistorySchema>;
export type UpdateCalculatorHistory = z.infer<typeof updateCalculatorHistorySchema>;