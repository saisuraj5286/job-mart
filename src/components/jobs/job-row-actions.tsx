"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleCheckIcon,
  CircleOffIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { api } from "~/trpc/react";

interface JobRowActionsProps {
  job: {
    id: string;
    slug: string;
    title: string;
    status: "draft" | "published" | "closed";
    applicantCount: number;
  };
}

export function JobRowActions({ job }: JobRowActionsProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setStatusMutation = api.job.setStatus.useMutation({
    onSuccess: (updated) => {
      toast.success(
        updated.status === "published"
          ? "Job published — it's live!"
          : updated.status === "closed"
            ? "Job closed — no longer accepting applications"
            : "Job moved to drafts",
      );
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = api.job.delete.useMutation({
    onSuccess: () => {
      toast.success("Job deleted");
      setConfirmDelete(false);
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${job.title}`}>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/jobs/${job.id}/edit`}>
              <PencilIcon />
              Edit
            </Link>
          </DropdownMenuItem>
          {job.status === "published" && (
            <DropdownMenuItem asChild>
              <Link href={`/jobs/${job.slug}`} target="_blank">
                <ExternalLinkIcon />
                View public page
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {job.status !== "published" ? (
            <DropdownMenuItem
              onSelect={() =>
                setStatusMutation.mutate({ id: job.id, status: "published" })
              }
            >
              <CircleCheckIcon />
              {job.status === "closed" ? "Reopen" : "Publish"}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() =>
                setStatusMutation.mutate({ id: job.id, status: "closed" })
              }
            >
              <CircleOffIcon />
              Close applications
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmDelete(true)}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{job.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the job
              {job.applicantCount > 0
                ? ` and its ${job.applicantCount} application${job.applicantCount === 1 ? "" : "s"}`
                : ""}
              . This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate({ id: job.id });
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete job"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
