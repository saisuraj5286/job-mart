import { type Metadata } from "next";
import { Suspense } from "react";

import { parseJobFilters } from "~/lib/job-filters";
import { JobsBrowser } from "~/components/jobs/jobs-browser";
import { JobCardSkeleton } from "~/components/jobs/job-card";
import { api, HydrateClient } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Browse jobs",
  description:
    "Search and filter open roles across engineering, design, product, and more.",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const filters = parseJobFilters(await searchParams);
  void api.job.list.prefetchInfinite({ ...filters, limit: 10 });
  void api.job.popularTags.prefetch();

  return (
    <HydrateClient>
      <div className="mx-auto w-full max-w-360 px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Browse jobs
          </h1>
          <p className="text-muted-foreground mt-1">
            Find your next role — filters sync to the URL so you can share any
            search.
          </p>
        </header>
        <Suspense
          fallback={
            <div className="space-y-3 lg:ml-[calc(20%+2rem)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <JobsBrowser />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
