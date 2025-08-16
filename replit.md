# Bizzin - Complete Business Management Platform

## Overview
Bizzin is a comprehensive SaaS platform designed to empower entrepreneurs. It's a frontend-only React application that helps users plan, journal, and track business goals. Key capabilities include AI-powered sentiment analysis for journaling, robust goal tracking, business calculators, podcast training content, and secure document management. Bizzin aims to provide a unified business intelligence suite for growth and management.

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

**Comprehensive Dashboard Card System Redesign (Aug 16, 2025)**: Implemented unified BaseStatsCard component with standardized layout zones for consistent UI/UX across all dashboard cards. Enhanced features include:

**Standardized Layout Architecture**: Created BaseStatsCard component with fixed-height zones (header, metric, progress, stats, insight, action) ensuring perfect horizontal alignment across all cards. Eliminates text cramping and positioning inconsistencies.

**Unified Typography & Spacing System**: Consistent font sizing, spacing tokens (8px, 16px, 24px, 32px), and visual hierarchy across all dashboard cards. Icon + title centered in header with info badges below, big numbers on same baseline, aligned action buttons.

**Theme-Based Design System**: Configurable color themes (blue, orange, purple, emerald) with consistent gradient patterns, hover states, and visual feedback. Each card maintains brand identity while following unified design principles.

**Enhanced Content Zones**: Header zone with centered icon/title/badges, metric zone with primary number/label/status, optional progress zone, stats grid, insight zone for contextual information, and action zone with consistent button styling.

**Professional Visual Alignment**: All dashboard cards now have elements on same horizontal lines, consistent spacing, proper breathing room, and no text overlap. Creates cohesive, scannable dashboard experience with improved information hierarchy.

### Component Architecture
Features a modular component structure with reusable shadcn/ui components. Business logic is separated into services (e.g., `PlansService`, `PodcastService`) and hooks (e.g., `usePlans`). The layout uses a consistent header/navigation system with theme support.

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