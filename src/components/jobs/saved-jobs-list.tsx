"use client";

import Link from "next/link";
import { BookmarkIcon } from "lucide-react";

import { JobCard, JobCardSkeleton } from "~/components/jobs/job-card";
import { SaveJobButton } from "~/components/jobs/save-job-button";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export function SavedJobsList() {
  const { data: saved, isLoading } = api.savedJob.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!saved || saved.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
        <BookmarkIcon className="text-muted-foreground size-10" />
        <h2 className="font-semibold">No saved jobs</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          Tap the bookmark on any job to save it for later — it&apos;ll wait
          for you right here.
        </p>
        <Button asChild>
          <Link href="/jobs">Browse jobs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {saved.map(({ job, company }) => (
        <JobCard
          key={job.id}
          job={{ ...job, company }}
          actions={
            <SaveJobButton jobId={job.id} jobSlug={job.slug} viewer="seeker" />
          }
        />
      ))}
    </div>
  );
}
