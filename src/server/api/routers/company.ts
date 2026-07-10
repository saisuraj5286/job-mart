import { eq } from "drizzle-orm";

import { companyInputSchema } from "~/lib/validators";
import { createTRPCRouter, employerProcedure } from "~/server/api/trpc";
import { companies } from "~/server/db/schema";

export const companyRouter = createTRPCRouter({
  /** The signed-in employer's company profile, or null before setup. */
  mine: employerProcedure.query(({ ctx }) =>
    ctx.db.query.companies
      .findFirst({ where: eq(companies.ownerId, ctx.user.id) })
      .then((c) => c ?? null),
  ),

  upsert: employerProcedure
    .input(companyInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [company] = await ctx.db
        .insert(companies)
        .values({ ownerId: ctx.user.id, ...input })
        .onConflictDoUpdate({
          target: companies.ownerId,
          set: {
            name: input.name,
            website: input.website ?? null,
            location: input.location ?? null,
            logoUrl: input.logoUrl ?? null,
            about: input.about ?? null,
          },
        })
        .returning();
      return company!;
    }),
});
