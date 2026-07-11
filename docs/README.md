# JobMart Documentation

JobMart is a full-featured job board built for a 6-part assignment: **build → GitHub → CI/CD → Vercel deploy → docs → submit**.

| Link | |
| --- | --- |
| 🌐 Live app | https://job-mart-ten.vercel.app |
| 📦 Repository | https://github.com/saisuraj5286/job-mart |
| ✅ CI | GitHub Actions — lint, typecheck, build on every push/PR |

## Contents

- [Features](./features.md) — every user-facing flow, by role
- [Architecture](./architecture.md) — stack, database schema, auth & RBAC, API design
- [Deployment & CI/CD](./deployment.md) — environments, pipeline, how to run locally

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Job seeker | `seeker@jobmart.dev` | `Password123!` |
| Employer | `employer@jobmart.dev` | `Password123!` |

The employer owns **Nimbus Analytics** — it has published jobs, a draft, and a populated applicant pipeline, so every screen has real data the moment you sign in.

## Future scope

Planned enhancements beyond the current release:

- **Match score** — a per-job fit score for each seeker (and per-candidate score for employers) computed from tag/skill overlap, experience level, salary expectations, and location — surfaced as a "92% match" badge on cards and used to rank the applicant pipeline
- **LLM resume generation** — generate or tailor a resume for a specific job posting from the seeker's profile using an LLM, with tone/length controls and one-click attach to the application
- **ATS score** — analyze an uploaded resume against a job description (keyword coverage, section structure, quantified impact) and return a score with concrete improvement suggestions before the seeker applies
- **Semantic search** — embeddings-based job search ("frontend role at a climate startup") alongside the current keyword/filter search
- **Job alerts** — saved searches (the URL-synced filters make these free) with email/notification digests when new matching jobs are published
- **Resume uploads** — object storage for resume files (PDF) replacing external links, with inline preview in the applicant pipeline
- **Interview scheduling** — a pipeline stage with calendar slots so employers can move shortlisted candidates straight to a booked interview
- **Employer analytics** — views → applications conversion per job, source tracking, and time-to-hire metrics on the dashboard

## Two-minute tour

1. Open the [live app](https://job-mart-ten.vercel.app) → search or filter on **/jobs** — note the URL updates with every filter (shareable searches)
2. Sign in as the **seeker** → apply to a job → check **My applications**
3. Sign out, sign in as the **employer** → **Post a job** (try the markdown preview) → publish
4. Open **My job posts → applicants** → move a candidate to *Shortlisted*
5. Sign back in as the seeker — the status badge has changed
