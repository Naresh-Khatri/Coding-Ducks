/**
 * Map a ducklet file path to a Monaco language id, and classify TS/JS files.
 */
import { extname } from "@acme/ducklet-fs";

/** Monaco language id for a file, inferred from its extension. */
export function monacoLanguage(path: string): string {
  switch (extname(path)) {
    case "ts":
    case "tsx":
    case "mts":
    case "cts":
      return "typescript";
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return "javascript";
    case "json":
      return "json";
    case "css":
      return "css";
    case "scss":
      return "scss";
    case "less":
      return "less";
    case "html":
    case "htm":
    case "vue":
    case "svelte":
      return "html";
    case "md":
    case "markdown":
      return "markdown";
    default:
      return "plaintext";
  }
}

/** Whether a file participates in the TypeScript/JavaScript language service. */
export function isTsLike(path: string): boolean {
  const ext = extname(path);
  return (
    ext === "ts" ||
    ext === "tsx" ||
    ext === "mts" ||
    ext === "cts" ||
    ext === "js" ||
    ext === "jsx" ||
    ext === "mjs" ||
    ext === "cjs"
  );
}
