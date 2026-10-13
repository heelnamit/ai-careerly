# AI Career Agent

A private job-discovery workspace with LinkedIn job search, saved job results,
and a candidate profile.

## What works today

- Shared-password dashboard login with a signed, HTTP-only session cookie.
- Candidate profile creation, editing, and display on the overview page.
- LinkedIn job discovery through the configured Apify actor.
- Up to five keyword/location searches per request, with posting-date and
  per-search result-limit options.
- Job normalization, URL-based deduplication, and persistence to PostgreSQL.
- Overview and dashboard counts for saved jobs, matches, shortlist, and
  applications.
- Job cards linking to the original LinkedIn posting.

Profile-based job scoring, AI matching, shortlist/application management
actions, scheduled searches, and application automation are not implemented
yet. The related counters show database state and may remain zero until those
workflows are built.

## Stack

- Next.js, React, and TypeScript
- Tailwind CSS
- Prisma and PostgreSQL (Supabase supported)
- Zod
- Apify
- pnpm

## Prerequisites

- Node.js 20.9+
- pnpm 10+
- A PostgreSQL database
- An Apify account and LinkedIn jobs actor, for job search

Check your local versions:

```bash
node -v
pnpm -v
```

If pnpm is not installed:

```bash
corepack enable
corepack prepare pnpm@10.17.1 --activate
```

## Local setup

Install dependencies and create your environment file:

```bash
pnpm install
cp .env.example .env
```

Set these values in `.env`:

| Variable | Required for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Dashboard data and profiles | PostgreSQL connection string. |
| `DASHBOARD_PASSWORD` | Dashboard login | Use at least 16 characters. |
| `DASHBOARD_SESSION_SECRET` | Dashboard login | Use a random secret of at least 32 characters. |
| `APIFY_API_TOKEN` | LinkedIn searches | Keep server-side; never prefix with `NEXT_PUBLIC_`. |
| `APIFY_LINKEDIN_ACTOR_ID` | LinkedIn searches | Actor ID used to collect LinkedIn jobs. |
| `INTERNAL_API_KEY` | Optional server-to-server API access | Keep private. Browser dashboard requests use the session cookie instead. |
| `OPENAI_API_KEY` | Future AI features | Not currently used by the implemented search or matching flow. |

For example, generate a session secret with:

```bash
openssl rand -hex 32
```

Do not commit `.env` or expose passwords, tokens, or session secrets in
client-side variables. After changing environment values, restart the
development server.

## Database

The Prisma schema includes `CandidateProfile`, `Job`, `JobMatch`, and
`AgentRun`. After setting `DATABASE_URL`, generate the Prisma client and apply
the existing migrations:

```bash
pnpm prisma generate
pnpm prisma migrate dev
```

## Run and validate

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The overview, dashboard,
and profile redirect to `/login` until you sign in with `DASHBOARD_PASSWORD`.

Other useful commands:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## Using the dashboard

1. Sign in at `/login`.
2. Create or update your candidate profile at `/profile`.
3. Open `/dashboard` and add one or more job-title/keyword and location
   searches. You can add up to five searches, choose a posting window, and set
   a result limit of up to 50 jobs per search.
4. Select **Find jobs**. Apify runs server-side and may take a few minutes.
   Successful results are deduplicated and saved; the overview metrics and job
   list use the persisted database records.

An individual search can fail while other searches succeed. The dashboard
reports per-search failures separately. Searching may use Apify resources and
incur charges according to your Apify account and actor.

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/dashboard/login` | `POST` | Verify the shared dashboard password and create a session. |
| `/api/dashboard/logout` | `POST` | Clear the dashboard session. |
| `/api/candidate-profile` | `GET`, `POST`, `PUT` | Read or save the candidate profile (dashboard session required). |
| `/api/jobs/search` | `POST` | Search LinkedIn using Apify and optionally persist results. Requires a dashboard session or `x-api-key` matching `INTERNAL_API_KEY`. |
| `/api/jobs` | `GET` | Return saved jobs and job activity counts. Requires a dashboard session or `INTERNAL_API_KEY`. |
| `/api/jobs/import` | `POST` | Import jobs. Requires a dashboard session or `INTERNAL_API_KEY`. |
| `/api/agent` | `POST` | Career-agent endpoint foundation. Requires a dashboard session or `INTERNAL_API_KEY`; orchestration is still a stub. |
| `/api/health` | `GET` | Health check. |

Example search request body:

```json
{
  "searches": [
    {
      "keywords": "Product Designer",
      "location": "Bengaluru",
      "datePosted": "pastWeek"
    },
    {
      "keywords": "UX Designer",
      "location": "Remote",
      "datePosted": "past24Hours"
    }
  ],
  "maxItemsPerSearch": 10,
  "save": true
}
```

The dashboard sends its session cookie automatically. For trusted
server-to-server requests, send `x-api-key` with the configured
`INTERNAL_API_KEY`; do not put that key in browser code.

## Project structure

```text
app/
  api/
    candidate-profile/
    dashboard/
    health/
    jobs/
  dashboard/
  login/
  profile/
  page.tsx

lib/
  agent/
  auth/
  db/
  job-sources/
  jobs/
  validation/

prisma/
  migrations/
  schema.prisma
```

## Security and product notes

Dashboard access currently uses one shared password, not individual user
accounts. Login throttling is in-memory and intended for a single app instance;
use a shared rate limiter and proper identity provider before running multiple
instances or opening access to many users. Keep the app and its secrets private.

LinkedIn/Naukri account actions should only be automated where permitted by the
relevant platform's current terms and available APIs/interfaces. The project
focuses on job discovery first and human approval for consequential application
actions.
