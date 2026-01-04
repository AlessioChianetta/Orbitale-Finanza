# Percorso Capitale - Financial Management Application

## Overview

Percorso Capitale is a comprehensive financial management application built with React, Node.js, and PostgreSQL. The application helps users track their financial journey through automated transaction categorization, goal setting, investment tracking, and educational content. It features a modern UI with shadcn/ui components and provides both personal finance management and educational academy features.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite for development and production builds
- **Form Management**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for API endpoints
- **Authentication**: Passport.js with local strategy and session management
- **Database**: PostgreSQL with Drizzle ORM
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple
- **External APIs**: Finnhub for financial market data

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type sharing between client and server
- **Migration Strategy**: Drizzle Kit for schema migrations
- **Connection**: Supabase-hosted PostgreSQL instance

## Key Components

### Authentication System
- Local authentication with email/password
- Session-based authentication using PostgreSQL session store
- Password hashing with Node.js crypto (scrypt)
- Protected routes with authentication middleware

### Financial Data Management
- **Assets**: Liquidity, investments, properties, vehicles tracking
- **Liabilities**: Debt and obligation management
- **Income/Expense**: Transaction categorization and tracking
- **Goals**: Financial objective setting with progress tracking
- **Budget**: Automated 50/30/20 budgeting system

### Transaction Categorization
- Automated categorization using pattern matching rules
- Support for Italian merchants and transaction descriptions
- Budget category assignment (needs/wants/savings)
- Manual category override capabilities

### Investment Features
- Integration with Finnhub API for real-time market data
- Stock/ETF search and quote functionality
- Portfolio tracking and allocation management
- Investment goal simulation and planning

### Educational Academy
- Video-based learning content with progress tracking
- Secure video player with anti-piracy measures
- Course and lesson management system
- Community features for user interaction
- Progress tracking and achievement system

### Business Analysis Module (Analisi Aziendale)
- Break-even analysis with daily, monthly, and annual calculations
- Cost management system for fixed costs, variable costs, and labor costs
- Revenue tracking with manual and automatic modes
- Business entities system for generic products/services (replaces restaurant-specific menuItems)
- Custom fields support via JSONB for flexible data attributes
- Dashboard with KPIs, profit/loss analysis, and cost summaries
- Financial report generation capabilities
- Month-by-month historical analysis

## Data Flow

1. **User Authentication**: Login/registration → Session creation → Protected route access
2. **Financial Data**: Manual entry/CSV import → Categorization → Storage → Dashboard visualization
3. **Market Data**: Finnhub API → Real-time quotes → Investment tracking updates
4. **Educational Content**: Video streaming → Progress tracking → Achievement unlocking
5. **Goal Management**: Target setting → Monthly tracking → Progress visualization

## External Dependencies

### Third-Party Services
- **Supabase**: PostgreSQL database hosting
- **Finnhub**: Financial market data API
- **Replit**: Development and deployment platform

### Key NPM Packages
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Database ORM and query builder
- **@radix-ui/***: UI component primitives
- **passport**: Authentication middleware
- **express-session**: Session management
- **zod**: Schema validation
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- Replit-based development with hot reloading
- Environment variables loaded via `loadEnv.cjs`
- Development server runs on port 5000
- Vite dev server for frontend assets

### Production Build
- Vite build for client assets to `dist/public`
- esbuild for server bundle to `dist/index.js`
- Static file serving from built assets
- Session persistence in PostgreSQL

### Environment Configuration
- Database connection via `DATABASE_URL`
- Finnhub API key for market data
- Session secret for authentication security
- Supabase PostgreSQL connection parameters

## Changelog

- June 22, 2025. Initial setup
- August 6, 2025. Implemented comprehensive mobile optimization including:
  - Hamburger menu navigation for mobile/tablet
  - Mobile-first responsive design patterns
  - Touch-friendly interface elements
  - Proper mobile header with overlay navigation
  - Enhanced mobile CSS utilities and responsive breakpoints
- October 13, 2025. Integrated Business Analysis Module:
  - Added 9 database tables for cost analysis (fixed_costs, variable_costs, labor_costs, revenue_settings, manual_revenue, cost_notes, break_even_analysis, business_entities, custom_attributes)
  - Refactored backend to be business-agnostic (removed restaurant-specific dependencies)
  - Created generic businessEntities table to support any business type
  - Added "Analisi Aziendale" to sidebar navigation with /business-analysis route
  - Implemented dynamic custom fields using JSONB for flexible data attributes
  - Updated schema to use userId convention consistently across all cost analysis tables

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**Transaction Edit Feature & Debiti Category (October 23, 2025)**
- Implemented EditTransactionDialog component for modifying existing transactions
- Added PATCH /api/transactions/:id endpoint in backend with ownership verification
- Fixed critical bug: accountType field now correctly mapped to account_type in PATCH payload
- Added new "Debiti e Finanziamenti" expense category with 9 subcategories:
  * Carte di credito, Prestiti personali, Mutuo casa, Finanziamento auto/moto
  * Prestiti studenteschi, Debiti familiari, Scoperti bancari, Altri debiti
- Integrated CreditCard icon for Debiti category in Transactions, Budget, and categorization system
- Updated categoryConfig mappings with rose-themed colors for the new debt category
- Added 'debiti' key to CATEGORY_NAME_MAPPING in shared/categorization.ts
- Created categorization rules for automatic debt detection with budgetType: 'needs'
- Category fully integrated in Budget module for budget creation and tracking

**Business Analysis Module Refinements (October 13, 2025)**
- Removed all restaurant-specific terminology (ordini → unità, sistema ordini → sistema vendite)
- Made module fully generic for ANY business type (retail, services, manufacturing, etc.)
- Fixed all TypeScript LSP errors in backend (server/costAnalysis.ts) and frontend (CostAnalysisDashboard.tsx)
- Verified monthKey support is working correctly for month-by-month data tracking
- Prepared custom fields system for dynamic column/row management

**Mobile Optimization (August 6, 2025)**
- Added responsive hamburger navigation menu for mobile devices
- Implemented mobile header with proper navigation controls
- Created mobile-first CSS utilities for better responsive design
- Enhanced AppLayout component with mobile state management
- Added mobile-specific spacing, grid layouts, and touch targets
- Improved mobile viewport handling for iOS Safari and Android Chrome