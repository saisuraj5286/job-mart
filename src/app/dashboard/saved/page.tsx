import { type Metadata } from "next";

import { requireRole } from "~/server/auth/guards";
import { SavedJobsList } from "~/components/jobs/saved-jobs-list";
import { api, HydrateClient } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Saved jobs",
};

export default async function SavedJobsPage() {
  await requireRole("seeker", "/dashboard/saved");
  void api.savedJob.list.prefetch();
  void api.savedJob.ids.prefetch();

  return (
    <HydrateClient>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Saved jobs
          </h1>
          <p className="text-muted-foreground mt-1">
            Roles you bookmarked while browsing.
          </p>
        </header>
        <SavedJobsList />
      </div>
    </HydrateClient>
  );
}
