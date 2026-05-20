import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    POSTGRES_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    PORT: z.coerce.number().int().positive().default(5000),
    NODE_ENV: z.enum(["development", "production", "test"]).optional(),
    ALLOWED_WS_ORIGINS: z.string().optional(),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
