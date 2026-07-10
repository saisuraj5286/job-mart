import { type Config } from "drizzle-kit";

import { env } from "~/env";

if (!env.DIRECT_URL) {
  throw new Error("DIRECT_URL must be set to run drizzle-kit");
}

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // migrations need the direct (non-pooled) connection
    url: env.DIRECT_URL,
  },
  tablesFilter: ["job-mart_*"],
} satisfies Config;
