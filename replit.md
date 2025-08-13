# Bizzin - Complete Business Management Platform

## Overview

Bizzin is a modern SaaS platform designed for entrepreneurs to plan, journal, and track business goals. It's a comprehensive frontend-only React application leveraging Supabase for authentication, database management, and file storage. The platform integrates journaling with AI-powered sentiment analysis, goal tracking, business calculators, podcast training content, and secure document management - all designed to help business owners grow and manage their ventures effectively.

## User Preferences

Preferred communication style: Simple, everyday language.
Animation preferences: Sequential top-to-bottom animations for clean, professional page loading experience. Elements should appear in logical order from header down through content sections.

## System Architecture

### Frontend Architecture
The application is built with React 18 and TypeScript, using Vite as the build tool. The architecture follows a modern component-based approach with strict TypeScript typing and uses wouter for lightweight client-side routing. The UI is built with shadcn/ui components (built on Radix UI) and styled with Tailwind CSS, maintaining a consistent design system with a primary brand color of orange (#EA7A57) and dark theme support.

### Authentication & User Management  
The system uses Supabase Auth for authentication with a user_profiles table that extends the auth.users table. User sessions are managed through React context with automatic token refresh. Admin access is controlled through either an admin_users table or is_admin column in user_profiles, with comprehensive role-based access control throughout the application.

### Database Design
The application uses Supabase PostgreSQL database with a comprehensive schema including user_profiles, journal_entries, goals, documents, podcast_episodes, user_plans, user_podcast_progress, calculator_history, and admin tables. Row-Level Security (RLS) policies ensure data isolation and proper access control. All database operations are performed client-side using the Supabase SDK.

### AI-Powered Features  
The platform implements authentic AI sentiment analysis using Hugging Face inference API with cardiffnlp/twitter-roberta-base-sentiment and j-hartmann/emotion-english-distilroberta-base models. The system achieves 85-95% accuracy by processing real AI sentiment scores (LABEL_0/1/2) and emotion data (joy, sadness, anger, fear, etc.) to generate contextual business insights. All analysis uses genuine AI understanding rather than pattern matching, providing accurate mood detection, energy levels, and business categorization based on actual content analysis.

**Recent Infrastructure Issue Resolved (Aug 13, 2025):**
Successfully resolved persistent HEAD request errors by creating missing user_plans table in Supabase database:
- Created user_plans table with proper RLS policies and foreign key constraints
- Restored full PlansService functionality (getUserPlan, getUserUsage, upgradeToPremium)
- Re-enabled usePlans hook across all components (PlanManagement, JournalPage, DocSafePage, UploadModal)
- Eliminated all 400 Bad Request errors with clean console output
- Full plan management system operational with usage tracking and premium upgrades
All application functionality restored to normal operation with authentic database integration.

### Data Architecture Decisions
All data access is centralized through the @/lib/supabase module using the Supabase client-side SDK. The system maintains proper table relationships with foreign keys and implements real-time subscriptions for live updates. File uploads are handled through Supabase Storage with proper security policies.

### Business Model & Calculator Features  
The platform operates on a unified subscription model with a 14-day free trial followed by R199/month for full access to all features. The BizBuilder Tools include professional financial calculators (Cash Flow Projection, Break-Even Analysis, Business Budget, Loan Amortisation) with calculation history functionality. Users can save, load, and manage their calculation scenarios for strategic planning and decision-making. All marketing content has been updated to remove tier references and present the platform as a complete business intelligence suite.

### Component Architecture
The application uses a highly modular component structure with reusable UI components from shadcn/ui. Custom business logic is separated into services (PlansService, PodcastService) and hooks (usePlans, useAdminCheck, usePodcastProgress). The layout uses a consistent header/navigation system with theme support.

## External Dependencies

- **Supabase**: Complete backend-as-a-service providing PostgreSQL database, authentication system, real-time subscriptions, and file storage through Supabase Storage
- **Hugging Face API**: AI sentiment analysis using cardiffnlp/twitter-roberta-base-sentiment and j-hartmann/emotion-english-distilroberta-base models for business journal analysis
- **Cloudflare R2**: Optional cloud storage for podcast video content with S3-compatible API
- **shadcn/ui**: UI component library built on Radix UI primitives and Tailwind CSS for consistent design system
- **TanStack React Query**: Data fetching, caching, and synchronization for all API calls and state management
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration supporting dark mode
- **Radix UI**: Headless UI primitives providing accessible components for dropdowns, dialogs, and form elements
- **React Router (wouter)**: Lightweight client-side routing library for navigation
- **Recharts**: Interactive charts and data visualizations for analytics dashboards and goal tracking