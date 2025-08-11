# Bizzin: Compressed Replit AI Project Config

## Overview
Bizzin is a modern SaaS platform designed for entrepreneurs to plan, journal, and track business goals. It's a frontend-only React application leveraging Supabase for authentication, database management, and file storage. The project's vision is to provide a comprehensive, intuitive tool that empowers entrepreneurs through structured goal setting, reflective journaling, and insightful tracking, ultimately boosting business success and personal growth. Key capabilities include a public landing page, protected user-specific pages for journaling, goals, training, biz-building tools, and document management, alongside user authentication and role-based access for freemium and premium features.

## User Preferences
- **Database Architecture**: Always use Supabase database with proper table structure (user_profiles, journal_entries, goals, documents, etc.) - never use simple Drizzle schema
- **Data Access**: Use `@/lib/supabase` for all data access with Supabase client-side SDK
- **Authentication**: Use Supabase Auth system (auth.users table) with user_profiles extension table
- **Admin System**: Use admin_users table or is_admin column in user_profiles for role-based access
- **UI Components**: Use `shadcn/ui` components where possible
- **No Backend Logic**: Do not reference any `/api` or `server/` folder - frontend-only with Supabase
- **Branding**: Maintain consistent #0B0A1D background color across all pages
- **Typography**: Use Inter font, all "Bizzin" instances in italics, 40px logo height standard

## System Architecture
The application is built with React 18 and TypeScript, using Tailwind CSS and shadcn/ui for a consistent and modern UI/UX. Routing is managed by React Router DOM, and Vite serves as the build tool. The core architectural decision is a frontend-only approach, relying entirely on Supabase for backend services, including Row-Level Security for data access control and Supabase Storage for document uploads.

**Database Connection:** The application uses Supabase cloud database exclusively with proper secret-based authentication (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY). All database operations are performed through the Supabase client in @/lib/supabase, with no local PostgreSQL or Drizzle ORM dependencies. The execute_sql_tool should never be used as it attempts to connect to a non-existent local PostgreSQL instance - use supabase.rpc('exec_sql') for direct SQL operations when needed.

