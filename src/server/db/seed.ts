/**
 * Seed script — wipes and repopulates all job-mart tables with demo data.
 *
 * Run with: pnpm db:seed
 *
 * Demo accounts (documented in README):
 *   seeker:   seeker@jobmart.dev   / Password123!
 *   employer: employer@jobmart.dev / Password123!
 */
import { hash } from "@node-rs/argon2";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import {
  applications,
  companies,
  jobs,
  savedJobs,
  sessions,
  users,
} from "./schema";

const DEMO_PASSWORD = "Password123!";

const conn = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const db = drizzle(conn, { schema });

const slugify = (title: string, company: string) =>
  `${title}-at-${company}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

interface CompanySeed {
  name: string;
  website: string;
  location: string;
  about: string;
}

const companySeeds: CompanySeed[] = [
  {
    name: "Nimbus Analytics",
    website: "https://nimbusanalytics.example.com",
    location: "San Francisco, CA",
    about:
      "Nimbus builds a real-time analytics platform that helps product teams understand user behavior without writing SQL. Series B, ~120 people, remote-friendly.",
  },
  {
    name: "Forgeline Robotics",
    website: "https://forgeline.example.com",
    location: "Boston, MA",
    about:
      "We design and manufacture collaborative robot arms for small factories. Hardware meets software — our stack runs from firmware to fleet dashboards.",
  },
  {
    name: "Verdant Health",
    website: "https://verdanthealth.example.com",
    location: "Austin, TX",
    about:
      "Verdant is a telehealth platform focused on preventive care. HIPAA-compliant infrastructure, 2M+ patients served, mission-driven team.",
  },
  {
    name: "Lumen Ledger",
    website: "https://lumenledger.example.com",
    location: "New York, NY",
    about:
      "Modern accounting software for startups. We automate bookkeeping with ML and give founders real-time financial visibility.",
  },
  {
    name: "Atlas Freight",
    website: "https://atlasfreight.example.com",
    location: "Chicago, IL",
    about:
      "Atlas is digitizing freight brokerage. Our marketplace matches shippers with carriers and our TMS keeps loads moving 24/7.",
  },
  {
    name: "Pixelbloom Studio",
    website: "https://pixelbloom.example.com",
    location: "Los Angeles, CA",
    about:
      "A creative technology studio crafting interactive experiences, marketing sites, and design systems for consumer brands.",
  },
  {
    name: "Quanta Cloud",
    website: "https://quantacloud.example.com",
    location: "Seattle, WA",
    about:
      "Managed Kubernetes and developer platform tooling for mid-market engineering orgs. We obsess over developer experience and reliability.",
  },
  {
    name: "Harbor Fintech",
    website: "https://harborfintech.example.com",
    location: "Charlotte, NC",
    about:
      "Harbor provides embedded banking APIs — accounts, cards, and payments — that let any product become a fintech product.",
  },
  {
    name: "Solstice Games",
    website: "https://solsticegames.example.com",
    location: "Montreal, QC",
    about:
      "Independent game studio behind two award-winning indie titles. Small teams, big creative ownership, shipped on PC and console.",
  },
  {
    name: "Meridian EdTech",
    website: "https://meridianedtech.example.com",
    location: "Denver, CO",
    about:
      "Meridian builds adaptive learning tools used in 3,000+ schools. We blend learning science with delightful software.",
  },
];

interface JobSeed {
  company: string; // company name
  title: string;
  type: (typeof schema.jobTypeEnum.enumValues)[number];
  workMode: (typeof schema.workModeEnum.enumValues)[number];
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  tags: string[];
  postedDaysAgo: number;
  views: number;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave?: string[];
}

const jobSeeds: JobSeed[] = [
  {
    company: "Nimbus Analytics",
    title: "Senior Frontend Engineer",
    type: "full_time",
    workMode: "remote",
    location: "Remote (US)",
    salaryMin: 150000,
    salaryMax: 190000,
    tags: ["react", "typescript", "data-viz", "nextjs"],
    postedDaysAgo: 2,
    views: 342,
    summary:
      "Own the dashboarding experience used by thousands of product teams every day. You'll work on high-density data visualization, real-time updates, and a design system used across the product.",
    responsibilities: [
      "Build and maintain our React + TypeScript dashboard application",
      "Design performant rendering for charts with millions of data points",
      "Collaborate with design on our component library and design tokens",
      "Mentor mid-level engineers through code review and pairing",
    ],
    requirements: [
      "5+ years building production web applications",
      "Deep React and TypeScript expertise",
      "Experience with data visualization (D3, canvas, or WebGL)",
      "Strong instincts for performance profiling and optimization",
    ],
    niceToHave: ["Next.js App Router experience", "Design systems background"],
  },
  {
    company: "Nimbus Analytics",
    title: "Data Platform Engineer",
    type: "full_time",
    workMode: "hybrid",
    location: "San Francisco, CA",
    salaryMin: 165000,
    salaryMax: 210000,
    tags: ["python", "kafka", "clickhouse", "aws"],
    postedDaysAgo: 6,
    views: 187,
    summary:
      "Scale the ingestion pipeline that processes 40B+ events a month. You'll own our Kafka → ClickHouse pipeline end to end.",
    responsibilities: [
      "Design and operate high-throughput streaming infrastructure",
      "Optimize ClickHouse schemas and query performance",
      "Build self-serve tooling for product engineers to define new event types",
    ],
    requirements: [
      "4+ years in data or platform engineering",
      "Production experience with Kafka or similar streaming systems",
      "Strong SQL and OLAP database knowledge",
    ],
  },
  {
    company: "Nimbus Analytics",
    title: "Product Designer",
    type: "full_time",
    workMode: "remote",
    location: "Remote (US)",
    salaryMin: 130000,
    salaryMax: 160000,
    tags: ["figma", "design-systems", "ux-research"],
    postedDaysAgo: 12,
    views: 256,
    summary:
      "Shape how teams explore data. You'll own end-to-end design for our query builder and collaborate closely with engineering on our design system.",
    responsibilities: [
      "Lead design for core analytics workflows from discovery to ship",
      "Run lightweight research with customers and synthesize insights",
      "Evolve our Figma component library alongside engineering",
    ],
    requirements: [
      "4+ years designing complex B2B or data-heavy products",
      "A portfolio showing systems thinking and craft",
      "Comfort working directly with engineers in fast iterations",
    ],
  },
  {
    company: "Forgeline Robotics",
    title: "Embedded Software Engineer",
    type: "full_time",
    workMode: "onsite",
    location: "Boston, MA",
    salaryMin: 140000,
    salaryMax: 175000,
    tags: ["cpp", "rust", "rtos", "robotics"],
    postedDaysAgo: 4,
    views: 143,
    summary:
      "Write the firmware that moves our robot arms. Real-time control loops, motor drivers, and safety-critical systems — your code runs on hardware you can touch.",
    responsibilities: [
      "Develop real-time control firmware in C++ and Rust",
      "Implement and tune motion control and safety interlocks",
      "Work with EE team on board bring-up and hardware debugging",
    ],
    requirements: [
      "3+ years embedded development on ARM Cortex-M or similar",
      "Solid grasp of RTOS concepts and real-time constraints",
      "Experience with motor control or robotics a strong plus",
    ],
  },
  {
    company: "Forgeline Robotics",
    title: "Robotics Applications Intern",
    type: "internship",
    workMode: "onsite",
    location: "Boston, MA",
    salaryMin: 30,
    salaryMax: 38,
    tags: ["python", "ros", "robotics", "internship"],
    postedDaysAgo: 9,
    views: 421,
    summary:
      "Spend a semester teaching robots new tricks. You'll build demo applications and internal tools on top of our robot SDK, working directly with the applications engineering team.",
    responsibilities: [
      "Prototype pick-and-place and machine-tending demos",
      "Extend our Python SDK examples and documentation",
      "Support customer pilots with application scripting",
    ],
    requirements: [
      "Pursuing CS, ME, or robotics degree",
      "Comfortable with Python; ROS experience a plus",
      "On-site availability in Boston",
    ],
  },
  {
    company: "Verdant Health",
    title: "Senior Backend Engineer (Node.js)",
    type: "full_time",
    workMode: "remote",
    location: "Remote (US)",
    salaryMin: 155000,
    salaryMax: 185000,
    tags: ["nodejs", "typescript", "postgres", "hipaa"],
    postedDaysAgo: 1,
    views: 198,
    summary:
      "Build the APIs behind virtual care for millions of patients. Reliability and privacy aren't features here — they're the product.",
    responsibilities: [
      "Design and ship TypeScript services on our Node.js platform",
      "Model complex clinical workflows in PostgreSQL",
      "Harden systems for HIPAA compliance and audit readiness",
      "Participate in a humane on-call rotation",
    ],
    requirements: [
      "5+ years backend experience with Node.js or similar",
      "Strong relational data modeling skills",
      "Experience in regulated or high-trust domains preferred",
    ],
  },
  {
    company: "Verdant Health",
    title: "Mobile Engineer (React Native)",
    type: "full_time",
    workMode: "hybrid",
    location: "Austin, TX",
    salaryMin: 140000,
    salaryMax: 170000,
    tags: ["react-native", "typescript", "mobile", "healthcare"],
    postedDaysAgo: 8,
    views: 165,
    summary:
      "Our patient app is the front door to care for 2M+ people. Ship features that make booking a doctor as easy as ordering coffee.",
    responsibilities: [
      "Build patient-facing features in React Native",
      "Own release trains for iOS and Android",
      "Improve app performance, offline behavior, and accessibility",
    ],
    requirements: [
      "3+ years shipping React Native or native mobile apps",
      "Experience with app store release processes",
      "Care for accessibility and inclusive design",
    ],
  },
  {
    company: "Verdant Health",
    title: "Clinical Data Analyst (Part-time)",
    type: "part_time",
    workMode: "remote",
    location: "Remote (US)",
    salaryMin: 45,
    salaryMax: 60,
    tags: ["sql", "analytics", "healthcare", "tableau"],
    postedDaysAgo: 15,
    views: 88,
    summary:
      "Help our clinical team measure care quality. ~20 hours a week analyzing outcomes data and building dashboards clinicians actually use.",
    responsibilities: [
      "Analyze clinical outcomes and utilization data in SQL",
      "Maintain quality dashboards in Tableau",
      "Partner with clinicians to define meaningful metrics",
    ],
    requirements: [
      "2+ years in data analysis, healthcare preferred",
      "Strong SQL; Tableau or similar BI tooling",
      "Understanding of PHI handling practices",
    ],
  },
  {
    company: "Lumen Ledger",
    title: "Machine Learning Engineer",
    type: "full_time",
    workMode: "hybrid",
    location: "New York, NY",
    salaryMin: 170000,
    salaryMax: 220000,
    tags: ["python", "ml", "nlp", "fintech"],
    postedDaysAgo: 3,
    views: 310,
    summary:
      "Teach machines to read receipts, invoices, and bank feeds. You'll own the transaction-categorization models at the heart of our product.",
    responsibilities: [
      "Train and deploy models for document extraction and categorization",
      "Build evaluation pipelines and drift monitoring",
      "Work with product to turn model wins into user-facing features",
    ],
    requirements: [
      "3+ years applied ML in production",
      "Strong Python and modern ML tooling",
      "Experience with NLP or document understanding",
    ],
  },
  {
    company: "Lumen Ledger",
    title: "Staff Product Manager — Platform",
    type: "full_time",
    workMode: "onsite",
    location: "New York, NY",
    salaryMin: 180000,
    salaryMax: 225000,
    tags: ["product", "fintech", "b2b", "api"],
    postedDaysAgo: 11,
    views: 129,
    summary:
      "Own the roadmap for our accounting platform APIs and integrations ecosystem. High-autonomy role reporting to the CPO.",
    responsibilities: [
      "Define platform strategy for integrations and public APIs",
      "Work with top accounting firms to shape partner features",
      "Drive quarterly planning with three engineering squads",
    ],
    requirements: [
      "6+ years product management, ideally on developer platforms or fintech",
      "Track record shipping API products",
      "Comfort with technical depth and financial domain complexity",
    ],
  },
  {
    company: "Atlas Freight",
    title: "Full-Stack Engineer",
    type: "full_time",
    workMode: "remote",
    location: "Remote (US)",
    salaryMin: 135000,
    salaryMax: 165000,
    tags: ["typescript", "react", "nodejs", "postgres"],
    postedDaysAgo: 5,
    views: 274,
    summary:
      "Build marketplace features across our carrier and shipper apps. Small squad, full ownership, weekly ships.",
    responsibilities: [
      "Ship features end-to-end across React frontends and Node services",
      "Model freight workflows: quotes, tenders, tracking, settlement",
      "Instrument features and iterate based on usage data",
    ],
    requirements: [
      "3+ years full-stack development with TypeScript",
      "Solid PostgreSQL experience",
      "Bias for shipping and iterating",
    ],
  },
  {
    company: "Atlas Freight",
    title: "Operations Engineer (Contract)",
    type: "contract",
    workMode: "remote",
    location: "Remote (US)",
    salaryMin: 70,
    salaryMax: 90,
    tags: ["python", "automation", "logistics", "contract"],
    postedDaysAgo: 18,
    views: 76,
    summary:
      "6-month contract building internal automation for our ops team — load matching heuristics, alerting, and back-office tooling.",
    responsibilities: [
      "Automate manual ops workflows with Python services",
      "Build internal dashboards and alerting for load exceptions",
      "Document runbooks and hand off to the platform team",
    ],
    requirements: [
      "Strong Python scripting and API integration experience",
      "Experience building internal tools",
      "Available ~40 hrs/week for a 6-month engagement",
    ],
  },
  {
    company: "Pixelbloom Studio",
    title: "Creative Frontend Developer",
    type: "full_time",
    workMode: "hybrid",
    location: "Los Angeles, CA",
    salaryMin: 115000,
    salaryMax: 145000,
    tags: ["webgl", "threejs", "gsap", "react"],
    postedDaysAgo: 7,
    views: 389,
    summary:
      "Make the web feel alive. You'll build award-chasing marketing sites and interactive experiences with WebGL, shaders, and buttery animation.",
    responsibilities: [
      "Build interactive experiences with Three.js and GSAP",
      "Translate wild art direction into performant web experiences",
      "Prototype quickly, then polish relentlessly",
    ],
    requirements: [
      "Portfolio of expressive, animated web work",
      "Strong JavaScript/TypeScript and modern CSS",
      "WebGL or shader experience",
    ],
  },
  {
    company: "Pixelbloom Studio",
    title: "Motion Designer (Part-time)",
    type: "part_time",
    workMode: "remote",
    location: "Remote (Americas)",
    salaryMin: 50,
    salaryMax: 75,
    tags: ["after-effects", "motion", "lottie", "design"],
    postedDaysAgo: 20,
    views: 112,
    summary:
      "Create motion systems for brand and product work — Lottie animations, launch films, and micro-interactions. ~15-20 hours a week with flexible scheduling.",
    responsibilities: [
      "Design and animate brand moments in After Effects",
      "Export production-ready Lottie/Rive assets for dev handoff",
      "Contribute to motion guidelines across client projects",
    ],
    requirements: [
      "Strong motion portfolio",
      "After Effects mastery; Lottie/Rive workflow experience",
      "Reliable async communication",
    ],
  },
  {
    company: "Quanta Cloud",
    title: "Site Reliability Engineer",
    type: "full_time",
    workMode: "remote",
    location: "Remote (US/EU)",
    salaryMin: 160000,
    salaryMax: 200000,
    tags: ["kubernetes", "go", "terraform", "sre"],
    postedDaysAgo: 2,
    views: 231,
    summary:
      "Keep hundreds of production Kubernetes clusters boring. You'll build the automation that makes 99.95% feel routine.",
    responsibilities: [
      "Operate and automate our multi-tenant Kubernetes fleet",
      "Write Go operators and Terraform modules",
      "Lead incident response and blameless postmortems",
      "Drive SLO definition with product teams",
    ],
    requirements: [
      "4+ years SRE/platform experience",
      "Deep Kubernetes knowledge",
      "Production Go or similar systems language",
    ],
  },
  {
    company: "Quanta Cloud",
    title: "Developer Advocate",
    type: "full_time",
    workMode: "remote",
    location: "Remote (Global)",
    salaryMin: 130000,
    salaryMax: 165000,
    tags: ["devrel", "kubernetes", "content", "community"],
    postedDaysAgo: 14,
    views: 178,
    summary:
      "Be the voice of Quanta in the platform engineering community — and the voice of the community inside Quanta. Talks, tutorials, demos, and honest feedback loops.",
    responsibilities: [
      "Create technical content: blog posts, videos, conference talks",
      "Build demo apps and reference architectures",
      "Gather developer feedback and champion it in product planning",
    ],
    requirements: [
      "Hands-on Kubernetes/cloud-native experience",
      "Public speaking or technical writing track record",
      "Willingness to travel ~15%",
    ],
  },
  {
    company: "Harbor Fintech",
    title: "Backend Engineer — Payments",
    type: "full_time",
    workMode: "hybrid",
    location: "Charlotte, NC",
    salaryMin: 145000,
    salaryMax: 180000,
    tags: ["java", "kotlin", "payments", "postgres"],
    postedDaysAgo: 6,
    views: 154,
    summary:
      "Move money correctly, every time. You'll build the ledger and payment-rail integrations (ACH, RTP, cards) that our banking API customers depend on.",
    responsibilities: [
      "Build payment processing services in Kotlin",
      "Integrate with ACH, RTP, and card networks",
      "Design idempotent, auditable money-movement flows",
    ],
    requirements: [
      "4+ years backend engineering, JVM ecosystem",
      "Experience with financial systems or double-entry ledgers",
      "Rigor around correctness, testing, and observability",
    ],
  },
  {
    company: "Harbor Fintech",
    title: "Compliance Program Manager",
    type: "full_time",
    workMode: "onsite",
    location: "Charlotte, NC",
    salaryMin: 120000,
    salaryMax: 150000,
    tags: ["compliance", "bsa-aml", "fintech", "risk"],
    postedDaysAgo: 16,
    views: 67,
    summary:
      "Run the compliance programs that keep our bank partners confident — BSA/AML, KYC, and vendor oversight for our embedded banking platform.",
    responsibilities: [
      "Own BSA/AML program execution and reporting",
      "Manage KYC/KYB policy and tooling with engineering",
      "Prepare for bank partner and regulator audits",
    ],
    requirements: [
      "4+ years in fintech or banking compliance",
      "Working knowledge of BSA/AML regulations",
      "CAMS certification a plus",
    ],
  },
  {
    company: "Solstice Games",
    title: "Gameplay Programmer",
    type: "full_time",
    workMode: "hybrid",
    location: "Montreal, QC",
    salaryMin: 95000,
    salaryMax: 125000,
    tags: ["unity", "csharp", "gamedev", "gameplay"],
    postedDaysAgo: 10,
    views: 456,
    summary:
      "Join a 12-person team building our next title — a systemic survival adventure. You'll own core gameplay systems from prototype to ship.",
    responsibilities: [
      "Implement gameplay systems in Unity/C#",
      "Prototype mechanics with designers in tight loops",
      "Optimize for console performance budgets",
    ],
    requirements: [
      "2+ years professional Unity development",
      "Strong C# and game architecture fundamentals",
      "A shipped title (any size) is a plus",
    ],
  },
  {
    company: "Solstice Games",
    title: "Technical Artist (Contract)",
    type: "contract",
    workMode: "remote",
    location: "Remote (Americas/EU)",
    salaryMin: 55,
    salaryMax: 80,
    tags: ["unity", "shaders", "vfx", "contract"],
    postedDaysAgo: 22,
    views: 134,
    summary:
      "8-month contract bridging art and engineering: shaders, VFX, and tooling for our stylized survival adventure.",
    responsibilities: [
      "Author stylized shaders and VFX in Unity",
      "Build artist tooling and asset pipelines",
      "Profile and fix GPU performance issues",
    ],
    requirements: [
      "Shader programming (HLSL/Shader Graph)",
      "Unity pipeline experience",
      "Portfolio of stylized real-time work",
    ],
  },
  {
    company: "Meridian EdTech",
    title: "Senior Full-Stack Engineer",
    type: "full_time",
    workMode: "remote",
    location: "Remote (US)",
    salaryMin: 145000,
    salaryMax: 175000,
    tags: ["typescript", "react", "nodejs", "edtech"],
    postedDaysAgo: 4,
    views: 203,
    summary:
      "Build adaptive learning experiences used by a million students. You'll work across our React apps and Node services with heavy product ownership.",
    responsibilities: [
      "Ship learner and teacher-facing features end to end",
      "Evolve our adaptive learning engine's APIs",
      "Champion accessibility (WCAG AA) across the product",
    ],
    requirements: [
      "5+ years full-stack TypeScript experience",
      "Accessibility-minded frontend craft",
      "Interest in learning science",
    ],
  },
  {
    company: "Meridian EdTech",
    title: "Curriculum Engineer (Part-time)",
    type: "part_time",
    workMode: "remote",
    location: "Remote (US)",
    salaryMin: 40,
    salaryMax: 55,
    tags: ["education", "content", "python", "assessment"],
    postedDaysAgo: 13,
    views: 59,
    summary:
      "Former teacher who codes? Encode curriculum standards and assessment logic into our adaptive engine. ~20 hrs/week, school-hours friendly.",
    responsibilities: [
      "Author and validate curriculum-aligned item banks",
      "Script content pipelines in Python",
      "QA adaptive sequencing behavior with the learning team",
    ],
    requirements: [
      "Teaching or curriculum design background",
      "Basic Python or willingness to grow it",
      "Detail obsession",
    ],
  },
  {
    company: "Quanta Cloud",
    title: "Product Marketing Manager",
    type: "full_time",
    workMode: "hybrid",
    location: "Seattle, WA",
    salaryMin: 125000,
    salaryMax: 155000,
    tags: ["marketing", "b2b", "devtools", "gtm"],
    postedDaysAgo: 19,
    views: 84,
    summary:
      "Translate deeply technical platform capabilities into stories engineering leaders care about. Own positioning, launches, and sales enablement.",
    responsibilities: [
      "Craft positioning and messaging for platform products",
      "Run product launches with product and sales",
      "Build competitive intelligence and enablement materials",
    ],
    requirements: [
      "3+ years PMM experience in B2B infrastructure or devtools",
      "Ability to go deep technically",
      "Crisp writing",
    ],
  },
  {
    company: "Nimbus Analytics",
    title: "Engineering Manager — Query Platform",
    type: "full_time",
    workMode: "remote",
    location: "Remote (US)",
    salaryMin: 190000,
    salaryMax: 235000,
    tags: ["management", "distributed-systems", "sql"],
    postedDaysAgo: 8,
    views: 97,
    summary:
      "Lead the 7-person team behind our query engine and caching layer. Player-coach role: strong technical judgment, people-first leadership.",
    responsibilities: [
      "Manage, coach, and grow a senior engineering team",
      "Own roadmap and delivery for the query platform",
      "Partner with product on performance-as-a-feature strategy",
    ],
    requirements: [
      "2+ years managing engineers, 5+ years hands-on before that",
      "Distributed systems background",
      "Excellent written communication",
    ],
  },
  {
    company: "Atlas Freight",
    title: "Data Scientist — Pricing",
    type: "full_time",
    workMode: "hybrid",
    location: "Chicago, IL",
    salaryMin: 150000,
    salaryMax: 185000,
    tags: ["python", "ml", "pricing", "logistics"],
    postedDaysAgo: 12,
    views: 118,
    summary:
      "Price freight in real time. Build the models that quote 10,000+ loads a day and keep our marketplace liquid.",
    responsibilities: [
      "Develop dynamic pricing models for spot freight",
      "Design experiments to measure pricing strategy impact",
      "Ship models to production with engineering",
    ],
    requirements: [
      "3+ years applied DS/ML, ideally in marketplaces or pricing",
      "Strong Python, SQL, and causal inference fundamentals",
    ],
  },
  {
    company: "Verdant Health",
    title: "Security Engineer",
    type: "full_time",
    workMode: "remote",
    location: "Remote (US)",
    salaryMin: 160000,
    salaryMax: 195000,
    tags: ["security", "aws", "hipaa", "devsecops"],
    postedDaysAgo: 5,
    views: 141,
    summary:
      "Defend the systems that hold health data for millions. Build guardrails, not gates — security tooling that engineers actually like.",
    responsibilities: [
      "Own cloud security posture across our AWS estate",
      "Build paved-road security tooling into CI/CD",
      "Run threat modeling and incident response",
    ],
    requirements: [
      "4+ years security engineering in cloud environments",
      "Scripting/automation fluency",
      "Healthcare or compliance-heavy background a plus",
    ],
  },
  {
    company: "Harbor Fintech",
    title: "Frontend Engineer — Dashboard",
    type: "full_time",
    workMode: "remote",
    location: "Remote (US)",
    salaryMin: 130000,
    salaryMax: 160000,
    tags: ["react", "typescript", "fintech", "design-systems"],
    postedDaysAgo: 3,
    views: 226,
    summary:
      "Build the dashboard where our customers manage accounts, cards, and payouts. Complex data, clean UI, zero tolerance for confusion about money.",
    responsibilities: [
      "Ship React features for our customer dashboard",
      "Contribute to our internal design system",
      "Build data-dense tables, filters, and reconciliation views",
    ],
    requirements: [
      "3+ years React + TypeScript",
      "Strong product sense for B2B tools",
      "Care for edge cases (money demands it)",
    ],
  },
  {
    company: "Pixelbloom Studio",
    title: "Digital Producer",
    type: "full_time",
    workMode: "onsite",
    location: "Los Angeles, CA",
    salaryMin: 90000,
    salaryMax: 115000,
    tags: ["production", "agency", "project-management"],
    postedDaysAgo: 17,
    views: 73,
    summary:
      "Keep ambitious creative projects on the rails. You'll run 2-3 client engagements at a time from kickoff to launch party.",
    responsibilities: [
      "Own project plans, budgets, and client communication",
      "Coordinate designers, developers, and freelancers",
      "Protect scope and creative quality simultaneously",
    ],
    requirements: [
      "3+ years producing digital/agency work",
      "Calm under deadline pressure",
      "Fluency in both creative and technical vocabulary",
    ],
  },
  {
    company: "Meridian EdTech",
    title: "QA Automation Engineer",
    type: "full_time",
    workMode: "remote",
    location: "Remote (US)",
    salaryMin: 110000,
    salaryMax: 140000,
    tags: ["playwright", "typescript", "qa", "ci-cd"],
    postedDaysAgo: 21,
    views: 92,
    summary:
      "Make 'it works in every district' a provable statement. Own our Playwright suite and quality gates across web and mobile web.",
    responsibilities: [
      "Build and maintain end-to-end test suites in Playwright",
      "Design CI quality gates with the platform team",
      "Champion testability in feature design reviews",
    ],
    requirements: [
      "3+ years test automation for web apps",
      "Strong TypeScript",
      "Experience testing across browsers and devices",
    ],
  },
  {
    company: "Solstice Games",
    title: "Community Manager",
    type: "full_time",
    workMode: "remote",
    location: "Remote (Americas)",
    salaryMin: 65000,
    salaryMax: 85000,
    tags: ["community", "social", "gamedev", "discord"],
    postedDaysAgo: 25,
    views: 167,
    summary:
      "Grow and care for the community around our games — Discord, socials, playtests, and patch-note poetry.",
    responsibilities: [
      "Run our Discord and social channels day to day",
      "Organize playtests and synthesize player feedback",
      "Write patch notes and community updates with personality",
    ],
    requirements: [
      "2+ years community management, ideally in games",
      "Excellent writing voice",
      "Genuine love of indie games",
    ],
  },
];

function buildDescription(j: JobSeed): string {
  const company = companySeeds.find((c) => c.name === j.company)!;
  return `## About the role

