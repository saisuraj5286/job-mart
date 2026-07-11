# Architecture

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 15** (App Router, React 19) | Server components for fast public pages, server actions for auth |
| Language | **TypeScript** end to end | One type system from DB row to UI prop |
| API | **tRPC v11** + TanStack Query | Typesafe procedures, no codegen; infinite queries for pagination |
| Database | **Supabase Postgres** + **Drizzle ORM** | Relational fit (users→companies→jobs→applications); typed schema in code |
| Auth | **Lucia v3** + `@node-rs/argon2` | Session cookies over JWT for instant revocation; argon2id hashing |
| UI | **Tailwind CSS v4** + **shadcn/ui** | Accessible primitives, consistent theming, dark mode |
| Forms | react-hook-form + zod | Same zod schema validates client-side and server-side |

## Database schema

Six tables, all prefixed `job-mart_` (Drizzle multi-project pattern):

```
users ──1:1── companies (ownerId unique)
  │              │
  │              └──1:N── jobs
  │                         │
  ├──1:N── sessions         │
  ├──1:N── applications ────┘   unique(jobId, seekerId)
  └──1:N── saved_jobs ──────┘   PK(userId, jobId)
```

- `users.role` — enum `seeker | employer`, set at sign-up, drives all RBAC
- `jobs` — enums for type/work-mode/status, `tags text[]`, salary range, view counter, unique slug
- `applications` — status enum (`pending → reviewed → shortlisted → rejected/hired`); the **unique(jobId, seekerId)** constraint is the last line of the duplicate-application guard
- Indexes on the hot paths: `jobs(status, createdAt)` for the public board, FK indexes for dashboards

## Auth & RBAC

Session auth follows the Lucia v3 pattern:

1. Sign-up/sign-in are **server actions** (CSRF-safe by construction); passwords hashed with **argon2id**
2. A 40-char session ID is stored in an `httpOnly` cookie and in the `sessions` table with sliding expiry
3. `validateRequest()` — cached per request — resolves the cookie to `{ user, session }` and is shared by pages, server actions, and the tRPC context

Authorization is enforced at **three layers**:

| Layer | Mechanism | Purpose |
| --- | --- | --- |
| Edge middleware | cookie presence check on `/dashboard/*` | fast redirect, no DB on the edge |
| Page guards | `requireRole("seeker" \| "employer")` | role-correct redirects for whole pages |
| tRPC procedures | `protectedProcedure`, `seekerProcedure`, `employerProcedure` | the real enforcement, per operation |

On top of role checks, every employer mutation verifies **ownership** by joining through `job → company → ownerId` — an employer can only touch their own jobs and applicants (foreign IDs return `NOT_FOUND`, never leak existence).

## API design (tRPC routers)

| Router | Procedures |
| --- | --- |
| `auth` | `me` |
| `job` | public: `list`, `bySlug`, `similar`, `stats`, `popularTags` · employer: `myJobs`, `byIdForEmployer`, `create`, `update`, `setStatus`, `delete` |
| `application` | seeker: `submit`, `myApplications`, `statusForJob` · employer: `byJob`, `updateStatus` |
| `savedJob` | `toggle`, `ids`, `list` |
| `company` | `mine`, `upsert` |

Notable details:

- **Search & filters** — `job.list` composes SQL conditions dynamically (ILIKE keyword across title/company/tags, enum `IN` lists, array-overlap for tags, salary threshold via `COALESCE`)
- **Keyset pagination** — the cursor is `(sortValue, id)`; a tuple comparison (`(createdAt, id) < ($1, $2)`) gives stable pages with no offset drift; the total count deliberately ignores the cursor so "N jobs found" doesn't change while paging
- **Optimistic updates** — saved-job toggle and applicant status changes update the TanStack Query cache in `onMutate` and roll back on error
- (Fun fact: the apply mutation is named `submit` because `apply` is a reserved word in tRPC routers — it collides with `Function.prototype.apply`)

## Rendering strategy

- Public pages are **server components**; `/jobs` server-prefetches the first page and hydrates the client for interactive filtering
- All routes are dynamic (`ƒ`) — content is DB-backed and session-aware
- The jobs board syncs filter state to the URL with `router.replace`, so the URL is the single source of truth for the search UI
