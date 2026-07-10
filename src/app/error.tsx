"use client";

import { useEffect } from "react";
import { TriangleAlertIcon } from "lucide-react";

import { Button } from "~/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
      <TriangleAlertIcon className="text-destructive size-12" />
      <h1 className="text-3xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-muted-foreground max-w-sm">
        An unexpected error occurred. It&apos;s been logged — try again, and if
        it keeps happening, refresh the page.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
