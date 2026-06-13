import { defineConfig } from "eslint/config";

import { baseConfig } from "@acme/eslint-config/base";

export default defineConfig(
  {
    // Problem source assets (real .tsx/.vue/.svelte/.test files) are loaded as
    // raw text, not compiled here — they reference deps installed only in the
    // learner's workspace, so linting them in this package is noise.
    ignores: [
      "dist/**",
      "src/problems/*/*/starter/**",
      "src/problems/*/*/solution/**",
      "src/problems/*/*/test/**",
    ],
  },
  baseConfig,
);
