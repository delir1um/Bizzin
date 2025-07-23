# Replit AI Project Config: Bizzin

## Overview
Bizzin is a modern SaaS platform to help entrepreneurs plan, journal, and track business goals. It is a frontend-only React application using Supabase for auth, database, and storage.

## Tech Stack
- **Frontend Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: shadcn/ui (based on Radix UI + Tailwind)
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Auth & DB**: Supabase (with Row-Level Security + plan fields)
- **Storage**: Supabase Storage (for DocSafe uploads)

## File Structure
- `/src/pages/` — Route-level components (HomePage, AuthPage, etc.)
- `/src/components/` — Reusable components and UI elements
- `/src/layout/` — Global layout (Navbar, Sidebar, Footer)
- `/src/hooks/` — Custom React hooks
- `/src/lib/` — Supabase client, theme-provider, utilities
- `/public/` — Static assets

## Behavior Rules for Replit AI
- Do not add Express.js, Drizzle ORM, or backend logic
- Use `@/lib/supabase` for all data access
- Use `shadcn/ui` components where possible
- Do not reference any `/api` or `server/` folder
- Use Supabase client-side SDK for authentication, CRUD, and file uploads

## Project Goals
- Public landing page (`/`)
- Protected pages: `/journal`, `/goals`, `/training`, `/bizbuilder`, `/docsafe`
- User sign in / sign up at `/auth`
- Role-based feature access: free vs premium

