/**
 * Conversions and inference between the flat ducklet file map and the
 * WebContainer filesystem.
 */
import type { FileSystemTree } from "@webcontainer/api";

/**
 * Path segments that are machine-generated and must never round-trip back into
 * the shared Yjs doc (they're huge and/or per-client). Used by the fs→Yjs
 * write-back watcher.
 */
const IGNORED_SEGMENTS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".cache",
  ".vite",
  ".output",
  ".turbo",
  ".svelte-kit",
]);

export function isIgnoredPath(path: string): boolean {
  return path.split("/").some((segment) => IGNORED_SEGMENTS.has(segment));
}

/**
 * Build a nested WebContainer {@link FileSystemTree} from the flat
 * `{ path: contents }` map (plus any explicit empty directories).
 */
export function toFileSystemTree(
  files: Record<string, string>,
  dirs: string[] = [],
): FileSystemTree {
  const root: FileSystemTree = {};

  const ensureDir = (segments: string[]): FileSystemTree => {
    let node = root;
    for (const segment of segments) {
      let entry = node[segment];
      if (!entry || !("directory" in entry)) {
        entry = { directory: {} };
        node[segment] = entry;
      }
      node = entry.directory;
    }
    return node;
  };

  for (const dir of dirs) {
    if (!dir) continue;
    ensureDir(dir.split("/"));
  }

  for (const [path, contents] of Object.entries(files)) {
    const segments = path.split("/");
    const name = segments.pop()!;
    const dirNode = ensureDir(segments);
    dirNode[name] = { file: { contents } };
  }

  return root;
}

interface BootPlan {
  /** Shell command that installs (if needed) and starts the dev server. */
  command: string;
  /** Whether `npm install` is part of the command. */
  install: boolean;
}

/**
 * Infer how to boot a project from its `package.json` scripts + deps. Prefers
 * a `dev` script (Vite et al.), falling back to `start` (static/node). Returns
 * `null` when there's nothing runnable.
 */
export function inferBootPlan(files: Record<string, string>): BootPlan | null {
  const raw = files["package.json"];
  if (!raw) return null;

  let pkg: {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  try {
    pkg = JSON.parse(raw) as typeof pkg;
  } catch {
    return null;
  }

  const scripts = pkg.scripts ?? {};
  const run = scripts.dev
    ? "npm run dev"
    : scripts.start
      ? "npm start"
      : null;
  if (!run) return null;

  const install =
    Object.keys(pkg.dependencies ?? {}).length > 0 ||
    Object.keys(pkg.devDependencies ?? {}).length > 0;

  return {
    command: install ? `npm install && ${run}` : run,
    install,
  };
}
