import { JOB_STATUS_LABELS } from "~/lib/format";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";

type JobStatus = keyof typeof JOB_STATUS_LABELS;

const STATUS_STYLES: Record<JobStatus, string> = {
  draft:
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  published:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};

export function JobStatusBadge({
  status,
  className,
}: {
  status: JobStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", STATUS_STYLES[status], className)}
    >
      {JOB_STATUS_LABELS[status]}
    </Badge>
  );
}
