import { z } from "zod";

/** Shared between the apply form (client) and the application router (server). */
export const applyInputSchema = z.object({
  jobId: z.string().uuid(),
  coverNote: z
    .string()
    .trim()
    .min(20, "Tell the employer a bit more — at least 20 characters")
    .max(2000, "Keep it under 2000 characters"),
  resumeUrl: z
    .string()
    .trim()
    .url("Enter a valid URL (e.g. a Google Drive or portfolio link)")
    .max(1024),
});

export type ApplyInput = z.infer<typeof applyInputSchema>;

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .max(1024)
  .optional()
  .or(z.literal("").transform(() => undefined));

/** Shared between the company form (client) and the company router (server). */
export const companyInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(255),
  website: optionalUrl,
  location: z.string().trim().max(255).optional(),
  logoUrl: optionalUrl,
  about: z
    .string()
    .trim()
    .max(2000, "Keep it under 2000 characters")
    .optional(),
});

export type CompanyInput = z.infer<typeof companyInputSchema>;

/** Shared between the job form (client) and the job router (server). */
export const jobInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(255),
    description: z
      .string()
      .trim()
      .min(50, "Describe the role in at least 50 characters")
      .max(20000),
    type: z.enum(["full_time", "part_time", "contract", "internship"]),
    workMode: z.enum(["remote", "hybrid", "onsite"]),
    location: z
      .string()
      .trim()
      .min(2, "Where is this role based?")
      .max(255),
    salaryMin: z.coerce.number().int().min(0).max(100_000_000).optional(),
    salaryMax: z.coerce.number().int().min(0).max(100_000_000).optional(),
    currency: z.string().trim().min(1).max(8),
    tags: z.array(z.string().trim().min(1).max(50)).max(8, "Up to 8 tags"),
    status: z.enum(["draft", "published"]),
  })
  .refine(
    (v) =>
      v.salaryMin == null || v.salaryMax == null || v.salaryMax >= v.salaryMin,
    {
      message: "Max salary must be at least the min salary",
      path: ["salaryMax"],
    },
  );

export type JobInput = z.infer<typeof jobInputSchema>;
