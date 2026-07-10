import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { applyInputSchema } from "~/lib/validators";
import {
  createTRPCRouter,
  employerProcedure,
  seekerProcedure,
} from "~/server/api/trpc";
import { applications, companies, jobs, users } from "~/server/db/schema";

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

  // ---- employer procedures --------------------------------------------------

  /** Applicants for one of the employer's own jobs. */
  byJob: employerProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const owned = await ctx.db
        .select({ id: jobs.id })
        .from(jobs)
        .innerJoin(companies, eq(jobs.companyId, companies.id))
        .where(
          and(eq(jobs.id, input.jobId), eq(companies.ownerId, ctx.user.id)),
        )
        .limit(1);
      if (owned.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      return ctx.db
        .select({
          id: applications.id,
          coverNote: applications.coverNote,
          resumeUrl: applications.resumeUrl,
          status: applications.status,
          createdAt: applications.createdAt,
          seeker: { id: users.id, name: users.name, email: users.email },
        })
        .from(applications)
        .innerJoin(users, eq(applications.seekerId, users.id))
        .where(eq(applications.jobId, input.jobId))
        .orderBy(desc(applications.createdAt));
    }),

  updateStatus: employerProcedure
    .input(
      z.object({
        applicationId: z.string().uuid(),
        status: z.enum([
          "pending",
          "reviewed",
          "shortlisted",
          "rejected",
          "hired",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // ownership: application → job → company → this employer
      const owned = await ctx.db
        .select({ id: applications.id })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .innerJoin(companies, eq(jobs.companyId, companies.id))
        .where(
          and(
            eq(applications.id, input.applicationId),
            eq(companies.ownerId, ctx.user.id),
          ),
        )
        .limit(1);
      if (owned.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      const [application] = await ctx.db
        .update(applications)
        .set({ status: input.status })
        .where(eq(applications.id, input.applicationId))
        .returning();
      return application!;
    }),
});
