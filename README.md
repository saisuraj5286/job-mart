# JobMart 💼

A modern, full-featured job board where **job seekers** browse, save, and apply to roles, and **employers** post jobs and manage applicants through a hiring pipeline.

Built with the T3 stack: **Next.js 15 (App Router) · TypeScript · tRPC v11 · Drizzle ORM · Supabase Postgres · Tailwind CSS v4 · shadcn/ui**.

## Features

### Public

- **Landing page** — hero search, live stats, popular tag chips, latest openings
- **Job browsing** (`/jobs`) — debounced keyword search; filters for job type, work mode, experience level, location, minimum salary, and tags; sort by newest or salary; **URL-synced filter state** so every search is shareable; cursor-based "Load more" pagination; active-filter pills
- **Job detail** (`/jobs/[slug]`) — markdown-rendered description, salary badge, company card, similar jobs, view counter, per-job SEO metadata, sticky mobile apply bar

### Job seekers

- **One-click apply** — dialog with cover note + resume link, zod-validated, duplicate-application guard
- **My applications** (`/dashboard/applications`) — live status badges (Pending / Reviewed / Shortlisted / Rejected / Hired)
- **Saved jobs** — optimistic bookmark toggle on every job card, listed at `/dashboard/saved`

### Employers

- **Company profile** (`/dashboard/company`) — one-time setup that gates job posting
- **Post & edit jobs** (`/dashboard/jobs/new`) — full form with tag input and **live markdown preview**; save as draft or publish
- **Manage jobs** (`/dashboard/jobs`) — status, applicant count, view count; publish / close / reopen / delete (with confirm)
- **Applicant pipeline** (`/dashboard/jobs/[id]/applicants`) — status filter chips, expandable cover notes, resume links, optimistic status dropdown

### Auth & security

- Session auth built on **Lucia v3** (argon2id password hashing, httpOnly session cookie, sliding expiry)
- **Role-based access control** — `seeker` / `employer` roles enforced at three layers: edge middleware, page guards, and tRPC procedures
- Ownership checks on every employer mutation (you can only touch your own jobs/applicants)

## Demo accounts

The seed script creates ready-to-use accounts:

| Role     | Email                  | Password       |
| -------- | ---------------------- | -------------- |
| Seeker   | `seeker@jobmart.dev`   | `Password123!` |
| Employer | `employer@jobmart.dev` | `Password123!` |

The employer account owns **Nimbus Analytics** with several published jobs and a populated applicant pipeline.

## Getting started

### Prerequisites

- Node.js 20+ and [pnpm](https://pnpm.io)
- A [Supabase](https://supabase.com) project (free tier works) — or any Postgres database

### Setup

```bash
pnpm install
cp .env.example .env   # then fill in your connection strings
```

`.env` needs two connection strings (see `.env.example`):

| Variable       | Purpose                          | Supabase source                                    |
| -------------- | -------------------------------- | -------------------------------------------------- |
| `DATABASE_URL` | runtime queries                  | Transaction pooler (port 6543) for serverless; the direct/session string works for local dev |
| `DIRECT_URL`   | migrations (`drizzle-kit`) only  | Direct connection (port 5432)                      |

Then:

```bash
pnpm db:push   # create the schema
pnpm db:seed   # 10 companies, 30+ realistic jobs, demo accounts
pnpm dev       # http://localhost:3000
```

### Useful scripts

| Command          | What it does                              |
| ---------------- | ----------------------------------------- |
| `pnpm dev`       | dev server (Turbopack)                    |
| `pnpm build`     | production build                          |
| `pnpm check`     | ESLint + TypeScript (the CI gate)         |
| `pnpm db:push`   | push Drizzle schema to the database       |
| `pnpm db:seed`   | wipe & reseed demo data                   |
| `pnpm db:studio` | browse the database in Drizzle Studio     |

## Architecture notes

- **tRPC routers** (`src/server/api/routers/`): `auth`, `job`, `application`, `savedJob`, `company` — with `publicProcedure`, `protectedProcedure`, and role-scoped `seekerProcedure` / `employerProcedure`
- **Auth** (`src/server/auth/`): Lucia v3 + Drizzle adapter, server actions for signup/login/logout, request-cached `validateRequest()`
- **Schema** (`src/server/db/schema.ts`): users, sessions, companies, jobs, applications (unique per job+seeker), saved_jobs — all tables prefixed `job-mart_`
- **Job search**: keyset cursor pagination with stable totals; drafts and closed jobs never leak into public queries

## Try the full loop

1. Browse `/jobs`, filter by tags/salary — notice the URL updates; share it
2. Sign in as the **seeker** → apply to a job → see it in *My applications*
3. Sign in as the **employer** → post a job with markdown preview → publish
4. Open the job's **applicants** pipeline → shortlist someone
5. Back as the seeker — the status badge updated
