"use client";

import { useRouter } from "next/navigation";
import { BookmarkIcon } from "lucide-react";
import { toast } from "sonner";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

interface SaveJobButtonProps {
  jobId: string;
  jobSlug: string;
  viewer: "guest" | "seeker" | "employer";
}

/** Optimistic bookmark toggle shown on job cards for seekers (and guests → login). */
export function SaveJobButton({ jobId, jobSlug, viewer }: SaveJobButtonProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: savedIds } = api.savedJob.ids.useQuery(undefined, {
    enabled: viewer === "seeker",
    staleTime: 30 * 1000,
  });
  const saved = savedIds?.includes(jobId) ?? false;

  const toggleMutation = api.savedJob.toggle.useMutation({
    onMutate: async () => {
      await utils.savedJob.ids.cancel();
      const previous = utils.savedJob.ids.getData();
      utils.savedJob.ids.setData(undefined, (old) =>
        old?.includes(jobId)
          ? old.filter((id) => id !== jobId)
          : [...(old ?? []), jobId],
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      utils.savedJob.ids.setData(undefined, context?.previous);
      toast.error(err.message);
    },
    onSuccess: ({ saved: nowSaved }) => {
      toast.success(nowSaved ? "Job saved" : "Removed from saved jobs");
      void utils.savedJob.list.invalidate();
    },
  });

  if (viewer === "employer") return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={saved ? "Remove from saved jobs" : "Save job"}
      aria-pressed={saved}
      onClick={() => {
        if (viewer === "guest") {
          router.push(`/login?redirectTo=/jobs/${jobSlug}`);
          return;
        }
        toggleMutation.mutate({ jobId });
      }}
    >
      <BookmarkIcon
        className={cn(
          "size-4.5 transition-colors",
          saved && "fill-primary text-primary",
        )}
      />
    </Button>
  );
}
