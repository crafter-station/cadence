# AGENTS.md - Cadence

AI agent evaluation and testing platform built with Next.js 16, TypeScript, and Drizzle ORM.

## Build/Lint/Test Commands

```bash
# Development
bun dev                    # Start Next.js dev server

# Build
bun build                  # Production build
bun start                  # Start production server

# Linting
bun lint                   # Run ESLint

# Database
bun db:push               # Push schema changes to database
bun db:studio             # Open Drizzle Studio
bun db:seed               # Seed database with initial data

# Background Jobs (Trigger.dev)
bunx trigger dev          # Run Trigger.dev local dev
bunx trigger deploy       # Deploy Trigger.dev tasks
```

No test framework is currently configured. When adding tests, use Vitest with:
```bash
bun test                  # Run all tests
bun test path/to/file     # Run single test file
bun test -t "test name"   # Run tests matching pattern
```

## Project Structure

```
src/
├── actions/           # Server Actions ("use server" directive)
├── app/               # Next.js App Router
│   ├── (marketing)/   # Marketing pages (public)
│   ├── app/           # Dashboard pages (authenticated)
│   └── api/           # API Routes
├── components/        # React Components
│   └── ui/            # shadcn/ui primitives
├── db/                # Database layer (Drizzle ORM)
│   └── schema/        # Table definitions
├── hooks/             # React Query hooks
├── lib/               # Utilities and shared logic
│   └── ai/            # AI/LLM utilities
├── trigger/           # Trigger.dev background tasks
└── types/             # TypeScript type definitions
```

## Code Style Guidelines

### Imports

Order imports in this sequence with blank lines between groups:
1. External packages (react, next, third-party)
2. Internal aliases (`@/` imports)
3. Relative imports
4. Type-only imports at end of each group

```typescript
// External
import { useState } from "react"
import { NextRequest, NextResponse } from "next/server"
import { eq, desc } from "drizzle-orm"

// Internal aliases
import { db } from "@/db"
import * as schema from "@/db/schema"
import { Button } from "@/components/ui/button"

// Types
import type { EvaluationSelect } from "@/db/schema"
```

### TypeScript

- Enable strict mode (already configured)
- Use explicit types for function parameters and returns
- Use `interface` for object shapes, `type` for unions/intersections
- Export types alongside functions: `export type FnType = typeof fn`
- Use `$inferSelect` and `$inferInsert` for Drizzle table types
- Prefer `??` over `||` for nullish coalescing

```typescript
export interface CreateEvaluationInput {
  userId: string;
  name: string;
  config: EvaluationConfig;
}

export interface CreateEvaluationResult {
  success: boolean;
  evaluationId?: string;
  error?: string;
}

export async function createEvaluation(
  input: CreateEvaluationInput
): Promise<CreateEvaluationResult> {
  // implementation
}
```

### Naming Conventions

- **Files**: kebab-case (`evaluation.actions.ts`, `use-evaluations.ts`)
- **Components**: PascalCase (`EvaluationCreator.tsx` exports `EvaluationCreator`)
- **Functions**: camelCase (`getEvaluationsAction`, `useCreateEvaluation`)
- **Server Actions**: Suffix with `Action` (`createEvaluationAction`)
- **Hooks**: Prefix with `use` (`useEvaluations`, `useCreateEvaluation`)
- **Types/Interfaces**: PascalCase (`EvaluationSelect`, `CreateEvaluationInput`)
- **Constants**: SCREAMING_SNAKE_CASE for true constants, camelCase for config objects

### React Components

- Use `"use client"` directive only when needed (hooks, event handlers, browser APIs)
- Server Components are the default in App Router
- Prefer function declarations over arrow functions for components
- Use shadcn/ui components from `@/components/ui/`
- Style with Tailwind CSS classes via `className`

```typescript
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function EvaluationCreator() {
  const [name, setName] = useState("")
  // ...
}
```

### Server Actions

- Add `"use server"` directive at top of file
- Return typed result objects with `{ success, data?, error? }` pattern
- Handle errors with try/catch, log with `console.error`
- Validate ownership before mutations

```typescript
"use server"

export async function deleteEvaluationAction(
  evaluationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const evaluation = await db.query.evaluation.findFirst({
      where: eq(schema.evaluation.id, evaluationId),
    });

    if (!evaluation) {
      return { success: false, error: "Not found" };
    }
    if (evaluation.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    await db.delete(schema.evaluation).where(eq(schema.evaluation.id, evaluationId));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete evaluation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### React Query Hooks

- Wrap server actions with TanStack Query for caching
- Use `queryKey` arrays with entity type and identifiers
- Implement optimistic updates for mutations
- Use `refetchInterval` for polling active states

```typescript
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function useEvaluation(evaluationId: string | null) {
  return useQuery({
    queryKey: ["evaluation", evaluationId],
    queryFn: () => (evaluationId ? getEvaluationAction(evaluationId) : null),
    enabled: !!evaluationId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === "running" ? 3000 : false;
    },
  });
}
```

### API Routes

- Use Next.js Route Handlers in `app/api/`
- Parse query params with `request.nextUrl.searchParams`
- Return `NextResponse.json()` with appropriate status codes
- Delegate to server actions when possible

### Database (Drizzle ORM)

- Define schemas in `src/db/schema/`
- Use `text("id").primaryKey()` with nanoid for IDs
- Export `$inferSelect` and `$inferInsert` types
- Use relational queries with `db.query.tableName.findMany()`

### Error Handling

- Create custom error classes for domain errors
- Include error codes for programmatic handling
- Log errors with context before returning

```typescript
class EvaluationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "EvaluationError";
  }
}

class EvaluationNotFoundError extends EvaluationError {
  constructor(evaluationId: string) {
    super(`Evaluation ${evaluationId} not found`, "EVALUATION_NOT_FOUND");
  }
}
```

### Trigger.dev Tasks

- Define tasks with `schemaTask` and Zod validation
- Use `logger` from Trigger.dev SDK for logging
- Implement `triggerAndWait` for sequential task chains
- Tag runs with entity IDs for filtering

## Git Commits

- Never add Co-Authored-By lines
- Keep commit messages short and concise
- No emojis in commit messages

## Key Dependencies

- **Framework**: Next.js 16, React 19
- **Database**: PostgreSQL (Neon), Drizzle ORM
- **Auth**: Clerk
- **UI**: shadcn/ui (New York style), Tailwind CSS 4, Radix UI
- **State**: TanStack React Query
- **AI**: Vercel AI SDK, Anthropic, OpenAI
- **Background Jobs**: Trigger.dev
- **IDs**: nanoid
