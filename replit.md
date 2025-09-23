# Bizzin - Complete Business Management Platform

## Overview
Bizzin is a comprehensive SaaS platform designed to empower entrepreneurs. It's a frontend-only React application that helps users plan, journal, and track business goals. Key capabilities include AI-powered sentiment analysis for journaling, advanced milestone-based goal tracking with visual progress indicators, business calculators, podcast training content, and secure document management. Bizzin aims to provide a unified business intelligence suite for growth and management.

## User Preferences
Preferred communication style: Simple, everyday language.
Animation preferences: Sequential top-to-bottom animations for clean, professional page loading experience. Elements should appear in logical order from header down through content sections.

## System Architecture

### Frontend Architecture
Built with React 18 and TypeScript, using Vite. It employs a component-based approach with strict TypeScript typing and wouter for client-side routing. UI is developed with shadcn/ui (Radix UI-based) and styled with Tailwind CSS, maintaining a consistent design system with orange (#EA7A57) as the primary brand color and dark theme support.

### Authentication & User Management
Supabase Auth is used for user authentication, with user profiles extending the `auth.users` table. React context manages user sessions with automatic token refresh. Admin access is controlled via an `admin_users` table or `is_admin` column in `user_profiles`, implementing comprehensive role-based access control.

### Database Design
Utilizes Supabase PostgreSQL for its database, featuring schemas for `user_profiles`, `journal_entries`, `goals`, `documents`, `podcast_episodes`, `user_plans`, `user_podcast_progress`, `calculator_history`, and `admin` tables. Row-Level Security (RLS) ensures data isolation. All database operations are client-side via the Supabase SDK.

### AI-Powered Features
Integrates authentic AI sentiment analysis using the Hugging Face inference API, specifically `cardiffnlp/twitter-roberta-base-sentiment` and `j-hartmann/emotion-english-distilroberta-base` models. This provides 85-95% accuracy for mood detection, energy levels, and business categorization based on content analysis. A robust API quota protection system ensures continuous service for paid users, featuring automatic fallback to keyword-based analysis during quota limits, real-time monitoring, graceful degradation, and auto-recovery. Enhanced business insights provide contextual entrepreneurial guidance derived from existing AI sentiment data. Dynamic AI version management updates version labels based on analysis source.

### Data Architecture Decisions
All data access is centralized through `@/lib/supabase` using the Supabase client-side SDK. The system maintains proper table relationships with foreign keys and supports real-time subscriptions. Supabase Storage handles secure file uploads.

### Business Model & Calculator Features
Operates on a unified subscription model with a 14-day free trial followed by a monthly fee for full access. BizBuilder Tools include professional financial calculators (Cash Flow Projection, Break-Even Analysis, Business Budget, Loan Amortisation) with history functionality for saving and managing calculation scenarios.

**Daily Email System Implementation (Aug 19, 2025)**: Successfully deployed complete personalized daily email system with SMTP2GO integration using verified notifications@bizzin.co.za sender. Features authentic user data personalization, AI sentiment analysis from journal entries, dynamic business insights, Handlebars template compilation, and proper development/production email scheduling (manual test-only in dev, scheduled 8 AM daily in production).

**Enhanced Email Content & Design (Aug 19, 2025)**: Upgraded daily emails with premium business intelligence features and portal-consistent styling. Content enhancements include actionable insights based on energy patterns, gamification badges (Weekly Warrior, Goal Crusher), personalized weekly challenges, smart recommendations for platform engagement, and enhanced 4-card statistics grid. Design improvements feature Inter font family, professional orange gradient header, modernized card layouts with subtle shadows, consistent brand colors using HSL values, and refined typography with proper letter spacing and visual hierarchy.

**Email Client Compatibility Resolution (Aug 19, 2025)**: Resolved critical email rendering inconsistencies across different email clients by implementing email-safe template architecture. Created table-based layout using XHTML Transitional DOCTYPE, inline CSS styling, and comprehensive email client overrides. Added Outlook-specific fixes, Gmail compatibility layers, and forced light theme enforcement. Emails now display consistently across Gmail, Outlook, Apple Mail, Yahoo, and mobile email clients, maintaining Bizzin's professional brand appearance universally.

**Production Video Streaming Fix (Sep 17, 2025)**: Resolved critical 500 errors in production video streaming by implementing public bucket fast path. Root cause was proxy requiring R2 credentials even for public buckets (starting with 'pub-'). Solution bypasses S3 SDK entirely for public buckets, using direct HTTP proxy to https://{bucketName}.r2.dev/{videoKey} with proper Range header forwarding and status code propagation (200/206/404). This eliminates production failures while maintaining backward compatibility for private buckets with S3 SDK.

**Enhanced Daily Digest Implementation (Aug 19, 2025)**: Transformed daily emails from simple notifications into comprehensive business engagement tools implementing all 6 strategic components for entrepreneur motivation and platform usage. Features include:

**Daily Motivation & Focus**: Rotating business growth quotes with "Your Daily Business Fuel" branding. Top priority goal display with visual progress bars, completion percentage, and days remaining countdown for immediate goal focus.

**Personal Progress Snapshots**: Journal progress tracking with streak recognition (e.g., "5 day streak! You're building an amazing habit"). Recent entry acknowledgment with title preview and momentum encouragement messaging.

**Business Health Dashboard**: Multi-indicator health check including goals-on-track ratio, journal reflection consistency ratings, and sentiment trend analysis providing comprehensive business wellness overview.

**Actionable Engagement Nudges**: Dynamic action items targeting specific user needs - goal creation for new users, progress updates for stale goals, journal prompts for inactive users, and BizBuilder tools promotion for financial planning.

**Smart Platform Suggestions**: Contextual recommendations based on user activity patterns. Financial goal users get cash flow projection tools, negative sentiment users receive strategy resources, and document management suggestions for organization needs.

**Unified Email Architecture**: Seamless integration of enhanced digest sections with existing email infrastructure. Maintains professional branding consistency, cross-client compatibility, and authentic user data integration without placeholder content.

**Supabase Security Enhancements (Aug 19, 2025)**: Addressed critical security lints from Supabase including RLS (Row Level Security) configuration on podcast_episodes table and security definer view reviews. Enhanced database security posture with proper access controls and authentication policies.

**Comprehensive Dashboard Card System Redesign (Aug 16, 2025)**: Implemented unified BaseStatsCard component with standardized layout zones for consistent UI/UX across all dashboard cards. Enhanced features include:

**Standardized Layout Architecture**: Created BaseStatsCard component with fixed-height zones (header, metric, progress, stats, insight, action) ensuring perfect horizontal alignment across all cards. Eliminates text cramping and positioning inconsistencies.

**Unified Typography & Spacing System**: Consistent font sizing, spacing tokens (8px, 16px, 24px, 32px), and visual hierarchy across all dashboard cards. Icon + title centered in header with info badges below, big numbers on same baseline, aligned action buttons.

**Theme-Based Design System**: Configurable color themes (blue, orange, purple, emerald) with consistent gradient patterns, hover states, and visual feedback. Each card maintains brand identity while following unified design principles.

**Enhanced Content Zones**: Header zone with centered icon/title/badges, metric zone with primary number/label/status, optional progress zone, stats grid, insight zone for contextual information, and action zone with consistent button styling.

**Professional Visual Alignment**: All dashboard cards now have elements on same horizontal lines, consistent spacing, proper breathing room, and no text overlap. Creates cohesive, scannable dashboard experience with improved information hierarchy.

**Advanced Milestone System (Aug 18, 2025)**: Comprehensive milestone-based goal tracking with visual progress indicators and intelligent data preservation:

**Complete Milestone Management**: Full CRUD operations for milestones with inline editing, weight-based progress calculation, and real-time validation ensuring milestone weights total 100% for accurate tracking.

**Visual Progress Indicators**: Milestone goals display colored dots positioned along the progress timeline based on cumulative weight, with green indicating completed milestones and gray for pending ones. Includes hover tooltips and progress summaries.

**Intelligent Goal Type Conversion**: Bidirectional conversion between manual and milestone-based tracking with milestone data preservation. When switching back to milestone mode, previous milestones are automatically restored, preventing accidental data loss.

**Comprehensive Error Resolution**: Systematic resolution of six critical erratic behaviors including form state synchronization, modal closure prevention, weight validation, and milestone editing functionality. Complete audit logging system implemented for debugging user interactions.

**Enhanced User Experience**: Improved milestone weight validation with real-time feedback, color-coded status indicators, and progressive validation that guides users toward proper 100% weight distribution while maintaining workflow flexibility.

**Claude AI Integration Implementation (Sep 23, 2025)**: Successfully integrated a Claude-powered mini-agent into the Bizzin application providing AI chat functionality through API endpoints and React components:

**Backend AI Infrastructure**: Created comprehensive AI configuration system (`server/ai/config.ts`) with Zod validation, Anthropic client wrapper with streaming support (`server/ai/anthropic.ts`), and Express API routes (`server/ai/routes.ts`) providing `/api/ai/health` and `/api/ai/chat` endpoints with Server-Sent Events for real-time streaming responses.

**Frontend AI Components**: Developed `useClaudeChat` React hook with robust streaming support including proper buffering for partial SSE lines, error handling, and message state management. Created `AiChatWidget` drop-in component with minimal CSS styling, auto-resizing textarea, and responsive design.

**Floating AI Assistant**: Implemented floating AI chat widget positioned bottom-right on all pages, exclusively visible to `anton@cloudfusion.co.za` for development and testing purposes. Features responsive design with mobile-optimized full-width modal at 60vh height, shadow styling, and z-index positioning.

**Testing Infrastructure**: Created CLI testing script (`scripts/ai-cli.js`) for command-line AI interactions and smoke test script (`scripts/ai-smoketest.js`) for endpoint validation. Updated environment configuration template in `.env.example` with AI-specific variables.

**Security & Configuration**: Utilizes Replit's Anthropic integration for secure API key management. Currently configured with Claude Sonnet 4 model, 800 token limit, and 0.2 temperature for business-focused responses.

### Component Architecture
Features a modular component structure with reusable shadcn/ui components. Business logic is separated into services (e.g., `PlansService`, `PodcastService`) and hooks (e.g., `usePlans`). The layout uses a consistent header/navigation system with theme support. AI functionality is organized in dedicated `client/src/ai/` directory with UI components and hooks.

## External Dependencies

-   **Supabase**: Backend-as-a-service for PostgreSQL database, authentication, real-time subscriptions, and file storage.
-   **Hugging Face API**: AI sentiment analysis for journal content.
-   **Cloudflare R2**: Optional cloud storage for podcast video content (S3-compatible).
-   **shadcn/ui**: UI component library built on Radix UI and Tailwind CSS.
-   **TanStack React Query**: Data fetching, caching, and synchronization.
-   **Tailwind CSS**: Utility-first CSS framework with custom theme configuration.
-   **Radix UI**: Headless UI primitives for accessible components.
-   **wouter**: Lightweight client-side routing library.
-   **Recharts**: Interactive charts and data visualizations.