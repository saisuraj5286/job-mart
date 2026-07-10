import Link from "next/link";
import { CompassIcon } from "lucide-react";

import { Button } from "~/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
      <CompassIcon className="text-muted-foreground size-12" />
      <h1 className="text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="text-muted-foreground max-w-sm">
        This page doesn&apos;t exist — maybe the job was closed or the link is
        outdated.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/jobs">Browse jobs</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
