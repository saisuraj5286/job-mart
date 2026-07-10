import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { requireRole } from "~/server/auth/guards";
import { JobForm } from "~/components/jobs/job-form";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Post a job",
};

export default async function NewJobPage() {
  await requireRole("employer", "/dashboard/jobs/new");
  const company = await api.company.mine();
  if (!company) {
    // company profile gates job posting
    redirect("/dashboard/company?next=/dashboard/jobs/new");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Post a job
        </h1>
        <p className="text-muted-foreground mt-1">
          Posting as {company.name}. Publish now or save a draft.
        </p>
      </header>
      <Card>
        <CardContent className="p-6">
          <JobForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
