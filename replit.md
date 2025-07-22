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
- **Preview Pages Implementation**: Created preview/teaser pages for all main features to improve user onboarding flow
- **BizBuilder Tools Addition**: Implemented BizBuilder Tools page with 3 essential calculators per final client scope
- **Scope Alignment**: Updated all preview content to accurately reflect committed deliverables and avoid overpromising
