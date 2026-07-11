"use client";

import { useState } from "react";
import { ExternalLinkIcon, InboxIcon } from "lucide-react";
import { toast } from "sonner";

import { APPLICATION_STATUS_LABELS, timeAgo } from "~/lib/format";
import { cn } from "~/lib/utils";
import { ApplicationStatusBadge } from "~/components/applications/status-badge";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";

type ApplicationStatus = keyof typeof APPLICATION_STATUS_LABELS;

const STATUS_ORDER: ApplicationStatus[] = [
  "pending",
  "reviewed",
  "shortlisted",
  "rejected",
  "hired",
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function CoverNote({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 220;
  return (
    <div>
      <p
        className={cn(
          "text-sm whitespace-pre-line",
          !expanded && isLong && "line-clamp-3",
        )}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-primary mt-1 text-xs hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export function ApplicantsList({ jobId }: { jobId: string }) {
  const utils = api.useUtils();
  const { data: applicants, isLoading } = api.application.byJob.useQuery({
    jobId,
  });
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "all",
  );

  const updateStatusMutation = api.application.updateStatus.useMutation({
    onMutate: async ({ applicationId, status }) => {
      await utils.application.byJob.cancel({ jobId });
      const previous = utils.application.byJob.getData({ jobId });
      utils.application.byJob.setData({ jobId }, (old) =>
        old?.map((a) => (a.id === applicationId ? { ...a, status } : a)),
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      utils.application.byJob.setData({ jobId }, context?.previous);
      toast.error(err.message);
    },
    onSuccess: (updated) => {
      toast.success(`Moved to ${APPLICATION_STATUS_LABELS[updated.status]}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="py-0">
            <CardContent className="space-y-3 p-5">
              <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
              <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
              <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!applicants || applicants.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
        <InboxIcon className="text-muted-foreground size-10" />
        <h2 className="font-semibold">No applicants yet</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          Applications will land here as candidates apply. Share the public job
          link to get the word out.
        </p>
      </div>
    );
  }

  const counts = applicants.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});
  const visible =
    statusFilter === "all"
      ? applicants
      : applicants.filter((a) => a.status === statusFilter);

  return (
    <div className="space-y-4">
      {/* status summary chips (click to filter) */}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setStatusFilter("all")}>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              statusFilter === "all"
                ? "bg-primary text-primary-foreground border-transparent"
                : "hover:bg-muted",
            )}
          >
            All · {applicants.length}
          </span>
        </button>
        {STATUS_ORDER.filter((s) => counts[s]).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() =>
              setStatusFilter(statusFilter === status ? "all" : status)
            }
            aria-pressed={statusFilter === status}
            className={cn(
              "rounded-full transition-opacity",
              statusFilter !== "all" && statusFilter !== status && "opacity-50",
            )}
          >
            <ApplicationStatusBadge
              status={status}
              className="cursor-pointer px-2.5 py-1"
            />
            <span className="sr-only">filter</span>
            <span className="text-muted-foreground ml-1 text-xs">
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((applicant) => (
          <Card key={applicant.id} className="py-0">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {initials(applicant.seeker.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {applicant.seeker.name}
                    </p>
                    <p className="text-muted-foreground truncate text-sm">
                      {applicant.seeker.email} · applied{" "}
                      {timeAgo(applicant.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={applicant.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Resume
                      <ExternalLinkIcon className="size-3.5" />
                    </a>
                  </Button>
                  <Select
                    value={applicant.status}
                    onValueChange={(status) =>
                      updateStatusMutation.mutate({
                        applicationId: applicant.id,
                        status: status as ApplicationStatus,
                      })
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-36"
                      aria-label={`Status for ${applicant.seeker.name}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_ORDER.map((status) => (
                        <SelectItem key={status} value={status}>
                          {APPLICATION_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="bg-muted/40 mt-4 rounded-lg border p-3">
                <CoverNote text={applicant.coverNote} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
