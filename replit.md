# Overview

SecureVote is a fully functional secure electronic voting platform built with React, Express.js, and PostgreSQL. The application provides comprehensive voting capabilities with role-based access control, security monitoring, and audit trails. Key features include:

✓ **Complete Authentication System** - Replit OAuth integration with session management
✓ **Role-Based Access Control** - Admin and voter roles with appropriate permissions  
✓ **Election Management** - Create, configure, and manage elections with candidates
✓ **Anonymous Voting System** - Secure vote casting with cryptographic hashing
✓ **Real-Time Results** - Live election results with visual charts and analytics
✓ **Security Monitoring** - Audit logs, security events, and threat detection
✓ **Responsive Design** - Mobile-friendly interface with custom SecureVote branding

The platform successfully handles the complete voting lifecycle from election creation to results publication while maintaining vote anonymity and system security.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built using **React with TypeScript**, leveraging Vite as the build tool for fast development and optimized production builds. The application uses a component-based architecture with:

- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management and caching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens for consistent theming
- **Form Handling**: React Hook Form with Zod validation

The frontend follows a page-based routing structure with role-based access control, automatically redirecting users to appropriate dashboards based on their permissions (admin vs voter).

## Backend Architecture

The backend is implemented as an **Express.js server** with TypeScript, following a layered architecture:

- **API Layer**: RESTful endpoints organized by feature (auth, elections, voting)
- **Business Logic Layer**: Service layer handling core voting operations and security checks
- **Data Access Layer**: Storage abstraction using Drizzle ORM with PostgreSQL

The server implements comprehensive logging, error handling, and request/response middleware for debugging and monitoring.

## Authentication & Authorization

The application integrates **Replit's OpenID Connect (OIDC)** authentication system:

- **Session Management**: PostgreSQL-backed session store using connect-pg-simple
- **User Management**: Automatic user creation/updates from OIDC claims
- **Role-Based Access**: Admin and voter roles with appropriate API endpoint protection
- **Security**: HTTP-only secure cookies with configurable TTL

## Data Storage

The application uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations:

- **Schema Management**: Centralized schema definitions with automatic type generation
- **Migration System**: Drizzle Kit for database schema migrations
- **Connection Pooling**: Neon serverless PostgreSQL with connection pooling
- **Session Storage**: Dedicated sessions table for authentication state

Key database entities include users, elections, candidates, votes, voter eligibility, audit logs, and security events.

## Security Architecture

Security is implemented at multiple layers:

- **Data Encryption**: Vote anonymization and secure storage
- **Audit Logging**: Comprehensive tracking of all system actions
- **Access Control**: Role-based permissions with API endpoint protection
- **Input Validation**: Zod schemas for request/response validation
- **Session Security**: Secure cookie configuration with CSRF protection

## Build & Development

The project uses modern development tooling:

- **Development**: Hot module replacement with Vite dev server
- **Production Build**: Separate client and server builds with ESBuild
- **Type Safety**: Comprehensive TypeScript configuration with path mapping
- **Code Quality**: Consistent linting and formatting setup

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **PostgreSQL**: Primary data storage for all application data and sessions

## Authentication Services  
- **Replit OIDC**: OpenID Connect provider for user authentication and identity management
- **OpenID Client**: OAuth 2.0/OIDC implementation for secure authentication flows

## UI & Styling Libraries
- **Radix UI**: Headless UI component primitives for accessible interactions
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for consistent iconography

## Development & Build Tools
- **Vite**: Frontend build tool and development server with React plugin
- **ESBuild**: Fast JavaScript/TypeScript bundler for server-side builds
- **Drizzle Kit**: Database schema management and migration tooling

## Runtime Libraries
- **React Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management with performance optimization
- **Zod**: TypeScript-first schema validation for runtime type safety
- **Date-fns**: Date manipulation and formatting utilities