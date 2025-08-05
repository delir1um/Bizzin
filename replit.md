# Bizzin: Compressed Replit AI Project Config

## Overview
Bizzin is a modern SaaS platform designed for entrepreneurs to plan, journal, and track business goals. It's a frontend-only React application leveraging Supabase for authentication, database management, and file storage. The project's vision is to provide a comprehensive, intuitive tool that empowers entrepreneurs through structured goal setting, reflective journaling, and insightful tracking, ultimately boosting business success and personal growth. Key capabilities include a public landing page, protected user-specific pages for journaling, goals, training, biz-building tools, and document management, alongside user authentication and role-based access for freemium and premium features.

## User Preferences
- Do not add Express.js, Drizzle ORM, or backend logic
- Use `@/lib/supabase` for all data access
- Use `shadcn/ui` components where possible
- Do not reference any `/api` or `server/` folder
- Use Supabase client-side SDK for authentication, CRUD, and file uploads
- Maintain consistent branding with custom #0B0A1D background color across all pages
- Use Inter font over Orbitron for better SaaS readability
- All instances of "Bizzin" brand name must appear in italics
- Standardize logo sizing to 40px height across all components

## System Architecture
The application is built with React 18 and TypeScript, using Tailwind CSS and shadcn/ui for a consistent and modern UI/UX. Routing is managed by React Router DOM, and Vite serves as the build tool. The core architectural decision is a frontend-only approach, relying entirely on Supabase for backend services, including Row-Level Security for data access control and Supabase Storage for document uploads.

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
- **Data Access:** All data access is managed through `@/lib/supabase` using the Supabase client-side SDK.
- **Component-Based:** Heavy reliance on reusable React components and `shadcn/ui` for modularity and consistency.
- **AI Integration:** Utilizes a hybrid AI architecture for sentiment analysis, leveraging Hugging Face inference API as primary and a robust local analysis engine as fallback. AI operates invisibly, providing personalized insights and coaching without cluttering the UI. A retroactive AI migration system ensures all existing entries benefit from AI improvements.
- **Security:** Robust Row-Level Security (RLS) policies are implemented across all Supabase tables to ensure data isolation and security.

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