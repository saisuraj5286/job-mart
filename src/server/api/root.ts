import { applicationRouter } from "~/server/api/routers/application";
import { authRouter } from "~/server/api/routers/auth";
import { companyRouter } from "~/server/api/routers/company";
import { jobRouter } from "~/server/api/routers/job";
import { savedJobRouter } from "~/server/api/routers/saved-job";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  job: jobRouter,
  application: applicationRouter,
  savedJob: savedJobRouter,
  company: companyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
