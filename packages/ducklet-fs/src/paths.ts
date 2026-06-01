/**
 * Path helpers for the ducklet virtual filesystem.
 *
 * Paths are POSIX, relative to the project root, with NO leading slash and
 * NO trailing slash (e.g. `src/App.tsx`, `public`). The empty string is the
 * root directory.
 */

/** Normalize an arbitrary user/path input to our canonical form. */
export function normalizePath(input: string): string {
  const parts: string[] = [];
  for (const segment of input.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      parts.pop();
      continue;
    }
    parts.push(segment);
  }
  return parts.join("/");
}

/** The parent directory of a path (`""` for top-level entries). */
export function dirname(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i);
}

/** The final segment of a path (`src/App.tsx` -> `App.tsx`). */
export function basename(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? path : path.slice(i + 1);
}

/** Join segments into a normalized path. */
export function joinPath(...segments: string[]): string {
  return normalizePath(segments.join("/"));
}

/** Every ancestor directory of a path, shallowest first (excludes root). */
export function ancestorDirs(path: string): string[] {
  const dir = dirname(path);
  if (!dir) return [];
  const segments = dir.split("/");
  const dirs: string[] = [];
  let acc = "";
  for (const segment of segments) {
    acc = acc ? `${acc}/${segment}` : segment;
    dirs.push(acc);
  }
  return dirs;
}

/** True if `path` is `dir` itself or lives anywhere beneath it. */
export function isUnder(path: string, dir: string): boolean {
  if (!dir) return true;
  return path === dir || path.startsWith(`${dir}/`);
}

/** The file extension without the dot, lowercased (`App.tsx` -> `tsx`). */
export function extname(path: string): string {
  const base = basename(path);
  const i = base.lastIndexOf(".");
  return i <= 0 ? "" : base.slice(i + 1).toLowerCase();
}
