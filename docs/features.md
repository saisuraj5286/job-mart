# Features

JobMart has three kinds of users: **visitors**, **job seekers**, and **employers**. Each role sees a different navigation, dashboard, and set of permissions.

## Visitor (no account)

### Landing page `/`
- Hero search that submits straight into the jobs board
- Live stats (open roles, companies) pulled from the database
- Popular tag chips — one click pre-filters the board
- Latest openings grid and role-specific sign-up CTAs

### Job browsing `/jobs`
The centerpiece of the app:

- **Keyword search** across title, company name, and tags (debounced as you type)
- **Filters**: job type (full-time / part-time / contract / internship), work mode (remote / hybrid / on-site), experience level (entry / mid / senior / lead), location text match, minimum annual salary, and tags
- **Sort**: newest first, or salary high → low
- **URL-synced state** — every filter/search/sort choice is reflected in the query string, so any search can be bookmarked or shared; opening a shared link restores the exact view
- **Cursor-based pagination** — "Load more" uses keyset cursors (no duplicate or skipped rows even while new jobs are posted); the result count stays stable across pages
- Active-filter pills with one-click removal and a clear-all
- Skeleton loaders and a designed "no results" empty state with a clear-filters CTA

### Job detail `/jobs/[slug]`
- Markdown-rendered description (headings, lists, links)
- Salary badge — INR renders in lakhs/crores ("₹35L – ₹50L", "₹1.2Cr"); other currencies use "k" notation — plus type, work mode, experience level, and tags
- Company card with website link and about text
- Similar jobs (shared tags or same company)
- View counter, posted-x-ago, per-job SEO metadata (`<title>`, description)
- Sticky apply bar on mobile
- Visitors who hit **Apply** or the bookmark are sent to sign-in and returned to the same job afterwards

### Auth
- Sign-up with a **role picker** — "Find work" (seeker) vs "Hire talent" (employer)
- Sign-in with redirect-back support (`?redirectTo=`)
- Consistent "Incorrect email or password" message so valid emails can't be enumerated

## Job seeker

### Apply flow
- **Apply dialog** on every job page: cover note (20–2000 chars with live counter) + resume URL, validated inline with zod
- **Duplicate-application guard** — enforced in the UI, the API, and a database unique constraint
- Success and error toasts; the button flips to a disabled "Applied" state

### My applications `/dashboard/applications`
- Table of every application: job (linked), company, applied date, and a **live status badge** — Pending / Reviewed / Shortlisted / Rejected / Hired
- Statuses update as the employer moves candidates through their pipeline
- Jobs that were closed after applying are labeled "(no longer open)"

### Saved jobs
- Bookmark toggle on every job card — **optimistic** (instant visual feedback, rolls back on error)
- `/dashboard/saved` lists everything bookmarked; un-saving removes it live

## Employer

### Company profile `/dashboard/company`
- One-time setup (name, website, location, logo URL, about) that **gates job posting** — the post-a-job page redirects here until it exists
- Editable any time; shown on every job the company posts

### Post a job `/dashboard/jobs/new`
- Full form: title, type, work mode, experience level, location, salary range + currency (INR default), up to 8 tags (Enter/comma to add)
- **Markdown editor with live preview tab** for the description
- **Save as draft** or **publish immediately**; drafts are invisible to the public
- Slugs are generated automatically and de-duplicated

### Manage jobs `/dashboard/jobs`
- Table of all posts with status badge (Draft / Published / Closed), **applicant count**, **view count**, and posted date
- Row actions: edit, view public page, publish / close / reopen, and delete with a confirmation dialog that warns about attached applications

### Applicant pipeline `/dashboard/jobs/[id]/applicants`
- Every applicant with name, email, applied date, expandable cover note, and a resume link
- **Status dropdown** per candidate: Pending → Reviewed → Shortlisted → Rejected / Hired — optimistic update, instantly reflected on the seeker's dashboard
- Clickable status summary chips filter the list (e.g. show only Shortlisted)

## UX details

- **Dark / light mode** with a header toggle (system-aware default)
- Toast notifications on every mutation (sonner)
- Skeleton loaders on all async views; designed empty states with CTAs everywhere
- Role-aware header: seekers see *My applications*, employers see *My job posts*, everyone gets an avatar menu
- Mobile-first responsive: filter sheet on small screens, sticky apply bar, collapsing table columns
