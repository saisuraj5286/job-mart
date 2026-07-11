import { type Metadata } from "next";
import Link from "next/link";
import { FileTextIcon } from "lucide-react";

import { timeAgo } from "~/lib/format";
import { requireRole } from "~/server/auth/guards";
import { ApplicationStatusBadge } from "~/components/applications/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
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
  title: "My applications",
};

export default async function ApplicationsPage() {
  await requireRole("seeker", "/dashboard/applications");
  const applications = await api.application.myApplications();

  return (
    <div className="mx-auto w-full max-w-360 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          My applications
        </h1>
        <p className="text-muted-foreground mt-1">
          {applications.length > 0
            ? `You've applied to ${applications.length} ${applications.length === 1 ? "job" : "jobs"} — statuses update as employers review.`
            : "Track every application and its status here."}
        </p>
      </header>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <FileTextIcon className="text-muted-foreground size-10" />
          <h2 className="font-semibold">No applications yet</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            When you apply to a job, it shows up here with its live status.
          </p>
          <Button asChild>
            <Link href="/jobs">Browse jobs</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead className="max-md:hidden">Company</TableHead>
                <TableHead className="max-sm:hidden">Applied</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Link
                      href={`/jobs/${app.job.slug}`}
                      className="hover:text-primary font-medium transition-colors"
                    >
                      {app.job.title}
                    </Link>
                    {app.job.status !== "published" && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        (no longer open)
                      </span>
                    )}
                    <p className="text-muted-foreground text-sm md:hidden">
                      {app.job.company.name}
                    </p>
                  </TableCell>
                  <TableCell className="max-md:hidden">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6 rounded-md">
                        <AvatarImage
                          src={app.job.company.logoUrl ?? undefined}
                          alt={app.job.company.name}
                        />
                        <AvatarFallback className="rounded-md text-xs">
                          {app.job.company.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {app.job.company.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-sm:hidden">
                    {timeAgo(app.createdAt)}
                  </TableCell>
                  <TableCell>
                    <ApplicationStatusBadge status={app.status} />
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
