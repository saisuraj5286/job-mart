import { z } from "zod";

export const JOB_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
] as const;

export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;

export const JOB_SORTS = ["newest", "salary"] as const;

export type JobType = (typeof JOB_TYPES)[number];
export type WorkMode = (typeof WORK_MODES)[number];
export type JobSort = (typeof JOB_SORTS)[number];

export const jobFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  type: z.array(z.enum(JOB_TYPES)).optional(),
  workMode: z.array(z.enum(WORK_MODES)).optional(),
  location: z.string().trim().max(200).optional(),
  salaryMin: z.coerce.number().int().min(0).max(10_000_000).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
  sort: z.enum(JOB_SORTS).default("newest"),
});

export type JobFilters = z.infer<typeof jobFiltersSchema>;

const splitParam = (value: string | undefined) =>
  value
    ? value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : undefined;

/** Parse URL search params (`?type=full_time,contract&tags=react`) into filters. */
export function parseJobFilters(
  params: Record<string, string | undefined>,
): JobFilters {
  const parsed = jobFiltersSchema.safeParse({
    q: params.q ?? undefined,
    type: splitParam(params.type),
    workMode: splitParam(params.workMode),
    location: params.location ?? undefined,
    salaryMin: params.salaryMin ?? undefined,
    tags: splitParam(params.tags),
    sort: params.sort ?? "newest",
  });
  return parsed.success ? parsed.data : { sort: "newest" };
}

/** Serialize filters back into URL search params. Empty/default values are omitted. */
export function serializeJobFilters(filters: JobFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type?.length) params.set("type", filters.type.join(","));
  if (filters.workMode?.length)
    params.set("workMode", filters.workMode.join(","));
  if (filters.location) params.set("location", filters.location);
  if (filters.salaryMin) params.set("salaryMin", String(filters.salaryMin));
  if (filters.tags?.length) params.set("tags", filters.tags.join(","));
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  return params.toString();
}

export function countActiveFilters(filters: JobFilters): number {
  return [
    filters.q,
    filters.type?.length,
    filters.workMode?.length,
    filters.location,
    filters.salaryMin,
    filters.tags?.length,
  ].filter(Boolean).length;
}
