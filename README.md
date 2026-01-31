# Cadence

Large-scale testing infrastructure for AI agents and LLM-powered systems.

## Overview

Cadence is an AI agent evaluation platform that enables teams to run thousands of parallel test sessions against their conversational AI systems. Test with synthetic personas, optimize prompts automatically, and track business metrics—all before your users find the edge cases.

## Features

- **Synthetic Personas** — Test against 6 distinct user archetypes, from frustrated executives to confused elderly users
- **Parallel Execution** — Run thousands of concurrent test sessions with configurable concurrency controls
- **Self-Healing Prompts** — AI analyzes failures and suggests prompt improvements with confidence scores
- **A/B Testing** — Compare prompt versions with statistical significance and automatic winner detection
- **Business Metrics** — Track resolution rates, CSAT scores, handle time, and cost per interaction
- **Scenario Builder** — Create scripted conversation flows with assertions and validation rules

## Tech Stack

- **Framework**: Next.js 16, React 19
- **Database**: PostgreSQL (Neon), Drizzle ORM
- **Auth**: Clerk
- **UI**: shadcn/ui (New York style), Tailwind CSS 4, Radix UI
- **State**: TanStack React Query
- **AI**: Vercel AI SDK, Anthropic, OpenAI
- **Background Jobs**: Trigger.dev
- **Runtime**: Bun

## Getting Started

### Prerequisites

- Node.js 20+
- Bun
- PostgreSQL database (or Neon account)
- Clerk account for authentication
- Trigger.dev account for background jobs

### Installation

```bash
# Clone the repository
git clone https://github.com/crafter-station/cadence.git
cd cadence

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Push database schema
bun db:push

# Seed initial data (optional)
bun db:seed

# Start development server
bun dev
```

### Environment Variables

Required environment variables:

- `DATABASE_URL` — PostgreSQL connection string
- `CLERK_SECRET_KEY` — Clerk authentication secret
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk public key
- `TRIGGER_SECRET_KEY` — Trigger.dev API key
- `OPENAI_API_KEY` — OpenAI API key
- `ANTHROPIC_API_KEY` — Anthropic API key

## Project Structure

```
src/
├── actions/       # Server Actions
├── app/           # Next.js App Router pages
├── components/    # React components
├── db/            # Drizzle ORM schema and client
├── hooks/         # React Query hooks
├── lib/           # Utilities and AI helpers
├── trigger/       # Background job tasks
└── types/         # TypeScript definitions
```

See [AGENTS.md](./AGENTS.md) for detailed code style guidelines.

## Development

```bash
bun dev           # Start dev server
bun build         # Production build
bun lint          # Run ESLint
bun db:studio     # Open Drizzle Studio
bunx trigger dev  # Run Trigger.dev locally
```

## License

MIT
