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

## Two-minute tour

1. Open the [live app](https://job-mart-ten.vercel.app) → search or filter on **/jobs** — note the URL updates with every filter (shareable searches)
2. Sign in as the **seeker** → apply to a job → check **My applications**
3. Sign out, sign in as the **employer** → **Post a job** (try the markdown preview) → publish
4. Open **My job posts → applicants** → move a candidate to *Shortlisted*
5. Sign back in as the seeker — the status badge has changed
