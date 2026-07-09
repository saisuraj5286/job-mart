import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, seekerProcedure } from "~/server/api/trpc";
import { companies, jobs, savedJobs } from "~/server/db/schema";

export const savedJobRouter = createTRPCRouter({
  toggle: seekerProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(savedJobs)
        .where(
          and(
            eq(savedJobs.userId, ctx.user.id),
            eq(savedJobs.jobId, input.jobId),
          ),
        )
        .returning();

      if (deleted.length > 0) return { saved: false };

      await ctx.db
        .insert(savedJobs)
        .values({ userId: ctx.user.id, jobId: input.jobId })
        .onConflictDoNothing();
      return { saved: true };
    }),

  ids: seekerProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ jobId: savedJobs.jobId })
      .from(savedJobs)
      .where(eq(savedJobs.userId, ctx.user.id));
    return rows.map((r) => r.jobId);
  }),

  list: seekerProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        savedAt: savedJobs.createdAt,
        job: {
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
          status: jobs.status,
          createdAt: jobs.createdAt,
        },
        company: {
          id: companies.id,
          name: companies.name,
          logoUrl: companies.logoUrl,
        },
      })
      .from(savedJobs)
      .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .where(eq(savedJobs.userId, ctx.user.id))
      .orderBy(desc(savedJobs.createdAt)),
  ),
});
