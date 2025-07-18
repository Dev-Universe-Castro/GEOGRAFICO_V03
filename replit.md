# FertiCore - Brazilian Agricultural Data Analysis System

## Overview

FertiCore is a comprehensive full-stack web application for analyzing and visualizing Brazilian agricultural production data. The system provides interactive maps, data filtering capabilities, and Excel import/export functionality for agricultural production data across Brazilian states and municipalities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Maps**: Leaflet for interactive map visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **File Processing**: Multer for file uploads, XLSX for Excel processing

### Database Strategy
- **ORM**: Drizzle ORM with code-first schema approach
- **Database**: PostgreSQL (configured for Neon serverless)
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Authentication System
- **Provider**: Replit Auth integration with OpenID Connect
- **Session Storage**: PostgreSQL sessions table for persistent login state
- **Authorization**: Route-level protection with middleware
- **User Management**: Automatic user creation/update on login

### Data Models
- **Users**: Authentication and profile information
- **Geographic Data**: States and municipalities with regional classification
- **Agricultural Data**: Crops, production data with hectares and production volumes
- **Company Data**: Agricultural companies with location mapping

### Map Visualization
- **Interactive Maps**: Leaflet-based mapping with municipality-level data
- **Data Layers**: Crop production visualization with color-coded hectare ranges
- **Controls**: Dynamic filtering by crops, states, regions, and years
- **Legend**: Visual representation of data ranges and statistics

### File Processing
- **Excel Import**: Multi-format Excel file processing for agricultural data
- **Data Validation**: Schema validation using Zod
- **Bulk Operations**: Efficient batch insertion of imported data
- **Export**: Excel export functionality for filtered data

## Data Flow

1. **Authentication Flow**: User logs in via Replit Auth → Session created in PostgreSQL → User data stored/updated
2. **Data Loading**: Frontend queries API endpoints → Backend retrieves data via Drizzle ORM → Response cached by TanStack Query
3. **Map Interaction**: User selects filters → API request with parameters → Database query with joins → Map updates with new data
4. **File Import**: Excel file upload → Server-side processing → Data validation → Bulk database insertion → UI feedback

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection management
- **drizzle-orm**: Database ORM and query builder
- **@tanstack/react-query**: Server state management
- **leaflet**: Interactive map library
- **xlsx**: Excel file processing
- **openid-client**: Authentication with Replit

### UI Dependencies
- **@radix-ui/***: Comprehensive UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe CSS class management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development
- **Server**: Node.js with tsx for TypeScript execution
- **Client**: Vite dev server with HMR
- **Database**: Neon PostgreSQL with connection pooling
- **Environment**: Environment variables for database and auth configuration

### Production
- **Build Process**: Vite builds client assets, esbuild bundles server code
- **Deployment**: Single Node.js process serving both API and static files
- **Database**: Production PostgreSQL with connection pooling
- **Assets**: Static files served from Express with Vite-generated bundles

### Configuration
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, REPLIT_DOMAINS, ISSUER_URL
- **Database Schema**: Managed through Drizzle migrations
- **Session Management**: PostgreSQL-backed sessions with configurable TTL