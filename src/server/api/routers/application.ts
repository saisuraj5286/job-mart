import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { applyInputSchema } from "~/lib/validators";
import { createTRPCRouter, seekerProcedure } from "~/server/api/trpc";
import { applications, jobs } from "~/server/db/schema";

export const applicationRouter = createTRPCRouter({
  // "apply" is a reserved word in trpc routers (Function.prototype.apply)
  submit: seekerProcedure
    .input(applyInputSchema)
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.db.query.jobs.findFirst({
        where: and(eq(jobs.id, input.jobId), eq(jobs.status, "published")),
        columns: { id: true },
      });
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This job is no longer accepting applications",
        });
      }

      const existing = await ctx.db.query.applications.findFirst({
        where: and(
          eq(applications.jobId, input.jobId),
          eq(applications.seekerId, ctx.user.id),
        ),
        columns: { id: true },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You've already applied to this job",
        });
      }

      const [application] = await ctx.db
        .insert(applications)
        .values({
          jobId: input.jobId,
          seekerId: ctx.user.id,
          coverNote: input.coverNote,
          resumeUrl: input.resumeUrl,
        })
        .returning();

      return application!;
    }),

  myApplications: seekerProcedure.query(({ ctx }) =>
    ctx.db.query.applications.findMany({
      where: eq(applications.seekerId, ctx.user.id),
      orderBy: desc(applications.createdAt),
      with: {
        job: {
          columns: { id: true, slug: true, title: true, status: true },
          with: {
            company: { columns: { id: true, name: true, logoUrl: true } },
          },
        },
      },
    }),
  ),

  statusForJob: seekerProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const application = await ctx.db.query.applications.findFirst({
        where: and(
          eq(applications.jobId, input.jobId),
          eq(applications.seekerId, ctx.user.id),
        ),
        columns: { id: true, status: true, createdAt: true },
      });
      return application ?? null;
    }),
});
