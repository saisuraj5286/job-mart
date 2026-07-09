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

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { jobFiltersSchema } from "~/lib/job-filters";
import { companies, jobs } from "~/server/db/schema";

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
    if (input.location)
      conds.push(ilike(jobs.location, `%${input.location}%`));
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
});