## Recent Changes (July 22, 2025)
- **Brand Color Update**: Converted primary theme from blue (#3B82F6) to orange (#EA7A57) to match client's branding mockup
- **Dashboard Enhancement**: Added interactive colorful charts including donut progress chart, category distribution, priority progress bars, and deadline timeline
- **Visual Improvements**: Enhanced stat cards with gradient backgrounds, colored icons, and hover animations
- **Chart Integration**: Implemented recharts-based interactive visualizations with tooltips and legends
- **Celebration System**: Added confetti animations and toast notifications for goal completion
- **Theme Consistency**: Updated all components to use orange as primary brand color while maintaining multi-colored data visualization
- **Inspirational Quote System**: Added personalized daily business quotes in welcome section with smart name integration and category tagging
- **Preview Pages Implementation**: Created preview/teaser pages for all main features to improve user onboarding flow
- **BizBuilder Tools Addition**: Implemented BizBuilder Tools page with 3 essential calculators per final client scope
- **Scope Alignment**: Updated all preview content to accurately reflect committed deliverables and avoid overpromising
- **Auth Page Enhancement**: Completely redesigned login page with attractive gradient background, orange branding, and improved UX
- **Journal Complete Implementation**: Finished all 3 stages of journal functionality including database foundation, CRUD operations, and enhanced features
- **Journal Features**: Entry creation modal, search functionality, date filtering, pagination, mood/category tracking, and tag management
- **Database Schema**: Created complete journal_entries table schema with proper RLS policies (requires manual SQL execution in Supabase)
- **UI Components**: Added missing Textarea and Select components for complete form functionality
- **DocSafe Implementation**: Built complete document management system with file upload, storage, search, and organization
- **File Upload System**: Drag & drop interface with validation, category selection, tag management, and description support
- **Document Operations**: Real-time search, category filtering, secure download, delete functionality with confirmation
- **Storage Integration**: Supabase Storage bucket integration with proper RLS policies and file path management
- **Analytics Dashboard**: Real storage usage tracking, document counts, and category distribution metrics
- **Premium Dashboard Enhancement**: Transformed dashboard with scalable design for large datasets, enhanced visual hierarchy, progress indicators, and professional empty states
- **Motivational System**: Integrated daily inspirational business quotes with personalized name insertion to boost user engagement and motivation
- **Profile Management System**: Complete user profile page with editable fields (name, contact, bio), profile picture upload via Supabase Storage, and integration throughout the app
- **Name Personalization Enhancement**: Enhanced quote system to prioritize user profile names over email parsing for better personalization
- **Welcome Section Design Update**: Changed from orange gradient to clean white background for better readability while maintaining orange accent on user names
- **DocSafe Delete Dialog Fix**: Replaced problematic browser confirm dialog with proper React AlertDialog component featuring clean UI, loading states, and consistent styling
- **Plan System Implementation**: Built comprehensive freemium plan system with database schema, usage tracking, and UI components for free vs premium differentiation
- **Usage Limits Integration**: Added plan limits throughout platform including storage (50MB free, 10GB premium), document uploads (20/month free, unlimited premium), and feature restrictions
- **DocSafe Plan Integration**: Implemented upload restrictions, storage warnings, and upgrade prompts based on user plan with limit banners and upgrade modal
- **Journal Enhancement Phase**: Completed comprehensive journal functionality improvements including proper React AlertDialog for delete confirmations, full entry viewing modal, complete edit functionality with form validation, clickable content expansion with "Read more" links, and visual date filter clearing with X button integration
- **Journal MVP Transformation**: Implemented scalable business journal with calendar navigation, daily grouping, and unified layout. Features include monthly calendar with entry indicators, selected date entries displayed below calendar, auto-selected today's date, and streamlined entry creation with single contextual "Add Entry" button that opens full creation modal
- **Journal Visual Enhancement**: Added colorful gradient backgrounds to journal entries based on category and mood, with enhanced badges, improved typography, and subtle hover animations for more engaging user experience
- **Journal Filtering System**: Implemented comprehensive filtering by categories, moods, and tags with visual filter chips, clear all functionality, tag search functionality, and updated color scheme to match actual business categories (Research, Planning, Strategy, Feedback, etc.)
- **Smart Reflection Prompts System (Phase 1)**: Built comprehensive business-focused reflection prompt system with 20+ curated questions across categories (daily, weekly, challenge, success, strategy). Features interactive prompt card with orange gradient design, "Use as Title" functionality, prompt refresh capability, and smart placeholder integration for authentic entrepreneurial journaling experience
- **AI Business Sentiment Analysis (Phase 1 Infrastructure)**: Implemented comprehensive business-focused sentiment analysis system inspired by Reflectr. Features automatic mood detection (confident, excited, stressed, etc.), energy level tracking, business context recognition (growth, challenge, achievement), personalized business insights generation, and visual sentiment badges. Database migration required to enable full functionality (see SENTIMENT_ANALYSIS_SETUP.md)
- **Journal Experience Streamlining**: Removed manual mood, category, and tags dropdowns from entry creation since AI handles all classification automatically. Simplified interface focuses purely on title and content with clear AI processing notice, creating friction-free writing experience like Reflectr
- **Enhanced Business Journal Dashboard (July 23, 2025)**: Transformed journal into dashboard-first experience with comprehensive analytics, pattern recognition, and smart navigation. Features include: writing streak tracking, dominant mood analysis, energy level insights, quick stats cards, recent entries preview, contextual quick actions, and seamless view mode switching between dashboard and calendar views
- **Smart Search & Discovery System**: Implemented intelligent search with real-time suggestions, quick filters for moods/categories/energy levels, and contextual entry discovery. Features dropdown suggestions for entries/tags/categories/moods with counts, smart quick filters based on user patterns, and integrated search within dashboard experience
- **Progressive Information Architecture**: Redesigned journal flow with dashboard as default view, calendar for date-specific browsing, and automatic context switching for search/filter results. Enhanced UX with view mode persistence, contextual navigation, and streamlined entry actions throughout the experience
- **Main Dashboard Integration (July 23, 2025)**: Enhanced main platform dashboard to serve as central business tracking hub with integrated journal insights. Features include: journal statistics card with writing streak tracking, recent journal entries section with mood indicators and quick navigation, journal-focused quick actions for seamless workflow integration, and unified business tracking experience combining goals and journal insights in one cohesive dashboard
- **Goal-Journal Linking Phase 1 (July 23, 2025)**: Implemented foundational goal-journal integration system with optional goal selection in journal creation/editing forms, orange goal badges with target icons on linked entries, active goal filtering in dropdowns, and database schema enhancement with related_goal_id foreign key. Created comprehensive setup guide (GOAL_JOURNAL_LINKING_SETUP.md) with Supabase migration instructions for complete functionality activation
- **Complete UI/UX Uniformity Implementation (July 23, 2025)**: Achieved comprehensive uniformity across all platform pages following the Goals page pattern (heading → sub-heading → colored stats cards → search/filters → content). Enhanced all pages with consistent orange branding, gradient stats cards with hover effects, unified header structures with proper action buttons, standardized loading states with branded spinners, and consistent button styling throughout. Applied pattern to Training, BizBuilder Tools, DocSafe, Journal, and Goals pages while preserving logical functionality and ensuring dynamic data accuracy
