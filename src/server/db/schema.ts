import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTableCreator,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";

/**
 * Multi-project schema — all tables are prefixed `job-mart_` and
 * `drizzle.config.ts` filters on that prefix.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `job-mart_${name}`);

export const userRoleEnum = pgEnum("job_mart_user_role", [
  "seeker",
  "employer",
]);

export const jobTypeEnum = pgEnum("job_mart_job_type", [
  "full_time",
  "part_time",
  "contract",
  "internship",
]);

export const workModeEnum = pgEnum("job_mart_work_mode", [
  "remote",
  "hybrid",
  "onsite",
]);

export const jobStatusEnum = pgEnum("job_mart_job_status", [
  "draft",
  "published",
  "closed",
]);

export const applicationStatusEnum = pgEnum("job_mart_application_status", [
  "pending",
  "reviewed",
  "shortlisted",
  "rejected",
  "hired",
]);

export const users = createTable(
  "user",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    name: d.varchar({ length: 255 }).notNull(),
    email: d.varchar({ length: 255 }).notNull().unique(),
    passwordHash: d.text().notNull(),
    role: userRoleEnum().notNull(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => [index("user_email_idx").on(t.email)],
);

export const sessions = createTable(
  "session",
  (d) => ({
    // sha256 hex of the session token — the raw token never touches the DB
    id: d.varchar({ length: 64 }).primaryKey(),
    userId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: d.timestamp({ withTimezone: true }).notNull(),
  }),
  (t) => [index("session_user_idx").on(t.userId)],
);

export const companies = createTable("company", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  ownerId: d
    .uuid()
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  name: d.varchar({ length: 255 }).notNull(),
  website: d.varchar({ length: 512 }),
  location: d.varchar({ length: 255 }),
  logoUrl: d.varchar({ length: 1024 }),
  about: d.text(),
  createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
}));

export const jobs = createTable(
  "job",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    companyId: d
      .uuid()
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    title: d.varchar({ length: 255 }).notNull(),
    slug: d.varchar({ length: 300 }).notNull().unique(),
    description: d.text().notNull(), // markdown
    type: jobTypeEnum().notNull(),
    workMode: workModeEnum().notNull(),
    location: d.varchar({ length: 255 }).notNull(),
    salaryMin: d.integer(),
    salaryMax: d.integer(),
    currency: d.varchar({ length: 8 }).default("USD").notNull(),
    tags: d.text().array().default([]).notNull(),
    status: jobStatusEnum().default("draft").notNull(),
    views: d.integer().default(0).notNull(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("job_status_created_idx").on(t.status, t.createdAt),
    index("job_company_idx").on(t.companyId),
  ],
);

export const applications = createTable(
  "application",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    jobId: d
      .uuid()
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    seekerId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    coverNote: d.text().notNull(),
    resumeUrl: d.varchar({ length: 1024 }).notNull(),
    status: applicationStatusEnum().default("pending").notNull(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    unique("application_job_seeker_unique").on(t.jobId, t.seekerId),
    index("application_seeker_idx").on(t.seekerId),
    index("application_job_idx").on(t.jobId),
  ],
);

export const savedJobs = createTable(
  "saved_job",
  (d) => ({
    userId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: d
      .uuid()
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.jobId] })],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.id],
    references: [companies.ownerId],
  }),
  applications: many(applications),
  savedJobs: many(savedJobs),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(users, { fields: [companies.ownerId], references: [users.id] }),
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),
  applications: many(applications),
  savedBy: many(savedJobs),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  seeker: one(users, {
    fields: [applications.seekerId],
    references: [users.id],
  }),
}));

export const savedJobsRelations = relations(savedJobs, ({ one }) => ({
  user: one(users, { fields: [savedJobs.userId], references: [users.id] }),
  job: one(jobs, { fields: [savedJobs.jobId], references: [jobs.id] }),
}));

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type SavedJob = typeof savedJobs.$inferSelect;
