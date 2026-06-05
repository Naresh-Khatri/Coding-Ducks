/**
 * One-time Monaco loader configuration (side-effect on import).
 *
 * `@monaco-editor/react` loads Monaco from a CDN by default. We pin that CDN
 * build to the exact version of the bundled `monaco-editor` package, because
 * `y-monaco` and `monaco-vim` import a handful of runtime values from the
 * bundled copy (`monaco.Selection`, `KeyCode` enums, …) and apply them to the
 * editor the loader creates. Matching versions keeps those two copies in
 * lockstep so the shared enums/classes line up.
 */
// This module is a side-effect-only loader config; dynamic import would prevent it from running before Monaco mounts
import { loader } from "@monaco-editor/react";

// Keep in sync with the `monaco-editor` version in apps/web/package.json.
const MONACO_VERSION = "0.52.2";

loader.config({
  paths: { vs: `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs` },
});
