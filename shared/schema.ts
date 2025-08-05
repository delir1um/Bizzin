import { pgTable, text, uuid, timestamp, boolean, integer, decimal, jsonb, date, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Supabase Auth Users (system table - read only)
// This extends the built-in auth.users table from Supabase
export type AuthUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: Record<string, any>;
};

// User Profiles Table - extends Supabase auth.users
export const userProfiles = pgTable("user_profiles", {
  user_id: uuid("user_id").primaryKey(), // References auth.users(id)
  email: text("email").notNull(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  full_name: text("full_name"),
  business_name: text("business_name"),
  business_type: text("business_type"),
  business_size: text("business_size"),
  phone: text("phone"),
  bio: text("bio"),
  avatar_url: text("avatar_url"),
  is_admin: boolean("is_admin").default(false),
  is_active: boolean("is_active").default(true),
  last_login: timestamp("last_login"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Admin Users Table - simple admin tracking
export const adminUsers = pgTable("admin_users", {
  user_id: uuid("user_id").primaryKey(), // References auth.users(id)
  email: text("email").notNull(),
  is_admin: boolean("is_admin").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// User Plans Table - subscription management
export const userPlans = pgTable("user_plans", {
  id: uuid("id").primaryKey(),
  user_id: uuid("user_id").notNull(), // References auth.users(id)
  plan_type: text("plan_type").notNull().default("free"), // 'free' or 'premium'
  plan_status: text("plan_status").notNull().default("active"), // 'active', 'cancelled', 'expired'
  billing_cycle: text("billing_cycle").default("monthly"), // 'monthly', 'yearly'
  amount_paid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  currency: text("currency").default("ZAR"),
  paystack_customer_code: text("paystack_customer_code"),
  paystack_subscription_code: text("paystack_subscription_code"),
  started_at: timestamp("started_at").defaultNow(),
  expires_at: timestamp("expires_at"),
  cancelled_at: timestamp("cancelled_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Early Signups Table - pre-launch leads
export const earlySignups = pgTable("early_signups", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  first_name: text("first_name").notNull(),
  business_name: text("business_name").notNull(),
  business_type: text("business_type").notNull(),
  business_size: text("business_size").notNull(),
  signup_date: timestamp("signup_date").defaultNow().notNull(),
  source: text("source").default("pre_launch_landing"),
  is_notified: boolean("is_notified").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Journal Entries Table
export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey(),
  user_id: uuid("user_id").notNull(), // References auth.users(id)
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  mood: text("mood"),
  energy_level: text("energy_level"),
  tags: text("tags").array(),
  ai_sentiment_score: decimal("ai_sentiment_score", { precision: 3, scale: 2 }),
  ai_categories: text("ai_categories").array(),
  ai_insights: text("ai_insights"),
  reflection: text("reflection"),
  entry_date: date("entry_date").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Goals Table
export const goals = pgTable("goals", {
  id: uuid("id").primaryKey(),
  user_id: uuid("user_id").notNull(), // References auth.users(id)
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  target_value: decimal("target_value", { precision: 15, scale: 2 }),
  current_value: decimal("current_value", { precision: 15, scale: 2 }).default("0"),
  unit: text("unit"),
  priority: text("priority").default("medium"),
  status: text("status").default("active"),
  due_date: date("due_date"),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Documents Table
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey(),
  user_id: uuid("user_id").notNull(), // References auth.users(id)
  name: text("name").notNull(),
  original_name: text("original_name").notNull(),
  file_path: text("file_path").notNull(),
  file_type: text("file_type").notNull(),
  file_size: bigint("file_size", { mode: "number" }).notNull(),
  category: text("category"),
  tags: text("tags").array(),
  description: text("description"),
  is_shared: boolean("is_shared").default(false),
  shared_with: uuid("shared_with").array(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Podcast Episodes Table
export const podcastEpisodes = pgTable("podcast_episodes", {
  id: uuid("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  series: text("series").notNull(),
  episode_number: integer("episode_number").notNull(),
  duration: integer("duration").notNull(), // in seconds
  has_video: boolean("has_video").default(false),
  video_url: text("video_url"),
  audio_url: text("audio_url"),
  is_published: boolean("is_published").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Podcast Progress Table
export const podcastProgress = pgTable("podcast_progress", {
  id: uuid("id").primaryKey(),
  user_id: uuid("user_id").notNull(), // References auth.users(id)
  episode_id: uuid("episode_id").notNull().references(() => podcastEpisodes.id),
  progress_seconds: integer("progress_seconds").default(0),
  is_completed: boolean("is_completed").default(false),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  user_id: true,
  created_at: true,
  updated_at: true,
});

export const insertEarlySignupSchema = createInsertSchema(earlySignups).omit({
  id: true,
  signup_date: true,
  created_at: true,
  updated_at: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

export const insertPodcastEpisodeSchema = createInsertSchema(podcastEpisodes).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// TypeScript Types
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

export type UserPlan = typeof userPlans.$inferSelect;
export type InsertUserPlan = typeof userPlans.$inferInsert;

export type EarlySignup = typeof earlySignups.$inferSelect;
export type InsertEarlySignup = z.infer<typeof insertEarlySignupSchema>;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type PodcastEpisode = typeof podcastEpisodes.$inferSelect;
export type InsertPodcastEpisode = z.infer<typeof insertPodcastEpisodeSchema>;

export type PodcastProgress = typeof podcastProgress.$inferSelect;
export type InsertPodcastProgress = typeof podcastProgress.$inferInsert;

// Supabase-specific types for admin dashboard
export type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  paidUsers: number;
  earlySignups: number;
  totalRevenue: number;
  monthlyRevenue: number;
  journalEntries: number;
  completedGoals: number;
  podcastViews: number;
  documentUploads: number;
  storageUsed: number;
  systemHealth: 'healthy' | 'warning' | 'error';
};
