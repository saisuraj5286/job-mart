import type { JobSort, JobType, WorkMode } from "~/lib/job-filters";

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

export const JOB_SORT_LABELS: Record<JobSort, string> = {
  newest: "Newest first",
  salary: "Salary: high to low",
};

export const APPLICATION_STATUS_LABELS = {
  pending: "Pending",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
} as const;

export const JOB_STATUS_LABELS = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
} as const;

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  CAD: "CA$",
};

const formatAmount = (value: number) =>
  value >= 1000 ? `${Math.round(value / 1000)}k` : String(value);

/**
 * "$150k – $190k" for annual salaries, "$45 – $60/hr" for hourly rates
 * (heuristic: amounts under 1000 are hourly).
 */
export function formatSalary(
  min: number | null,
  max: number | null,
  currency = "USD",
): string | null {
  if (min == null && max == null) return null;
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  const hourly = (min ?? max ?? 0) < 1000;
  const suffix = hourly ? "/hr" : "";
  if (min != null && max != null && min !== max) {
    return `${symbol}${formatAmount(min)} – ${symbol}${formatAmount(max)}${suffix}`;
  }
  return `${symbol}${formatAmount(min ?? max ?? 0)}${suffix}`;
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
