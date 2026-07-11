import { TRPCError } from "@trpc/server";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  ne,
  or,
  sql,
  arrayOverlaps,
} from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  employerProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { jobFiltersSchema } from "~/lib/job-filters";
import { jobInputSchema } from "~/lib/validators";
import { type db as DbClient } from "~/server/db";
import { applications, companies, jobs } from "~/server/db/schema";

type Db = typeof DbClient;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220);

/** The employer's company, or a friendly failure telling them to set it up. */
async function requireCompany(db: Db, ownerId: string) {
  const company = await db.query.companies.findFirst({
    where: eq(companies.ownerId, ownerId),
    columns: { id: true, name: true },
  });
  if (!company) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Set up your company profile before posting jobs",
    });
  }
  return company;
}

/** A job owned by this employer, or NOT_FOUND. */
async function requireOwnedJob(db: Db, ownerId: string, jobId: string) {
  const row = await db
    .select({ job: jobs })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(eq(jobs.id, jobId), eq(companies.ownerId, ownerId)))
    .limit(1)
    .then((rows) => rows[0]);
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
  }
  return row.job;
}

const listInputSchema = jobFiltersSchema.extend({
  limit: z.number().int().min(1).max(50).default(10),
  cursor: z
    .object({
      // sort value of the last row: createdAt millis (newest) or salary (salary sort)
      v: z.number(),
      id: z.string().uuid(),
    })
    .optional(),
});

// hourly rates and annual salaries share the columns; COALESCE picks the best value
const salaryExpr = sql<number>`COALESCE(${jobs.salaryMax}, ${jobs.salaryMin}, 0)`;

