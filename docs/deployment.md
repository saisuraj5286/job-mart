# Deployment & CI/CD

## Environments

| | Where | Database connection |
| --- | --- | --- |
| Production | **Vercel** — https://job-mart-ten.vercel.app | Supabase **transaction pooler** (port 6543) |
| Preview | Vercel — automatic per branch/PR | same pooler |
| Local dev | `pnpm dev` | direct/session connection works fine |

### Environment variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | app runtime | On Vercel this **must** be the transaction pooler string — serverless functions would exhaust direct connections. The postgres client runs with `prepare: false` because the transaction pooler doesn't support prepared statements. |
| `DIRECT_URL` | `drizzle-kit` only | Direct (non-pooled) connection for `db:push` / migrations. Optional in production builds. |

## CI — GitHub Actions

`.github/workflows/ci.yml` runs on every push to `main`/`jobs` and on PRs to `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint` (ESLint)
3. `pnpm typecheck` (`tsc --noEmit`)
4. `pnpm build` (production Next.js build)

CI runs with `SKIP_ENV_VALIDATION=1` and **no database** — every route is server-rendered on demand, so the build never needs a live connection.

## CD — Vercel Git integration

Deployment is handled by Vercel's GitHub integration rather than a custom action:

- **Push to `main`** → production deploy
- **Push to any branch / open a PR** → preview deploy with its own URL

The workflow during development: features are committed to the `jobs` branch (one commit per feature, verified before pushing), and `jobs` is fast-forward merged into `main` at stable milestones — so `main` is always deployable and every merge ships.

## Running locally

```bash
pnpm install
cp .env.example .env        # add your Supabase connection strings
pnpm db:push                # create schema
pnpm db:seed                # demo data + accounts
pnpm dev                    # http://localhost:3000
```

The seed is idempotent (wipe + reinsert): 10 companies, 30+ jobs, 8 users, applications in every pipeline status, and saved jobs — so every screen has data immediately.

## Database operations

| Command | What it does |
| --- | --- |
| `pnpm db:push` | sync `src/server/db/schema.ts` to the database (uses `DIRECT_URL`) |
| `pnpm db:seed` | wipe & reseed demo data |
| `pnpm db:studio` | Drizzle Studio — browse tables in the browser |
