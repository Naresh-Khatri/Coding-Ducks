"use client";

import { useEffect } from "react";
import type { Monaco } from "@monaco-editor/react";
import type { WebContainer } from "@webcontainer/api";

/**
 * Feeds the editor's TypeScript service the *real* type declarations from the
 * ducklet's installed `node_modules`, instead of guessing them from a CDN.
 *
 * The WebContainer runs a genuine `npm install`, so once it finishes the exact
 * `.d.ts` for every dependency (matching versions, the Next types, the project's
 * own transitive deps) sit on its in-memory filesystem. We mirror those into
 * Monaco under `file:///node_modules/...` URIs — the same scheme the file models
 * use — so module resolution in the editor matches what actually compiles. No
 * network round-trip, no version drift, and the transient "Cannot find module"
 * noise disappears for good once install completes.
 */

// `.d.ts`, `.d.mts`, `.d.cts`.
const TYPE_FILE = /\.d\.[cm]?ts$/;

// Hard ceiling on how much we mirror into the worker so a pathological
// dependency tree can't bloat its memory. Roughly the flattened type surface of
// a large app (Next + React + @types/node). If we hit it we log what was
// dropped rather than silently truncating.
const MAX_TOTAL_BYTES = 24 * 1024 * 1024;

// npm writes this once `npm install` finishes. A change to its contents is our
// signal that node_modules is ready (or was just re-installed) and we re-mirror.
const INSTALL_SENTINEL = "node_modules/.package-lock.json";

const POLL_MS = 2000;

interface ExtraLib {
  content: string;
  filePath: string;
}

interface SyncResult {
  libs: ExtraLib[];
  bytes: number;
  truncated: boolean;
}

/** `readdir` with file types, returning null instead of throwing on ENOENT. */
async function readDir(container: WebContainer, path: string) {
  try {
    return await container.fs.readdir(path, { withFileTypes: true });
  } catch {
    return null;
  }
}

/**
 * Recursively collect declaration files + package manifests under one package
 * directory. Nested `node_modules` are skipped: npm hoists, so top-level
 * packages already cover the resolvable surface, and descending into nested
 * trees explodes the file count for no resolution benefit.
 */
async function collectFromPackage(
  container: WebContainer,
  dir: string,
  out: SyncResult,
): Promise<void> {
  if (out.bytes >= MAX_TOTAL_BYTES) {
    out.truncated = true;
    return;
  }
  const entries = await readDir(container, dir);
  if (!entries) return;

  for (const entry of entries) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      await collectFromPackage(container, path, out);
    } else if (TYPE_FILE.test(entry.name) || entry.name === "package.json") {
      // package.json is needed alongside the `.d.ts`: the resolver reads its
      // `types`/`typings`/`exports` to map a bare specifier to its entry file.
      if (out.bytes >= MAX_TOTAL_BYTES) {
        out.truncated = true;
        return;
      }
      try {
        const content = await container.fs.readFile(path, "utf-8");
        out.bytes += content.length;
        out.libs.push({ content, filePath: `file:///${path}` });
      } catch {
        // Vanished mid-walk or unreadable — skip it.
      }
    }
  }
}

/** Walk every top-level (and scoped) package in node_modules for its types. */
async function collectNodeModulesTypes(
  container: WebContainer,
): Promise<SyncResult> {
  const out: SyncResult = { libs: [], bytes: 0, truncated: false };
  const top = await readDir(container, "node_modules");
  if (!top) return out;

  for (const entry of top) {
    // Skip files and the dotted bookkeeping dirs (`.bin`, `.package-lock.json`,
    // a pnpm `.pnpm` store, etc.).
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    if (entry.name.startsWith("@")) {
      // Scope dir: the real packages live one level down.
      const scoped = await readDir(container, `node_modules/${entry.name}`);
      if (!scoped) continue;
      for (const pkg of scoped) {
        if (pkg.isDirectory()) {
          await collectFromPackage(
            container,
            `node_modules/${entry.name}/${pkg.name}`,
            out,
          );
        }
      }
    } else {
      await collectFromPackage(container, `node_modules/${entry.name}`, out);
    }
  }
  return out;
}

/**
 * Keep Monaco's extra libs in sync with the ducklet's installed dependencies.
 * Polls the install sentinel; on each change (first install or a re-install)
 * it re-reads node_modules and replaces the editor's extra-lib set wholesale.
 */
export function useNodeModulesTypes({
  monaco,
  container,
  enabled,
}: {
  monaco: Monaco | null;
  container: WebContainer | null;
  enabled: boolean;
}): void {
  useEffect(() => {
    if (!monaco || !container || !enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastSentinel: string | null = null;
    let syncing = false;
    const tsNs = monaco.languages.typescript;

    const sync = async () => {
      if (syncing) return;
      syncing = true;
      try {
        const { libs, truncated } = await collectNodeModulesTypes(container);
        if (cancelled) return;
        // setExtraLibs replaces the whole set, so a re-install cleanly swaps
        // stale declarations instead of layering duplicates. It only touches
        // our node_modules mirror — Monaco's built-in lib (DOM, ES) is separate.
        tsNs.typescriptDefaults.setExtraLibs(libs);
        tsNs.javascriptDefaults.setExtraLibs(libs);
        if (truncated) {
          console.warn(
            `[ducklet] node_modules types exceeded ${MAX_TOTAL_BYTES} bytes; some declarations were omitted from the editor.`,
          );
        }
      } finally {
        syncing = false;
      }
    };

    const poll = async () => {
      if (cancelled) return;
      try {
        const sentinel = await container.fs.readFile(INSTALL_SENTINEL, "utf-8");
        if (sentinel !== lastSentinel) {
          lastSentinel = sentinel;
          await sync();
        }
      } catch {
        // node_modules isn't installed yet — keep waiting for the sentinel.
      }
      if (!cancelled) timer = setTimeout(() => void poll(), POLL_MS);
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [monaco, container, enabled]);
}
