import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

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
    "@acme/ui",
    "@acme/validators",
  ],

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
   * `credentialless` is supported in Chromium and Firefox, which matches
   * WebContainers' desktop-only support; unsupported browsers hit the
   * desktop-only gate before any container boots.
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
