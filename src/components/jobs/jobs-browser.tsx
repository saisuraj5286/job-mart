"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Loader2Icon,
  SearchIcon,
  SearchXIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";

import {
  countActiveFilters,
  parseJobFilters,
  serializeJobFilters,
  type JobFilters,
} from "~/lib/job-filters";
import {
  JOB_SORT_LABELS,
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
} from "~/lib/format";
import { JobCard, JobCardSkeleton } from "~/components/jobs/job-card";
import { JobFiltersPanel } from "~/components/jobs/job-filters-panel";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { api } from "~/trpc/react";

export function JobsBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseJobFilters(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );

  const updateFilters = (partial: Partial<JobFilters>) => {
    const qs = serializeJobFilters({ ...filters, ...partial });
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const clearFilters = () => router.replace(pathname, { scroll: false });

  // debounced keyword search synced with the URL
  const [search, setSearch] = useState(filters.q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const filtersQ = filters.q ?? "";
  useEffect(() => setSearch(filtersQ), [filtersQ]);
  const onSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => updateFilters({ q: value.trim() || undefined }),
      350,
    );
  };

  const query = api.job.list.useInfiniteQuery(filters, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const jobs = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const activeCount = countActiveFilters(filters);

  const pills: { label: string; onRemove: () => void }[] = [
    ...(filters.q
      ? [{ label: `"${filters.q}"`, onRemove: () => updateFilters({ q: undefined }) }]
      : []),
    ...(filters.type ?? []).map((t) => ({
      label: JOB_TYPE_LABELS[t],
      onRemove: () =>
        updateFilters({
          type: filters.type?.filter((v) => v !== t).length
            ? filters.type?.filter((v) => v !== t)
            : undefined,
        }),
    })),
    ...(filters.workMode ?? []).map((m) => ({
      label: WORK_MODE_LABELS[m],
      onRemove: () =>
        updateFilters({
          workMode: filters.workMode?.filter((v) => v !== m).length
            ? filters.workMode?.filter((v) => v !== m)
            : undefined,
        }),
    })),
    ...(filters.location
      ? [
          {
            label: filters.location,
            onRemove: () => updateFilters({ location: undefined }),
          },
        ]
      : []),
    ...(filters.salaryMin
      ? [
          {
            label: `$${Math.round(filters.salaryMin / 1000)}k+`,
            onRemove: () => updateFilters({ salaryMin: undefined }),
          },
        ]
      : []),
    ...(filters.tags ?? []).map((tag) => ({
      label: `#${tag}`,
      onRemove: () =>
        updateFilters({
          tags: filters.tags?.filter((v) => v !== tag).length
            ? filters.tags?.filter((v) => v !== tag)
            : undefined,
        }),
    })),
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      {/* desktop filter sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <JobFiltersPanel
            filters={filters}
            onChange={updateFilters}
            onClear={clearFilters}
          />
        </div>
      </aside>

      <div className="min-w-0 space-y-4">
        {/* search + sort row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by title, company, or skill…"
              className="pl-9"
              aria-label="Search jobs"
            />
          </div>
          <Select
            value={filters.sort}
            onValueChange={(sort) =>
              updateFilters({ sort: sort as JobFilters["sort"] })
            }
          >
            <SelectTrigger className="w-44 shrink-0 max-sm:hidden">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(JOB_SORT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* mobile filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <SlidersHorizontalIcon className="size-4" />
                <span className="max-sm:hidden">Filters</span>
                {activeCount > 0 && (
                  <Badge className="size-5 justify-center rounded-full p-0">
                    {activeCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="sr-only">Filters</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-8">
                <JobFiltersPanel
                  filters={filters}
                  onChange={updateFilters}
                  onClear={clearFilters}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* active filter pills */}
        {pills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {pills.map((pill) => (
              <Badge key={pill.label} variant="secondary" className="gap-1 pr-1">
                {pill.label}
                <button
                  type="button"
                  onClick={pill.onRemove}
                  aria-label={`Remove filter ${pill.label}`}
                  className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* result count */}
        {query.isSuccess && (
          <p className="text-muted-foreground text-sm" role="status">
            {total} {total === 1 ? "job" : "jobs"} found
          </p>
        )}

        {/* results */}
        {query.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
            <SearchXIcon className="text-muted-foreground size-10" />
            <h3 className="font-semibold">No jobs match your search</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              Try different keywords or remove some filters to see more
              opportunities.
            </p>
            {activeCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            {query.hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => void query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                >
                  {query.isFetchingNextPage && (
                    <Loader2Icon className="size-4 animate-spin" />
                  )}
                  Load more jobs
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
