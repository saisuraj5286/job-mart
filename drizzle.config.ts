import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // migrations need the direct (non-pooled) connection
    url: env.DIRECT_URL,
  },
  tablesFilter: ["job-mart_*"],
} satisfies Config;
