import { fileURLToPath } from "node:url";

import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

const monorepoRoot = fileURLToPath(new URL("../../", import.meta.url));

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  /** Required for Docker production builds */
  output: "standalone",

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@acme/api",
    "@acme/auth",
    "@acme/db",
    "@acme/ducklet-fs",
    "@acme/jobs",
    "@acme/machine-coding-content",
    "@acme/ui",
    "@acme/validators",
  ],

  /**
   * `@acme/machine-coding-content`'s loader reads problem source files off disk at
   * runtime, but they aren't import-traced into the standalone build. Trace them in
   * for the tRPC route that assembles workspaces. The root keeps their `packages/...`
   * path so they map to `/app/...` at runtime; the include key uses `**` because a
   * literal `[trpc]` key is parsed as a glob character class and matches nothing.
   */
  outputFileTracingRoot: monorepoRoot,
  outputFileTracingIncludes: {
    "/api/trpc/**": [
      "../../packages/machine-coding-content/src/problems/**/*",
    ],
  },

  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.codingducks.xyz",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  /**
   * WebContainers (the ducklet runtime) require the page to be
   * cross-origin isolated. We scope these headers to the pages that actually
   * boot a container — ducklet *rooms* (`/ducklets/<id>` and nested routes)
   * and the machine-coding *solve* page — and deliberately NOT to the list /
   * catalogue / detail pages, so the rest of the app is unaffected.
   *
   * COEP is `credentialless` rather than `require-corp` so cross-origin
   * subresources without a CORP header (Google/GitHub avatars, the CDN,
   * analytics) still load — they're just fetched without credentials.
   * `credentialless` is supported in Chromium and Firefox (desktop + mobile);
   * browsers that don't honor it (e.g. Safari) simply aren't cross-origin
   * isolated, so the workspace falls back to its read/edit/collaborate mode
   * (`runtimeEnabled={false}`) instead of booting a container.
   */
  async headers() {
    const isolation = [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
    ];
    return [
      // `:id+` is one-or-more segments, so `/ducklets` (list) is excluded
      // while `/ducklets/123` and `/ducklets/123/guest` are included.
      { source: "/ducklets/:id+", headers: isolation },
      // Each problem page (`/machine-coding/<slug>`) is the solve workspace and
      // boots a container; the catalogue (`/machine-coding`) has no `:slug`
      // segment and is intentionally excluded.
      { source: "/machine-coding/:slug", headers: isolation },
    ];
  },
};

export default config;
