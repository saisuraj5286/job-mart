import { APPLICATION_STATUS_LABELS } from "~/lib/format";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";

type ApplicationStatus = keyof typeof APPLICATION_STATUS_LABELS;

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending:
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  reviewed:
    "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  shortlisted:
    "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  hired:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

export function ApplicationStatusBadge({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", STATUS_STYLES[status], className)}
    >
      {APPLICATION_STATUS_LABELS[status]}
    </Badge>
  );
}
