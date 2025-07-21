# Bizzin - Business Planning Platform

## Overview

Bizzin is a modern full-stack web application designed to help entrepreneurs and growing companies transform their business ideas into actionable plans. The application is built using a clean architecture with a React frontend, Node.js/Express backend, and PostgreSQL database with Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: React Router DOM for client-side routing with nested layouts
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with `/api` prefix
- **Build Tool**: esbuild for production bundling
- **Development**: tsx for TypeScript execution in development

### Data Storage
- **Database**: PostgreSQL (configured for production)
- **ORM**: Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Development Storage**: In-memory storage implementation for quick prototyping
- **Migrations**: Drizzle Kit for schema migrations

## Key Components

### Frontend Structure
- **Components**: Located in `client/src/components/`
  - UI components from shadcn/ui in `components/ui/`
  - Layout components (header, footer) in `components/layout/`
- **Pages**: Route components in `client/src/pages/`
- **Hooks**: Custom React hooks in `client/src/hooks/`
- **Library**: Utilities and configuration in `client/src/lib/`

### Backend Structure
- **Server Entry**: `server/index.ts` with Express setup and middleware
- **Routes**: API route definitions in `server/routes.ts`
- **Storage**: Data access layer in `server/storage.ts` with interface abstraction
- **Development**: Vite integration for hot module replacement

### Shared Code
- **Schema**: Database schema and validation in `shared/schema.ts`
- **Types**: Shared TypeScript types between frontend and backend

## Data Flow

### Current Implementation
1. **User Interface**: React components render the business planning interface
2. **API Communication**: TanStack Query manages HTTP requests to `/api` endpoints
3. **Backend Processing**: Express routes handle business logic
4. **Data Storage**: Storage interface abstracts database operations
5. **Development Mode**: In-memory storage for rapid prototyping

### Production Ready Flow
1. **Database Operations**: Drizzle ORM with PostgreSQL for persistent data
2. **Schema Validation**: Zod schemas ensure data integrity
3. **Type Safety**: Full TypeScript coverage from database to UI

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router

### UI Framework
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Production bundling

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public/`
2. **Backend Build**: esbuild bundles server code to `dist/`
3. **Static Assets**: Frontend assets served by Express in production

### Environment Configuration
- **Development**: Hot reload with Vite middleware integration
- **Production**: Optimized builds with static file serving
- **Database**: Environment-based configuration via `DATABASE_URL`

### Key Design Decisions

**Monorepo Structure**: Single repository with clear separation between client, server, and shared code for easier development and deployment.

**Storage Interface Pattern**: Abstracted storage layer allows switching between in-memory (development) and PostgreSQL (production) without changing business logic.

**Type-Safe Database**: Drizzle ORM with TypeScript provides compile-time safety and excellent developer experience.

**Component Library**: shadcn/ui provides consistent, accessible components while maintaining customizability through Tailwind CSS.

**Modern Build Tools**: Vite for frontend and esbuild for backend ensure fast builds and optimal performance.