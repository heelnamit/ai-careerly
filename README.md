# AI Career Agent

Your personal AI-powered job discovery and career assistant.

## V1 goal

V1 focuses on:

- Candidate profile
- Job ingestion
- Job normalization
- Duplicate detection
- Job matching
- Match scoring
- AI reasoning
- Ranked job dashboard

Application automation is intentionally **not** part of the first milestone.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma
- Supabase PostgreSQL
- Zod
- Apify (next milestone)
- OpenAI API (next milestone)
- pnpm

## Prerequisites

Install:

- Node.js 20.9+
- pnpm 10+

Check:

```bash
node -v
pnpm -v
```

If pnpm is not installed:

```bash
corepack enable
corepack prepare pnpm@10.17.1 --activate
```

## Run locally

```bash
pnpm install
```

Create the environment file:

```bash
cp .env.example .env
```

For the current starter UI, you can leave the API keys blank.

Start the development server:

```bash
pnpm dev
```

Open:

http://localhost:3000

Health check:

http://localhost:3000/api/health

## Supabase + Prisma

Create a Supabase project and copy its PostgreSQL connection string into:

```env
DATABASE_URL="..."
```

Then run:

```bash
pnpm prisma generate
pnpm prisma migrate dev --name init
```

The Prisma schema currently contains:

- CandidateProfile
- Job
- JobMatch
- AgentRun

## Project structure

```text
app/
  api/
    agent/
    health/
  dashboard/
  page.tsx

lib/
  agent/
    career-agent.ts
    job-discovery.ts
    job-matching.ts
    job-ranking.ts
  db/
    prisma.ts
  validation/

prisma/
  schema.prisma
```

## Development roadmap

### V1.1
Candidate profile + database seed

### V1.2
Apify job ingestion

### V1.3
Job normalization + deduplication

### V1.4
Deterministic matching engine

### V1.5
LLM semantic matching

### V1.6
Dashboard + filtering + ranking

### V1.7
Daily agent run + notifications

## Important automation principle

LinkedIn/Naukri account actions should only be automated where permitted by the relevant platform's current terms and available APIs/interfaces. The project is designed around job intelligence first and human approval for consequential application actions.
# ai-careerly
