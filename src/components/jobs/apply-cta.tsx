"use client";

import Link from "next/link";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";

interface ApplyCtaProps {
  jobSlug: string;
  viewer: "guest" | "seeker" | "employer";
  className?: string;
}

/**
 * Apply call-to-action. The in-app apply dialog for seekers ships with the
 * seeker flows; until then seekers get a heads-up toast.
 */
export function ApplyCta({ jobSlug, viewer, className }: ApplyCtaProps) {
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

  return (
    <Button
      size="lg"
      className={className}
      onClick={() => toast.info("The apply flow is coming in the next update")}
    >
      Apply now
    </Button>
  );
}
