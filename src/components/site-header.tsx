import Link from "next/link";
import { BriefcaseBusinessIcon } from "lucide-react";

import { validateRequest } from "~/server/auth";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import { UserMenu } from "~/components/user-menu";

export async function SiteHeader() {
  const { user } = await validateRequest();

  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <BriefcaseBusinessIcon className="size-4.5" />
            </span>
            <span className="text-lg tracking-tight">JobMart</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/jobs">Browse jobs</Link>
            </Button>
            {user?.role === "employer" && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/jobs">My job posts</Link>
              </Button>
            )}
            {user?.role === "seeker" && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/applications">My applications</Link>
              </Button>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