**UI/UX Decisions:** The platform adopts a clean, modern aesthetic with a primary brand color of orange (#EA7A57), complemented by multi-colored data visualizations. Consistent design patterns are applied across all pages, featuring standardized headers, sub-headings, colored stats cards with gradient backgrounds and hover animations, and unified search/filter components. Interactive charts (recharts-based) are integrated for data visualization, and celebration animations are used for goal completion. Dark mode is fully supported with consistent #0B0A1D background color across all pages, components, and marketing materials. All "Bizzin" brand text appears in italics for elegant typography, and logos are standardized to 40px height throughout the platform.

**Technical Implementations & Feature Specifications:**
- **Authentication:** User sign-in/sign-up at `/auth` with a redesigned gradient background and improved UX.
- **Journaling:** A comprehensive business journal with calendar navigation, daily grouping, AI-powered sentiment analysis (business-focused emotion detection, contextual categorization, energy level tracking), and smart reflection prompts. Journal entry creation is streamlined, with AI handling classification invisibly. It includes search, filtering by categories/moods/tags, and progress tracking. Freemium limits (10 monthly entries for free plan) are enforced.
- **Goal Management:** Protected `/goals` page with interactive charting and integration with journal entries (optional goal selection in journal forms).
- **Document Management (DocSafe):** A complete system for file upload (drag & drop, validation, categorization), storage, search, and organization with Supabase Storage. Includes secure download/delete functionality and plan-based storage limits (50MB free, 10GB premium). A multi-format file viewer is implemented.
- **Business Tools (BizBuilder):** Includes essential business calculators.
- **Podcast Platform (formerly Training):** Transformed into a business podcast platform with 15-minute learning sessions. Features include episode tracking, progress saving, completion detection, learning streaks, and Cloudflare R2 integration for video hosting/streaming with intelligent audio/video UI adaptation and learning-focused player controls.
- **Dashboard:** A central hub integrating journal insights, business health metrics, and motivational quotes. Business Health features include Burnout Risk, Overall Health, Growth Momentum, and Recovery Resilience, all displayed with consistent progress bars and interactive tooltips.
- **Profile Management:** User profile page with editable fields (name, contact, bio) and profile picture upload via Supabase Storage.
- **Freemium System:** Comprehensive plan system with usage tracking and UI components differentiating free vs. premium features across the platform.
- **Referral System:** Complete referral program where users earn 10 days of free subscription for each successful paid referral. Features include unique referral codes, automatic tracking, real-time activation/deactivation based on referee subscription status, and comprehensive dashboard with referral history and earnings tracking.

**System Design Choices:**
- **Database Architecture:** Comprehensive Supabase schema with user_profiles (extends auth.users), user_plans, journal_entries, goals, documents, podcast_episodes, early_signups, and admin_users tables with proper RLS policies
- **Data Access:** All data access is managed through `@/lib/supabase` using the Supabase client-side SDK with proper table relationships and foreign keys
- **Admin System:** Full-featured admin dashboard with role-based access using admin_users table or is_admin column, real-time synchronization via Supabase subscriptions
- **Component-Based:** Heavy reliance on reusable React components and `shadcn/ui` for modularity and consistency
- **AI Integration:** Utilizes a hybrid AI architecture for sentiment analysis, leveraging Hugging Face inference API as primary and a robust local analysis engine as fallback
- **Security:** Robust Row-Level Security (RLS) policies are implemented across all Supabase tables to ensure data isolation and admin access control

## External Dependencies
- **Supabase:** Used for authentication, database (PostgreSQL), and storage (Supabase Storage).
- **React Router DOM:** For client-side routing.
- **Tailwind CSS:** For utility-first CSS styling.
- **shadcn/ui:** For UI components (built on Radix UI and Tailwind CSS).
- **Vite:** As the build tool.
- **recharts:** For interactive charts and data visualizations.
- **react-paystack:** For Paystack payment gateway integration (for ZAR currency).
- **Hugging Face Inference API:** For advanced business sentiment analysis.
- **Cloudflare R2:** For cost-effective video hosting and streaming.

## Recent Feature Updates (August 2025)
- **Consistent Brand Identity:** Implemented uniform #0B0A1D background color across all portal and marketing pages
- **Typography Enhancement:** Made all instances of "Bizzin" brand name italic throughout the platform
- **Logo Standardization:** Unified all logo instances to 40px height for consistent visual hierarchy
- **Marketing Page Alignment:** Updated all public-facing pages (Home, Journal, Goals, Podcast, BizBuilder Tools, DocSafe) to match portal design consistency
- **Authentication Experience:** Enhanced auth page styling with consistent background and improved branding
- **Dashboard Personalization:** Made username italic in welcome message with cleaner presentation (removed exclamation mark)
- **Marketing Transformation (August 5, 2025):** Completely transformed marketing messaging from basic productivity app to professional AI-powered business intelligence platform:
  - HomePage: "AI-Powered Business Intelligence" with comprehensive analytics messaging
  - Journal: "AI Business Intelligence Journal" emphasizing automatic mood detection and trend analysis
  - Goals: "Advanced Goal Analytics" highlighting professional tracking and insights
  - Training: "Learning Analytics Platform" with professional development tracking
  - BizBuilder: "Professional Financial Suite" showcasing enterprise-grade calculators with CSV export
  - DocSafe: "Intelligent Document Hub" emphasizing smart categorization and professional management
  - Added referral program marketing section highlighting ability to "Earn Free Subscription Days"
  - Updated plan features to accurately reflect AI analysis limits, storage quotas, and professional capabilities
- **Pre-Launch System (August 5, 2025):** Implemented database-driven platform settings system replacing environment variables, allowing real-time switching between pre-launch and live modes through admin dashboard
- **Comprehensive Admin Dashboard (August 5, 2025):** Implemented full-featured admin dashboard with real-time synchronization:
  - User Management: Search, filter, and manage all platform users with detailed profiles
  - Early Signups: Lead management system with bulk operations and export capabilities
  - Content Management: Podcast episode management with publish/draft controls
  - Financial Overview: Revenue analytics, subscription tracking, and transaction monitoring
  - System Health: Database status, storage usage, and performance monitoring
  - Analytics Dashboard: Interactive charts, KPIs, and comprehensive trend analysis
  - Real-time updates using Supabase realtime subscriptions for automatic synchronization
  - Role-based access control with proper admin authentication checks
- **Admin Navigation Enhancement (August 5, 2025):** Added dedicated "Admin" menu item to user profile dropdown that only appears for admin users, providing seamless access to the admin dashboard with Shield icon
- **Early Access Form Enhancement (August 11, 2025):** Added BizBuilder financial calculators and business tools to the "What to expect" section of the pre-launch signup form to better showcase platform capabilities
- **Project Structure Cleanup (August 5, 2025):** Comprehensive cleanup removing 300+ development screenshots and 50+ redundant SQL/setup files while preserving all functionality:
  - Removed all CleanShot development screenshots (kept only logos and essential assets)
  - Eliminated duplicate database setup files, migration scripts, and outdated utilities
  - Removed excessive documentation files (consolidated into replit.md)
  - Maintained working admin system (database-manager.ts, admin-user-manager.ts) and core functionality
  - Reduced root directory from 100+ files to 18 essential files for better maintainability
- **Database Architecture Cleanup (August 5, 2025):** Permanently resolved Supabase connection by:
  - Converting shared/schema.ts from Drizzle ORM to pure TypeScript types for Supabase compatibility
  - Removing all PostgreSQL/DATABASE_URL references that caused confusion
  - Ensuring all database operations use Supabase client with proper secrets (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
  - Created platform_settings table using supabase.rpc('exec_sql') for admin control
  - Confirmed Pre-Launch Toggle works without errors with real-time database switching