${j.summary}

## What you'll do

${j.responsibilities.map((r) => `- ${r}`).join("\n")}

## What we're looking for

${j.requirements.map((r) => `- ${r}`).join("\n")}
${
  j.niceToHave?.length
    ? `\n## Nice to have\n\n${j.niceToHave.map((r) => `- ${r}`).join("\n")}\n`
    : ""
}
## About ${company.name}

${company.about}

## How we hire

We review every application within a week. Expect an intro call, a practical exercise or portfolio walkthrough, and a team conversation — no trick questions.`;
}

async function main() {
  console.log("Seeding database...");

  // wipe in FK-safe order — full-table deletes are the point here
  /* eslint-disable drizzle/enforce-delete-with-where */
  await db.delete(savedJobs);
  await db.delete(applications);
  await db.delete(jobs);
  await db.delete(companies);
  await db.delete(sessions);
  await db.delete(users);
  /* eslint-enable drizzle/enforce-delete-with-where */

  const passwordHash = await hash(DEMO_PASSWORD);

  // --- users ---------------------------------------------------------------
  const [demoSeeker] = await db
    .insert(users)
    .values({
      name: "Sam Seeker",
      email: "seeker@jobmart.dev",
      passwordHash,
      role: "seeker",
    })
    .returning();

  const [demoEmployer] = await db
    .insert(users)
    .values({
      name: "Erin Employer",
      email: "employer@jobmart.dev",
      passwordHash,
      role: "employer",
    })
    .returning();

  const extraSeekers = await db
    .insert(users)
    .values(
      [
        ["Priya Raman", "priya.raman"],
        ["Diego Alvarez", "diego.alvarez"],
        ["Mei Chen", "mei.chen"],
        ["Tunde Okafor", "tunde.okafor"],
        ["Lena Kovacs", "lena.kovacs"],
      ].map(([name, slug]) => ({
        name: name!,
        email: `${slug}@example.com`,
        passwordHash,
        role: "seeker" as const,
      })),
    )
    .returning();

  // each non-demo company needs an employer owner
  const extraEmployers = await db
    .insert(users)
    .values(
      companySeeds.slice(1).map((c, i) => ({
        name: `${c.name} Hiring`,
        email: `hiring+${i + 1}@example.com`,
        passwordHash,
        role: "employer" as const,
      })),
    )
    .returning();

  // --- companies -----------------------------------------------------------
  // demo employer owns the first company (Nimbus Analytics)
  const owners = [demoEmployer!, ...extraEmployers];
  const insertedCompanies = await db
    .insert(companies)
    .values(
      companySeeds.map((c, i) => ({
        ownerId: owners[i]!.id,
        name: c.name,
        website: c.website,
        location: c.location,
        about: c.about,
        logoUrl: null,
      })),
    )
    .returning();

  const companyByName = new Map(insertedCompanies.map((c) => [c.name, c]));

  // --- jobs ----------------------------------------------------------------
  const insertedJobs = await db
    .insert(jobs)
    .values(
      jobSeeds.map((j) => ({
        companyId: companyByName.get(j.company)!.id,
        title: j.title,
        slug: slugify(j.title, j.company),
        description: buildDescription(j),
        type: j.type,
        workMode: j.workMode,
        location: j.location,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        currency: "USD",
        tags: j.tags,
        status: "published" as const,
        views: j.views,
        createdAt: daysAgo(j.postedDaysAgo),
        updatedAt: daysAgo(j.postedDaysAgo),
      })),
    )
    .returning();

  // one draft job for the demo employer so /dashboard/jobs shows all states
  const nimbus = companyByName.get("Nimbus Analytics")!;
  await db.insert(jobs).values({
    companyId: nimbus.id,
    title: "Technical Writer — Docs Platform",
    slug: slugify("Technical Writer Docs Platform draft", "Nimbus Analytics"),
    description:
      "## About the role\n\nDraft in progress — we're still scoping this one.\n\n- Own developer documentation\n- Build docs tooling",
    type: "full_time",
    workMode: "remote",
    location: "Remote (US)",
    salaryMin: 110000,
    salaryMax: 140000,
    tags: ["docs", "writing"],
    status: "draft",
  });

  const nimbusJobs = insertedJobs.filter((j) => j.companyId === nimbus.id);

  // --- applications ----------------------------------------------------------
  // demo seeker applies to a few jobs (varied statuses)
  const applyTargets = [
    { title: "Senior Frontend Engineer", status: "shortlisted" as const },
    { title: "Full-Stack Engineer", status: "pending" as const },
    { title: "Senior Full-Stack Engineer", status: "reviewed" as const },
    { title: "Frontend Engineer — Dashboard", status: "rejected" as const },
  ];

  for (const t of applyTargets) {
    const job = insertedJobs.find((j) => j.title === t.title)!;
    await db.insert(applications).values({
      jobId: job.id,
      seekerId: demoSeeker!.id,
      coverNote:
        "Hi! I've spent the last five years building data-heavy React applications, most recently leading the rebuild of an internal analytics dashboard used by 400+ colleagues. Your posting stood out because it pairs product ownership with hard rendering problems. I'd love to talk.",
      resumeUrl: "https://example.com/resumes/sam-seeker.pdf",
      status: t.status,
      createdAt: daysAgo(1),
    });
  }

  // extra seekers apply to the demo employer's jobs → populates the pipeline
  const pipelineNotes = [
    "I led frontend performance work at a fintech scale-up — cut dashboard TTI by 60%. Portfolio and details in my resume.",
    "Data viz specialist: D3, canvas, WebGL. I built the charting layer for a monitoring product with 50k+ users.",
    "Full-stack engineer leaning frontend, 6 years with React/TypeScript. Big fan of what Nimbus is doing with no-SQL analytics.",
    "Recently wrapped a contract building a real-time analytics UI on ClickHouse — very close to your stack.",
    "Engineering lead looking to return to hands-on IC work. Deep design-systems and mentoring experience.",
  ];
  const pipelineStatuses = [
    "pending",
    "reviewed",
    "shortlisted",
    "pending",
    "hired",
  ] as const;

  for (const [i, seeker] of extraSeekers.entries()) {
    const job = nimbusJobs[i % nimbusJobs.length]!;
    await db.insert(applications).values({
      jobId: job.id,
      seekerId: seeker.id,
      coverNote: pipelineNotes[i]!,
      resumeUrl: `https://example.com/resumes/${seeker.name
        .toLowerCase()
        .replace(/\s+/g, "-")}.pdf`,
      status: pipelineStatuses[i],
      createdAt: daysAgo(i + 1),
    });
  }

  // --- saved jobs ------------------------------------------------------------
  const savedTitles = [
    "Site Reliability Engineer",
    "Machine Learning Engineer",
    "Creative Frontend Developer",
  ];
  for (const title of savedTitles) {
    const job = insertedJobs.find((j) => j.title === title)!;
    await db.insert(savedJobs).values({
      userId: demoSeeker!.id,
      jobId: job.id,
    });
  }

  console.log(
    `Seeded ${insertedCompanies.length} companies, ${insertedJobs.length + 1} jobs, ` +
      `${applyTargets.length + extraSeekers.length} applications, ${savedTitles.length} saved jobs.`,
  );
  console.log("Demo accounts: seeker@jobmart.dev / employer@jobmart.dev");
  console.log(`Password: ${DEMO_PASSWORD}`);

  await conn.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
