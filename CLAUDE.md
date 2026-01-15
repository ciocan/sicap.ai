# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SICAP.ai is a search engine for Romanian public procurement data (from e-licitatie.ro). It's a TypeScript monorepo using pnpm workspaces and Turborepo.

## Commands

```bash
# Development
pnpm dev              # Start dev server (port 3042)
pnpm db:dev           # Start local Turso DB server

# Build & Production
pnpm build            # Build all packages
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run Biome linter
pnpm fmt              # Format code with Biome
pnpm typecheck        # TypeScript type checking

# Database
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Apply migrations
pnpm db:studio        # Open Drizzle Studio GUI

# UI Components
pnpm ui:add <name>    # Add Shadcn component (e.g., pnpm ui:add button)

# Other
pnpm sitemap          # Generate sitemap
pnpm mastra:dev       # Run Mastra AI agent dev server
pnpm clean            # Clean all build artifacts and node_modules
```

## Architecture

### Monorepo Structure

- `apps/web/` - Next.js 16 application (main app)
- `packages/api/` - Elasticsearch queries and API logic
- `packages/ui/` - Shared Shadcn UI components
- `packages/data/` - Data models and utilities
- `internal/tailwind-config/` - Shared Tailwind configuration
- `internal/tsconfig/` - Shared TypeScript configurations

### Key Technologies

- **Framework**: Next.js 16 with React 19, App Router, React Server Components
- **Database**: Turso (distributed SQLite) with Drizzle ORM
- **Search**: Elasticsearch 8.x
- **Auth**: NextAuth.js v5 with Google OAuth
- **AI**: Mastra framework with OpenAI GPT-4o-mini
- **Styling**: Tailwind CSS + Shadcn UI (Radix primitives)
- **Linting**: Biome (100 char line width)

### Elasticsearch Indices

The app queries four indices via `packages/api/src/es/`:
- `sicap-public` - Public tenders (licitatii)
- `sicap-direct` - Direct acquisitions (achizitii directe)
- `sicap-offline` - Offline acquisitions
- `sicap-search` - Search index

### Main Routes

- `/licitatii/*` - Public tenders
- `/achizitii/*` - Direct acquisitions
- `/achizitii-offline/*` - Offline acquisitions
- `/cauta` - Search results
- `/firma/[nationalId]` - Company detail
- `/autoritate/[nationalId]` - Authority detail
- `/(embed)/embed` - Embeddable widget

### Database Schema

Located in `apps/web/src/db/schema.ts`. Tables: `users`, `accounts`, `sessions`, `verificationTokens`, `authenticators` (NextAuth).

### API Package Pattern

Elasticsearch queries in `packages/api/src/`:
- `search-contracts.ts` - Multi-field search with filters
- `get-contract.ts` - Contract details (public/direct/offline variants)
- `get-company.ts` - Company aggregations
- `get-authority.ts` - Authority queries
- `get-total.ts` - Index totals

### Environment Variables

Required in `.env`:
- `ES_URL`, `ES_API_KEY` - Elasticsearch connection
- `DATABASE_URL`, `DATABASE_AUTH_TOKEN` - Turso database
- `NEXTAUTH_URL`, `AUTH_SECRET` - Auth configuration
- `OG_SECRET` - OG image generation

## Code Conventions

- Language: Romanian for UI text, English for code/comments
- Main branch: `v2`
- Use `"use client"` directive only for interactive components
- Server Components are the default in Next.js 16
- Biome handles linting and formatting
- **After making code changes, always run:**
  ```bash
  pnpm lint      # Check for lint errors and warnings
  pnpm fmt       # Format code according to Biome rules
  pnpm typecheck # Verify TypeScript types
  ```
