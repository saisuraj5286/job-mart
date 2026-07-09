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
