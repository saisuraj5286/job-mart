import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";

import { requireRole } from "~/server/auth/guards";
import { JobForm } from "~/components/jobs/job-form";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Edit job",
};

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("employer", "/dashboard/jobs");
  const { id } = await params;

  const job = await api.job
    .byIdForEmployer({ id })
    .catch((err: unknown) => {
      if (err instanceof TRPCError && err.code === "NOT_FOUND") return null;
      throw err;
    });
  if (!job) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Edit job
        </h1>
        <p className="text-muted-foreground mt-1">{job.title}</p>
      </header>
      <Card>
        <CardContent className="p-6">
          <JobForm
            mode="edit"
            jobId={job.id}
            defaultValues={{
              title: job.title,
              description: job.description,
              type: job.type,
              workMode: job.workMode,
              location: job.location,
              salaryMin: job.salaryMin ?? undefined,
              salaryMax: job.salaryMax ?? undefined,
              currency: job.currency,
              tags: job.tags,
              status: job.status === "closed" ? "draft" : job.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
