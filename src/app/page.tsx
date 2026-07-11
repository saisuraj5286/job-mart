import Link from "next/link";
import {
  ArrowRightIcon,
  BriefcaseBusinessIcon,
  Building2Icon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";

import { JobCard } from "~/components/jobs/job-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/server";

export default async function Home() {
  const [stats, latest, popularTags] = await Promise.all([
    api.job.stats(),
    api.job.list({ sort: "newest", limit: 6 }),
    api.job.popularTags(),
  ]);

  return (
    <>
      {/* hero */}
      <section className="border-b">
        <div className="mx-auto w-full max-w-360 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto w-full max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              <SparklesIcon className="size-3" />
              {stats.jobs} open roles right now
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Find a job you&apos;ll{" "}
              <span className="text-primary">actually love</span>
            </h1>
            <p className="text-muted-foreground mt-4 text-lg text-balance">
              Search {stats.jobs} openings from {stats.companies} companies —
              remote, hybrid, and on-site roles across every craft.
            </p>

            <form
              action="/jobs"
              method="get"
              className="mx-auto mt-8 flex w-full max-w-xl gap-2"
            >
              <div className="relative flex-1">
                <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  name="q"
                  placeholder="Try 'react', 'designer', or a company…"
                  className="h-11 pl-9"
                  aria-label="Search jobs"
                />
              </div>
              <Button type="submit" size="lg" className="h-11">
                Search
              </Button>
            </form>

            {popularTags.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-muted-foreground text-sm">Popular:</span>
                {popularTags.slice(0, 6).map(({ tag }) => (
                  <Link key={tag} href={`/jobs?tags=${encodeURIComponent(tag)}`}>
                    <Badge
                      variant="outline"
                      className="hover:bg-muted cursor-pointer transition-colors"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* latest jobs */}
      <section className="mx-auto w-full max-w-360 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Latest openings
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Fresh roles, posted this week
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/jobs">
              View all
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {latest.items.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>

      {/* dual CTA */}
      <section className="border-t">
        <div className="mx-auto grid w-full max-w-360 gap-6 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
          <div className="bg-muted/40 rounded-xl border p-8">
            <SearchIcon className="text-primary mb-3 size-8" />
            <h3 className="text-lg font-semibold">Looking for work?</h3>
            <p className="text-muted-foreground mt-1 mb-4 text-sm">
              Create a free account to apply in one click, track your
              applications, and save jobs for later.
            </p>
            <Button asChild>
              <Link href="/signup">Create seeker account</Link>
            </Button>
          </div>
          <div className="bg-muted/40 rounded-xl border p-8">
            <Building2Icon className="text-primary mb-3 size-8" />
            <h3 className="text-lg font-semibold">Hiring talent?</h3>
            <p className="text-muted-foreground mt-1 mb-4 text-sm">
              Post jobs in minutes, review applicants in a simple pipeline, and
              reach {stats.jobs > 0 ? "thousands of" : ""} candidates.
            </p>
            <Button variant="outline" asChild>
              <Link href="/signup">
                <BriefcaseBusinessIcon className="size-4" />
                Post a job
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
