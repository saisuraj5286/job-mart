import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  /** Current viewer, or null when signed out — used by client components. */
  me: publicProcedure.query(({ ctx }) => ctx.user ?? null),
});
