import Link from "next/link";
import { BriefcaseBusinessIcon } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex w-full max-w-360 flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <BriefcaseBusinessIcon className="size-4" />
          <span>JobMart — find your next role, or your next hire.</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/jobs"
            className="hover:text-foreground transition-colors"
          >
            Browse jobs
          </Link>
          <Link
            href="/signup"
            className="hover:text-foreground transition-colors"
          >
            Post a job
          </Link>
        </nav>
      </div>
    </footer>
  );
}
