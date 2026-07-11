"use client";

import { XIcon } from "lucide-react";

import {
  JOB_TYPES,
  WORK_MODES,
  countActiveFilters,
  type JobFilters,
  type JobType,
  type WorkMode,
} from "~/lib/job-filters";
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from "~/lib/format";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";

const SALARY_OPTIONS = [
  { value: 0, label: "Any salary" },
  { value: 50_000, label: "$50k+" },
  { value: 80_000, label: "$80k+" },
  { value: 100_000, label: "$100k+" },
  { value: 130_000, label: "$130k+" },
  { value: 160_000, label: "$160k+" },
  { value: 200_000, label: "$200k+" },
];

interface JobFiltersPanelProps {
  filters: JobFilters;
  onChange: (partial: Partial<JobFilters>) => void;
  onClear: () => void;
}

function toggle<T>(list: T[] | undefined, value: T): T[] | undefined {
  const current = list ?? [];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
  return next.length ? next : undefined;
}

export function JobFiltersPanel({
  filters,
  onChange,
  onClear,
}: JobFiltersPanelProps) {
  const { data: popularTags } = api.job.popularTags.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const activeCount = countActiveFilters(filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground h-7 px-2 text-xs"
          >
            <XIcon className="size-3" />
            Clear all
          </Button>
        )}
      </div>

      <fieldset className="space-y-2.5">
        <legend className="mb-2 text-sm font-medium">Job type</legend>
        {JOB_TYPES.map((type) => (
          <Label
            key={type}
            className="flex cursor-pointer items-center gap-2 font-normal"
          >
            <Checkbox
              checked={filters.type?.includes(type) ?? false}
              onCheckedChange={() =>
                onChange({ type: toggle<JobType>(filters.type, type) })
              }
            />
            {JOB_TYPE_LABELS[type]}
          </Label>
        ))}
      </fieldset>

      <fieldset className="space-y-2.5">
        <legend className="mb-2 text-sm font-medium">Work mode</legend>
        {WORK_MODES.map((mode) => (
          <Label
            key={mode}
            className="flex cursor-pointer items-center gap-2 font-normal"
          >
            <Checkbox
              checked={filters.workMode?.includes(mode) ?? false}
              onCheckedChange={() =>
                onChange({
                  workMode: toggle<WorkMode>(filters.workMode, mode),
                })
              }
            />
            {WORK_MODE_LABELS[mode]}
          </Label>
        ))}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="filter-location" className="text-sm font-medium">
          Location
        </Label>
        <Input
          id="filter-location"
          placeholder="City, state, or 'remote'"
          defaultValue={filters.location ?? ""}
          key={filters.location ?? ""}
          onBlur={(e) =>
            onChange({ location: e.target.value.trim() || undefined })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter")
              onChange({
                location: e.currentTarget.value.trim() || undefined,
              });
          }}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Minimum salary (annual)</Label>
        <Select
          value={String(filters.salaryMin ?? 0)}
          onValueChange={(value) =>
            onChange({ salaryMin: Number(value) || undefined })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SALARY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {popularTags && popularTags.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Popular tags</Label>
          <div className="flex flex-wrap gap-1.5">
            {popularTags.map(({ tag }) => {
              const active = filters.tags?.includes(tag) ?? false;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onChange({ tags: toggle(filters.tags, tag) })}
                  aria-pressed={active}
                >
                  <Badge
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {tag}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
