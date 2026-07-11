import Link from "next/link";
import { ClockIcon, MapPinIcon } from "lucide-react";

import {
  EXPERIENCE_LABELS,
  formatSalary,
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
  timeAgo,
} from "~/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import type { RouterOutputs } from "~/trpc/react";

export type JobListItem = RouterOutputs["job"]["list"]["items"][number];

const MAX_VISIBLE_TAGS = 4;

export function JobCard({
  job,
  actions,
}: {
  job: JobListItem;
  actions?: React.ReactNode;
}) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);

  return (
    <Card className="hover:ring-foreground/20 relative py-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex gap-4 p-5">
        <Avatar className="mt-0.5 size-12 rounded-lg">
          <AvatarImage
            src={job.company.logoUrl ?? undefined}
            alt={job.company.name}
          />
          <AvatarFallback className="bg-primary/10 text-primary rounded-lg text-base font-semibold">
            {job.company.name[0]}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold">
                <Link
                  href={`/jobs/${job.slug}`}
                  className="hover:text-primary transition-colors after:absolute after:inset-0"
                >
                  {job.title}
                </Link>
              </h3>
              <p className="text-muted-foreground truncate text-sm">
                {job.company.name}
              </p>
            </div>
            {actions && <div className="relative z-10 shrink-0">{actions}</div>}
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1">
              <MapPinIcon className="size-3.5" />
              {job.location}
            </span>
            {salary && (
              <span className="text-foreground font-medium">{salary}</span>
            )}
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3.5" />
              {timeAgo(job.createdAt)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{JOB_TYPE_LABELS[job.type]}</Badge>
            <Badge variant="secondary">{WORK_MODE_LABELS[job.workMode]}</Badge>
            <Badge variant="secondary">{EXPERIENCE_LABELS[job.experience]}</Badge>
            {job.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
            {job.tags.length > MAX_VISIBLE_TAGS && (
              <span className="text-muted-foreground text-xs">
                +{job.tags.length - MAX_VISIBLE_TAGS}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function JobCardSkeleton() {
  return (
    <Card className="py-0">
      <CardContent className="flex gap-4 p-5">
        <div className="bg-muted size-12 animate-pulse rounded-lg" />
        <div className="flex-1 space-y-3">
          <div className="bg-muted h-4 w-2/5 animate-pulse rounded" />
          <div className="bg-muted h-3 w-1/4 animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="bg-muted h-5 w-16 animate-pulse rounded-full" />
            <div className="bg-muted h-5 w-16 animate-pulse rounded-full" />
            <div className="bg-muted h-5 w-14 animate-pulse rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
