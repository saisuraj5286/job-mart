"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { applyInputSchema, type ApplyInput } from "~/lib/validators";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

interface ApplyCtaProps {
  jobId: string;
  jobSlug: string;
  jobTitle: string;
  companyName: string;
  viewer: "guest" | "seeker" | "employer";
  /** Whether the seeker already applied (resolved server-side). */
  initiallyApplied?: boolean;
  className?: string;
}

export function ApplyCta({
  jobId,
  jobSlug,
  jobTitle,
  companyName,
  viewer,
  initiallyApplied = false,
  className,
}: ApplyCtaProps) {
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState(initiallyApplied);

  const form = useForm<ApplyInput>({
    resolver: zodResolver(applyInputSchema),
    defaultValues: { jobId, coverNote: "", resumeUrl: "" },
  });

  const applyMutation = api.application.submit.useMutation({
    onSuccess: () => {
      setApplied(true);
      setOpen(false);
      toast.success("Application sent!", {
        description: `Your application for ${jobTitle} is on its way to ${companyName}.`,
      });
    },
    onError: (err) => {
      if (err.data?.code === "CONFLICT") {
        setApplied(true);
        setOpen(false);
      }
      toast.error(err.message);
    },
  });

  if (viewer === "guest") {
    return (
      <Button size="lg" className={className} asChild>
        <Link href={`/login?redirectTo=/jobs/${jobSlug}`}>Apply now</Link>
      </Button>
    );
  }

  if (viewer === "employer") {
    return (
      <Button size="lg" className={className} variant="secondary" disabled>
        Employers can&apos;t apply
      </Button>
    );
  }

  if (applied) {
    return (
      <Button size="lg" className={className} variant="secondary" disabled>
        <CheckIcon className="size-4" />
        Applied
      </Button>
    );
  }

  const coverNote = form.watch("coverNote");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className={className}>
          Apply now
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply to {jobTitle}</DialogTitle>
          <DialogDescription>
            {companyName} will see your note and resume link.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) =>
              applyMutation.mutate(values),
            )}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="coverNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Why are you a great fit for this role?"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="flex justify-between">
                    <span>A short, specific note goes a long way.</span>
                    <span>{coverNote.length}/2000</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resumeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resume link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://drive.google.com/…"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to your resume, portfolio, or LinkedIn.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={applyMutation.isPending}>
                {applyMutation.isPending && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                Submit application
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
