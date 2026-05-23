import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    JUDGE_API_URL: z
      .string()
      .url()
      .default("https://judge.codingducks.xyz/api/v1"),
    JUDGE_API_TOKEN: z.string().min(1),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
