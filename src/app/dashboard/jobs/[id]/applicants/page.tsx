import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { ArrowLeftIcon } from "lucide-react";

import { requireRole } from "~/server/auth/guards";
import { ApplicantsList } from "~/components/applications/applicants-list";
import { JobStatusBadge } from "~/components/jobs/job-status-badge";
import { Button } from "~/components/ui/button";
import { api, HydrateClient } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Applicants",
};

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("employer", "/dashboard/jobs");
  const { id } = await params;

  const job = await api.job.byIdForEmployer({ id }).catch((err: unknown) => {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") return null;
    throw err;
  });
  if (!job) notFound();

  void api.application.byJob.prefetch({ jobId: job.id });

  return (
    <HydrateClient>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground mb-2 -ml-2"
            asChild
          >
            <Link href="/dashboard/jobs">
              <ArrowLeftIcon className="size-4" />
              All job posts
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Applicants
            </h1>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="text-muted-foreground mt-1">
            {job.title} · {job.location}
          </p>
        </header>
        <ApplicantsList jobId={job.id} />
      </div>
    </HydrateClient>
  );
}
