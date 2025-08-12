# Overview

Bizzin is a comprehensive AI-powered business intelligence SaaS platform designed for entrepreneurs to plan, journal, track goals, and manage their business operations. The application is built as a modern React-based frontend that leverages Supabase for backend services, combining business journaling with AI sentiment analysis, goal tracking, financial calculators, podcast content, document management, and referral systems. The platform operates on a freemium model with tiered access to features based on subscription plans.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18 + TypeScript**: Modern component-based architecture with strict type safety
- **Vite Build System**: Fast development and optimized production builds
- **Wouter Routing**: Lightweight client-side routing for single-page application navigation
- **Tailwind CSS + shadcn/ui**: Utility-first styling with consistent design system using Radix UI components
- **Framer Motion**: Advanced animations and micro-interactions for enhanced user experience
- **React Query (TanStack)**: Sophisticated state management for server state with caching and optimistic updates

## Backend Architecture (Supabase-Only)
- **Supabase PostgreSQL**: Primary database with comprehensive schema including user_profiles, journal_entries, goals, documents, podcast_episodes, user_plans, admin_users, and referral systems
- **Supabase Auth**: Built-in authentication system with user_profiles table extending the auth.users table
- **Supabase Storage**: File storage for documents, profile pictures, and podcast videos
- **Row-Level Security (RLS)**: Data isolation and security policies implemented across all tables
- **Real-time Subscriptions**: Live data updates for admin dashboards and collaborative features

## AI & Analytics Systems
- **Hybrid AI Sentiment Analysis**: Primary integration with Hugging Face inference API for business-focused mood detection, with comprehensive local analysis fallback using 500+ training examples
- **User Learning System**: AI accuracy improvement through user feedback with persistent correction storage
- **Business Context Intelligence**: Category detection (Growth, Challenge, Achievement, Planning, Learning, Research) with contextual business insights
- **Advanced Training Data**: Multi-length coverage from quick notes to comprehensive business narratives

## Key Architectural Decisions

### Database Design
- **Supabase-First Approach**: Complete reliance on Supabase cloud infrastructure eliminates need for custom backend server
- **Comprehensive Schema**: Rich relational data model supporting complex business scenarios with proper foreign key relationships
- **Admin System**: Dual admin verification through both admin_users table and user_profiles.is_admin column for flexibility

### Component Architecture
- **Standardized Page Layout**: Consistent layout system with reusable stat cards and animated components
- **Modal-Based Interactions**: Centralized modal system for create/read/update/delete operations across all features
- **Responsive Design**: Mobile-first approach with consistent breakpoints and touch-friendly interfaces

### Plan & Usage System
- **Comprehensive Freemium Model**: Usage tracking across documents, journal entries, goals, and storage with plan-specific limits
- **Real-time Quota Management**: Dynamic limit checking with user-friendly upgrade prompts and usage visualization
- **Referral Integration**: 10-day premium extension system with unique referral codes and automatic tracking

### Security & Performance
- **Client-Side Security**: All sensitive operations protected by Supabase RLS policies with role-based access control
- **Optimistic Updates**: React Query implementation provides instant UI feedback while maintaining data consistency
- **Caching Strategy**: Strategic cache timing (30 seconds for usage, 10 minutes for static data) balances freshness with performance

# External Dependencies

- **Supabase Platform**: Complete backend solution providing PostgreSQL database, authentication system, real-time subscriptions, and file storage
- **Hugging Face Inference API**: Primary AI service for advanced sentiment analysis and business mood detection with business-specific model endpoints
- **Cloudflare R2**: Optional video storage service for podcast content with S3-compatible API integration
- **Tailwind CSS + shadcn/ui**: Design system built on Radix UI primitives providing accessible, customizable component library
- **React Query (TanStack)**: Advanced data fetching and state management with automatic background updates and caching
- **Framer Motion**: Animation library for smooth transitions and enhanced user experience
- **React Hook Form + Zod**: Form management with runtime type validation and schema-based validation
- **Date-fns**: Date manipulation and formatting utilities for timeline and calendar features
- **React Router (Wouter)**: Lightweight routing solution for single-page application navigation
- **Recharts**: Data visualization library for business analytics, goal tracking, and dashboard metrics