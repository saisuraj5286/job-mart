import { cache } from "react";
import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import {
  BriefcaseBusinessIcon,
  ClockIcon,
  EyeIcon,
  GlobeIcon,
  MapPinIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import {
  formatSalary,
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
  timeAgo,
} from "~/lib/format";
import { validateRequest } from "~/server/auth";
import { ApplyCta } from "~/components/jobs/apply-cta";
import { JobCard } from "~/components/jobs/job-card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { api } from "~/trpc/server";

const getJob = cache(async (slug: string) => {
  try {
    return await api.job.bySlug({ slug });
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") return null;
    throw err;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return { title: "Job not found" };
  return {
    title: `${job.title} at ${job.company.name}`,
    description: `${JOB_TYPE_LABELS[job.type]} · ${WORK_MODE_LABELS[job.workMode]} · ${job.location}. Apply for ${job.title} at ${job.company.name} on JobMart.`,
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  const [{ user }, similar] = await Promise.all([
    validateRequest(),
    api.job.similar({ jobId: job.id }),
  ]);
  const viewer = user ? user.role : "guest";
  const existingApplication =
    viewer === "seeker"
      ? await api.application.statusForJob({ jobId: job.id })
      : null;
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);

  const applyCtaProps = {
    jobId: job.id,
    jobSlug: job.slug,
    jobTitle: job.title,
    companyName: job.company.name,
    viewer,
    initiallyApplied: !!existingApplication,
  } as const;

  return (
    <div className="w-full px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_25%]">
        {/* main column */}
        <article className="min-w-0">
          <header className="mb-6">
            <div className="mb-4 flex items-center gap-3">
              <Avatar className="size-14 rounded-xl">
                <AvatarImage
                  src={job.company.logoUrl ?? undefined}
                  alt={job.company.name}
                />
                <AvatarFallback className="bg-primary/10 text-primary rounded-xl text-lg font-semibold">
                  {job.company.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {job.title}
                </h1>
                <p className="text-muted-foreground">{job.company.name}</p>
              </div>
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-4" /> {job.location}
              </span>
              {salary && (
                <span className="text-foreground font-semibold">{salary}</span>
              )}
              <span className="flex items-center gap-1">
                <ClockIcon className="size-4" /> Posted {timeAgo(job.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <EyeIcon className="size-4" /> {job.views + 1} views
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge>{JOB_TYPE_LABELS[job.type]}</Badge>
              <Badge variant="secondary">
                {WORK_MODE_LABELS[job.workMode]}
              </Badge>
              {job.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </header>

          <Separator className="mb-6" />

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown>{job.description}</ReactMarkdown>
          </div>
        </article>

        {/* sidebar */}
        <aside className="space-y-4">
          <div className="lg:sticky lg:top-24 space-y-4">
            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="space-y-1">
                  {salary && (
                    <p className="text-xl font-semibold">{salary}</p>
                  )}
                  <p className="text-muted-foreground text-sm">
                    {JOB_TYPE_LABELS[job.type]} ·{" "}
                    {WORK_MODE_LABELS[job.workMode]} · {job.location}
                  </p>
                </div>
                <ApplyCta {...applyCtaProps} className="w-full" />
                <p className="text-muted-foreground text-xs">
                  Applications include a short cover note and a resume link.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <BriefcaseBusinessIcon className="size-4" />
                  About {job.company.name}
                </h2>
                {job.company.about && (
                  <p className="text-muted-foreground line-clamp-5 text-sm">
                    {job.company.about}
                  </p>
                )}
                <div className="text-muted-foreground space-y-1.5 text-sm">
                  {job.company.location && (
                    <p className="flex items-center gap-1.5">
                      <MapPinIcon className="size-3.5" />
                      {job.company.location}
                    </p>
                  )}
                  {job.company.website && (
                    <a
                      href={job.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary flex items-center gap-1.5 hover:underline"
                    >
                      <GlobeIcon className="size-3.5" />
                      Visit website
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      {/* similar jobs */}
      {similar.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Similar jobs</h2>
            <Link
              href="/jobs"
              className="text-primary text-sm hover:underline"
            >
              Browse all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {similar.map((s) => (
              <JobCard key={s.id} job={s} />
            ))}
          </div>
        </section>
      )}

      {/* mobile sticky apply bar */}
      <div className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t p-3 backdrop-blur-md lg:hidden">
        <div className="flex w-full items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{job.title}</p>
            {salary && (
              <p className="text-muted-foreground text-xs">{salary}</p>
            )}
          </div>
          <ApplyCta {...applyCtaProps} />
        </div>
      </div>
      <div className="h-16 lg:hidden" />
    </div>
  );
}
