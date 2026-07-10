import { type Metadata } from "next";
import Link from "next/link";
import {
  BriefcaseBusinessIcon,
  Building2Icon,
  EyeIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react";

import { timeAgo } from "~/lib/format";
import { requireRole } from "~/server/auth/guards";
import { JobRowActions } from "~/components/jobs/job-row-actions";
import { JobStatusBadge } from "~/components/jobs/job-status-badge";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "My job posts",
};

export default async function ManageJobsPage() {
  await requireRole("employer", "/dashboard/jobs");
  const company = await api.company.mine();

  if (!company) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <Building2Icon className="text-muted-foreground size-10" />
          <h1 className="text-lg font-semibold">Set up your company first</h1>
          <p className="text-muted-foreground max-w-sm text-sm">
            Candidates need to know who&apos;s hiring — create your company
            profile and you can start posting jobs right away.
          </p>
          <Button asChild>
            <Link href="/dashboard/company?next=/dashboard/jobs/new">
              Create company profile
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const jobs = await api.job.myJobs();
  const published = jobs.filter((j) => j.status === "published").length;
  const totalApplicants = jobs.reduce((sum, j) => sum + j.applicantCount, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            My job posts
          </h1>
          <p className="text-muted-foreground mt-1">
            {jobs.length > 0
              ? `${published} live · ${jobs.length} total · ${totalApplicants} applicant${totalApplicants === 1 ? "" : "s"}`
              : `Posting as ${company.name}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jobs/new">
            <PlusIcon className="size-4" />
            Post a job
          </Link>
        </Button>
      </header>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <BriefcaseBusinessIcon className="text-muted-foreground size-10" />
          <h2 className="font-semibold">No jobs posted yet</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            Post your first job and applicants will show up in your pipeline.
          </p>
          <Button asChild>
            <Link href="/dashboard/jobs/new">
              <PlusIcon className="size-4" />
              Post your first job
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead className="max-sm:hidden">Views</TableHead>
                <TableHead className="max-md:hidden">Posted</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/jobs/${job.id}/edit`}
                      className="hover:text-primary font-medium transition-colors"
                    >
                      {job.title}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {job.location}
                    </p>
                  </TableCell>
                  <TableCell>
                    <JobStatusBadge status={job.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2"
                      asChild
                    >
                      <Link href={`/dashboard/jobs/${job.id}/applicants`}>
                        <UsersIcon className="size-3.5" />
                        {job.applicantCount}
                      </Link>
                    </Button>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-sm:hidden">
                    <span className="flex items-center gap-1.5">
                      <EyeIcon className="size-3.5" />
                      {job.views}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-md:hidden">
                    {timeAgo(job.createdAt)}
                  </TableCell>
                  <TableCell>
                    <JobRowActions job={job} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