export const jobRouter = createTRPCRouter({
  list: publicProcedure.input(listInputSchema).query(async ({ ctx, input }) => {
    const conds = [eq(jobs.status, "published")];

    if (input.q) {
      const like = `%${input.q}%`;
      conds.push(
        or(
          ilike(jobs.title, like),
          ilike(companies.name, like),
          sql`array_to_string(${jobs.tags}, ' ') ILIKE ${like}`,
        )!,
      );
    }
    if (input.type?.length) conds.push(inArray(jobs.type, input.type));
    if (input.workMode?.length)
      conds.push(inArray(jobs.workMode, input.workMode));
    if (input.location) conds.push(ilike(jobs.location, `%${input.location}%`));
    if (input.salaryMin) conds.push(sql`${salaryExpr} >= ${input.salaryMin}`);
    if (input.tags?.length) conds.push(arrayOverlaps(jobs.tags, input.tags));

    // the count ignores the cursor so the total stays stable across pages
    const countWhere = and(...conds);

    const cursorCond = input.cursor
      ? input.sort === "salary"
        ? sql`(${salaryExpr}, ${jobs.id}) < (${input.cursor.v}, ${input.cursor.id}::uuid)`
        : sql`(${jobs.createdAt}, ${jobs.id}) < (${new Date(input.cursor.v).toISOString()}::timestamptz, ${input.cursor.id}::uuid)`
      : undefined;

    const where = cursorCond ? and(countWhere, cursorCond) : countWhere;

    const [rows, [totalRow]] = await Promise.all([
      ctx.db
        .select({
          id: jobs.id,
          slug: jobs.slug,
          title: jobs.title,
          type: jobs.type,
          workMode: jobs.workMode,
          location: jobs.location,
          salaryMin: jobs.salaryMin,
          salaryMax: jobs.salaryMax,
          currency: jobs.currency,
          tags: jobs.tags,
          createdAt: jobs.createdAt,
          company: {
            id: companies.id,
            name: companies.name,
            logoUrl: companies.logoUrl,
          },
        })
        .from(jobs)
        .innerJoin(companies, eq(jobs.companyId, companies.id))
        .where(where)
        .orderBy(
          ...(input.sort === "salary"
            ? [desc(salaryExpr), desc(jobs.id)]
            : [desc(jobs.createdAt), desc(jobs.id)]),
        )
        .limit(input.limit + 1),
      ctx.db
        .select({ total: count() })
        .from(jobs)
        .innerJoin(companies, eq(jobs.companyId, companies.id))
        .where(countWhere),
    ]);

    let nextCursor: { v: number; id: string } | undefined;
    if (rows.length > input.limit) {
      rows.pop();
      const last = rows[rows.length - 1]!;
      nextCursor = {
        v:
          input.sort === "salary"
            ? (last.salaryMax ?? last.salaryMin ?? 0)
            : last.createdAt.getTime(),
        id: last.id,
      };
    }

    return { items: rows, nextCursor, total: totalRow?.total ?? 0 };
  }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.db.query.jobs.findFirst({
        where: and(eq(jobs.slug, input.slug), eq(jobs.status, "published")),
        with: { company: true },
      });
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      // fire-and-forget view counter
      void ctx.db
        .update(jobs)
        .set({ views: sql`${jobs.views} + 1` })
        .where(eq(jobs.id, job.id))
        .catch(() => undefined);

      return job;
    }),

  similar: publicProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.db.query.jobs.findFirst({
        where: eq(jobs.id, input.jobId),
        columns: { id: true, tags: true, companyId: true },
      });
      if (!job) return [];

      return ctx.db
        .select({
          id: jobs.id,
          slug: jobs.slug,
          title: jobs.title,
          type: jobs.type,
          workMode: jobs.workMode,
          location: jobs.location,
          salaryMin: jobs.salaryMin,
          salaryMax: jobs.salaryMax,
          currency: jobs.currency,
          tags: jobs.tags,
          createdAt: jobs.createdAt,
          company: {
            id: companies.id,
            name: companies.name,
            logoUrl: companies.logoUrl,
          },
        })
        .from(jobs)
        .innerJoin(companies, eq(jobs.companyId, companies.id))
        .where(
          and(
            eq(jobs.status, "published"),
            ne(jobs.id, job.id),
            job.tags.length
              ? or(
                  arrayOverlaps(jobs.tags, job.tags),
                  eq(jobs.companyId, job.companyId),
                )
              : eq(jobs.companyId, job.companyId),
          ),
        )
        .orderBy(desc(jobs.createdAt))
        .limit(4);
    }),

  stats: publicProcedure.query(async ({ ctx }) => {
    const [jobRow] = await ctx.db
      .select({ total: count() })
      .from(jobs)
      .where(eq(jobs.status, "published"));
    const [companyRow] = await ctx.db
      .select({ total: count() })
      .from(companies);
    return {
      jobs: jobRow?.total ?? 0,
      companies: companyRow?.total ?? 0,
    };
  }),

  popularTags: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.execute<{ tag: string; count: number }>(
      sql`SELECT t AS tag, count(*)::int AS count
          FROM ${jobs}, unnest(${jobs.tags}) AS t
          WHERE ${jobs.status} = 'published'
          GROUP BY t
          ORDER BY count DESC, tag ASC
          LIMIT 12`,
    );
    return [...rows];
  }),

  // ---- employer procedures --------------------------------------------------

  myJobs: employerProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: jobs.id,
        slug: jobs.slug,
        title: jobs.title,
        type: jobs.type,
        workMode: jobs.workMode,
        location: jobs.location,
        status: jobs.status,
        views: jobs.views,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        applicantCount: count(applications.id),
      })
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .leftJoin(applications, eq(applications.jobId, jobs.id))
      .where(eq(companies.ownerId, ctx.user.id))
      .groupBy(jobs.id)
      .orderBy(desc(jobs.createdAt));
  }),

  byIdForEmployer: employerProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => requireOwnedJob(ctx.db, ctx.user.id, input.id)),

  create: employerProcedure
    .input(jobInputSchema)
    .mutation(async ({ ctx, input }) => {
      const company = await requireCompany(ctx.db, ctx.user.id);

      const base = slugify(`${input.title}-at-${company.name}`);
      let slug = base;
      for (let attempt = 2; ; attempt++) {
        const clash = await ctx.db.query.jobs.findFirst({
          where: eq(jobs.slug, slug),
          columns: { id: true },
        });
        if (!clash) break;
        slug = `${base}-${attempt}`;
      }

      const [job] = await ctx.db
        .insert(jobs)
        .values({
          companyId: company.id,
          slug,
          title: input.title,
          description: input.description,
          type: input.type,
          workMode: input.workMode,
          location: input.location,
          salaryMin: input.salaryMin ?? null,
          salaryMax: input.salaryMax ?? null,
          currency: input.currency,
          tags: input.tags,
          status: input.status,
        })
        .returning();
      return job!;
    }),

  update: employerProcedure
    .input(jobInputSchema.and(z.object({ id: z.string().uuid() })))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedJob(ctx.db, ctx.user.id, input.id);
      const [job] = await ctx.db
        .update(jobs)
        .set({
          title: input.title,
          description: input.description,
          type: input.type,
          workMode: input.workMode,
          location: input.location,
          salaryMin: input.salaryMin ?? null,
          salaryMax: input.salaryMax ?? null,
          currency: input.currency,
          tags: input.tags,
          status: input.status,
        })
        .where(eq(jobs.id, input.id))
        .returning();
      return job!;
    }),

  setStatus: employerProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["draft", "published", "closed"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireOwnedJob(ctx.db, ctx.user.id, input.id);
      const [job] = await ctx.db
        .update(jobs)
        .set({ status: input.status })
        .where(eq(jobs.id, input.id))
        .returning();
      return job!;
    }),

  delete: employerProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedJob(ctx.db, ctx.user.id, input.id);
      await ctx.db.delete(jobs).where(eq(jobs.id, input.id));
      return { deleted: true };
    }),
});
