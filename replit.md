# SecureVault - Secrets Manager Dashboard

## Overview

SecureVault is a secure secrets manager dashboard built with React and Express.js that allows users to store, organize, and manage API secrets and credentials. The application features a clean, responsive interface with project-based organization, search functionality, and robust security measures including AES-256 encryption for sensitive data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with TypeScript support

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth using OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with proper error handling
- **Security**: AES-256-GCM encryption for sensitive secret values

### Database Schema
- **Users**: Stores user profiles from Replit Auth (id, email, names, profile image)
- **Projects**: Containers for organizing secrets with platform categorization
- **Secrets**: Encrypted storage for API keys, tokens, and credentials with metadata
- **Sessions**: PostgreSQL-backed session storage for authentication

### Security Measures
- **Encryption**: All secret values encrypted using AES-256-GCM before database storage
- **Authentication**: Replit Auth integration with secure session management
- **Authorization**: User-scoped data access with proper ownership validation
- **HTTPS**: Secure transport with proper cookie settings
- **Input Validation**: Zod schemas for all API inputs and form validation

### Core Features
- **Project Management**: Create, edit, and delete projects with platform categorization
- **Secret Storage**: Support for multiple secret types (API keys, client secrets, tokens)
- **Search & Filter**: Full-text search across projects and secrets with platform filtering
- **Clipboard Integration**: One-click copy functionality for secret values
- **Responsive Design**: Mobile-first design with adaptive layouts
- **Dashboard Analytics**: Statistics showing total projects, secrets, and platforms

## External Dependencies

### Database & Storage
- **@neondatabase/serverless**: PostgreSQL database connection via Neon
- **drizzle-orm**: Type-safe ORM for database operations
- **connect-pg-simple**: PostgreSQL session store for Express

### Authentication
- **openid-client**: OpenID Connect implementation for Replit Auth
- **passport**: Authentication middleware with OpenID strategy

### UI & Frontend
- **@radix-ui/***: Accessible component primitives for UI elements
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing for React
- **react-hook-form**: Form state management with validation
- **@hookform/resolvers**: Zod integration for form validation

### Development Tools
- **vite**: Build tool and development server
- **tailwindcss**: Utility-first CSS framework
- **typescript**: Type safety across the application
- **zod**: Runtime type validation for forms and API
- **drizzle-kit**: Database migrations and schema management

### Security & Utilities
- **crypto**: Node.js crypto module for AES encryption
- **date-fns**: Date formatting and manipulation
- **class-variance-authority**: Type-safe CSS class variants
- **clsx**: Conditional CSS class composition