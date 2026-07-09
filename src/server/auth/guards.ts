import "server-only";

import { redirect } from "next/navigation";

import { validateRequest, type AuthUser } from "~/server/auth";

/**
 * Page-level RBAC guard: redirects to login when signed out, or to the
 * viewer's home when they have the wrong role.
 */
export async function requireRole(
  role: "seeker" | "employer",
  currentPath: string,
): Promise<AuthUser> {
  const { user } = await validateRequest();
  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
  }
  if (user.role !== role) {
    redirect(user.role === "employer" ? "/dashboard/jobs" : "/jobs");
  }
  return user;
}
