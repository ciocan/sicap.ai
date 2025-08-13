# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SICAP.ai is a Romanian public procurement search engine with an AI assistant. It's a monorepo using Turbo.build and pnpm workspaces.

## Development Commands

### Essential Commands
```bash
# Install dependencies
pnpm install

# Development
pnpm dev           # Start all apps in development mode
pnpm dev:web       # Start web app only (port 3042)
pnpm dev:agent     # Start AI agent only (port 4242)

# Build & Production
pnpm build         # Build all apps
pnpm start         # Start in production mode

# Code Quality
pnpm lint          # Run ESLint
pnpm fmt           # Format code with Prettier
pnpm typecheck     # Type checking across all packages

# Database
pnpm db:generate   # Generate Drizzle migrations
pnpm db:migrate    # Run migrations
pnpm db:push       # Push schema to database
pnpm db:studio     # Open Drizzle Studio

# AI Agent
pnpm mastra:dev    # Start Mastra development server
pnpm mastra:build  # Build Mastra agent
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API routes, Hono service framework
- **Database**: Turso (LibSQL) with Drizzle ORM
- **Search**: Elasticsearch for contract search
- **AI**: Mastra framework with OpenAI GPT-5-nano
- **Auth**: NextAuth v5

### Project Structure
```
apps/
├── web/               # Main Next.js application (port 3042)
│   ├── app/          # App Router pages and API routes
│   ├── components/   # React components
│   ├── lib/         # Utilities, database, auth
│   └── drizzle/     # Database schema and migrations
├── agent/            # Mastra AI agent (port 4242)
│   ├── src/mastra/  # Agent configuration and tools
│   └── memory/      # Agent memory storage
packages/
├── api/             # Shared Elasticsearch utilities
└── ui/              # Shared shadcn/ui components
internal/            # Shared configs (TypeScript, Tailwind)
```

### Key Architectural Patterns

1. **Search Architecture**: Elasticsearch-powered search with Romanian language support. Main search logic in `apps/web/app/api/search/route.ts`.

2. **AI Agent**: Mastra-based agent (`apps/agent/src/mastra/agents/sicapAgent.ts`) specialized for Romanian procurement queries with memory persistence and OpenAI integration.

3. **Database Schema**: Drizzle ORM with LibSQL. Schema in `apps/web/drizzle/schema.ts`. User threads and authentication managed through NextAuth.

4. **Component Library**: shadcn/ui components in `packages/ui/` with Radix primitives. Custom components follow the pattern in `apps/web/components/`.

5. **API Routes**: Next.js API routes in `apps/web/app/api/`. Hono service framework for structured APIs.

### Romanian Language Context

This project is specifically designed for Romanian public procurement (SICAP). The AI agent and UI are optimized for Romanian language interactions. Contract data comes from data.gov.ro.

## Development Guidelines

### When modifying the web app:
- Components go in `apps/web/components/`
- Use existing shadcn/ui patterns from `packages/ui/`
- Database changes require running `pnpm db:generate` then `pnpm db:migrate`
- API routes follow Next.js App Router patterns

### When working with the AI agent:
- Agent logic is in `apps/agent/src/mastra/agents/sicapAgent.ts`
- Tools are defined in `apps/agent/src/mastra/tools/`
- Memory persists in `apps/agent/memory/`
- Use `pnpm mastra:dev` for testing changes

### Environment Variables
- `.env` files are used for configuration
- Database URL uses Turso (LibSQL)
- OpenAI API key required for AI features
- NextAuth configuration for authentication