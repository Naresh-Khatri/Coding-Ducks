/**
 * The collaborative ducklet filesystem, modelled on a single Y.Doc.
 *
 * Two shared structures hold the tree:
 *   - `files`: Y.Map<path, Y.Text>  — text file contents (the editable docs)
 *   - `dirs`:  Y.Map<path, true>    — directories that exist independently of
 *                                     any file (notably *empty* folders)
 *
 * A directory also exists implicitly whenever a file lives beneath it, so the
 * `dirs` map only needs to track folders that would otherwise have no files.
 *
 * Binary assets are NOT stored here — they go to object storage and are
 * referenced by path elsewhere. This model is text-only.
 */
import * as Y from "yjs";

import { ancestorDirs, dirname, isUnder, normalizePath } from "./paths";

export const FILES_KEY = "files";
export const DIRS_KEY = "dirs";

export type EntryType = "file" | "dir";

export interface TreeNode {
  /** Final path segment, e.g. `App.tsx`. */
  name: string;
  /** Full normalized path from the project root. */
  path: string;
  type: EntryType;
  /** Present (possibly empty) for directories; sorted dirs-first then name. */
  children?: TreeNode[];
}

export function getFilesMap(doc: Y.Doc): Y.Map<Y.Text> {
  return doc.getMap<Y.Text>(FILES_KEY);
}

export function getDirsMap(doc: Y.Doc): Y.Map<true> {
  return doc.getMap<true>(DIRS_KEY);
}

/** All file paths currently in the doc (unsorted). */
export function listFilePaths(doc: Y.Doc): string[] {
  return [...getFilesMap(doc).keys()];
}

/** Whether a text file exists at `path`. */
export function hasFile(doc: Y.Doc, path: string): boolean {
  return getFilesMap(doc).has(normalizePath(path));
}

/**
 * The Y.Text backing a file, or `undefined` if it doesn't exist. Bind this to
 * CodeMirror via yCollab; mutate it through Yjs, never replace the reference.
 */
export function getFileText(doc: Y.Doc, path: string): Y.Text | undefined {
  return getFilesMap(doc).get(normalizePath(path));
}

/** Plain-string snapshot of every file: `{ "src/App.tsx": "..." }`. */
export function readAllFiles(doc: Y.Doc): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, text] of getFilesMap(doc)) out[path] = text.toString();
  return out;
}

/**
 * Create a text file (no-op if it already exists). Ensures the parent
 * directory chain is recorded. Returns the file's Y.Text.
 */
export function createFile(doc: Y.Doc, path: string, content = ""): Y.Text {
  const p = normalizePath(path);
  const files = getFilesMap(doc);
  let text = files.get(p);
  if (text) return text;
  text = new Y.Text();
  if (content) text.insert(0, content);
  doc.transact(() => {
    files.set(p, text!);
    ensureParentDirs(doc, p);
  });
  return text;
}

/** Replace a file's entire contents, creating it if missing. */
export function writeFile(doc: Y.Doc, path: string, content: string): Y.Text {
  const p = normalizePath(path);
  const files = getFilesMap(doc);
  let text = files.get(p);
  doc.transact(() => {
    if (!text) {
      text = new Y.Text();
      files.set(p, text);
      ensureParentDirs(doc, p);
    }
    if (text.toString() !== content) {
      text.delete(0, text.length);
      if (content) text.insert(0, content);
    }
  });
  return text!;
}

/** Delete a single file. No-op if absent. */
export function deleteFile(doc: Y.Doc, path: string): void {
  getFilesMap(doc).delete(normalizePath(path));
}

/**
 * Rename/move a file. Yjs shared types can't change map keys in place, so this
 * re-creates the Y.Text under the new key with the same string content (the
 * per-character edit history for that file is not carried over). No-op if the
 * source is missing; refuses to clobber an existing destination.
 */
export function renameFile(doc: Y.Doc, from: string, to: string): void {
  const src = normalizePath(from);
  const dst = normalizePath(to);
  if (src === dst) return;
  const files = getFilesMap(doc);
  const existing = files.get(src);
  if (!existing || files.has(dst)) return;
  const content = existing.toString();
  doc.transact(() => {
    files.delete(src);
    const text = new Y.Text();
    if (content) text.insert(0, content);
    files.set(dst, text);
    ensureParentDirs(doc, dst);
  });
}

/** Record an explicit (possibly empty) directory. */
export function createDir(doc: Y.Doc, path: string): void {
  const p = normalizePath(path);
  if (!p) return;
  doc.transact(() => {
    getDirsMap(doc).set(p, true);
    for (const dir of ancestorDirs(`${p}/x`)) getDirsMap(doc).set(dir, true);
  });
}

/** Delete a directory and everything beneath it (files + nested dirs). */
export function deleteDir(doc: Y.Doc, path: string): void {
  const dir = normalizePath(path);
  if (!dir) return;
  const files = getFilesMap(doc);
  const dirs = getDirsMap(doc);
  doc.transact(() => {
    for (const p of [...files.keys()]) {
      if (isUnder(p, dir)) files.delete(p);
    }
    for (const p of [...dirs.keys()]) {
      if (isUnder(p, dir)) dirs.delete(p);
    }
    dirs.delete(dir);
  });
}

/** Record every ancestor directory of `path` in the dirs map. */
function ensureParentDirs(doc: Y.Doc, path: string): void {
  const dirs = getDirsMap(doc);
  for (const dir of ancestorDirs(path)) dirs.set(dir, true);
}

/**
 * Build the nested directory tree from the flat file + dir maps. Children are
 * sorted directories-first, then alphabetically — ready for a file explorer.
 */
export function buildTree(doc: Y.Doc): TreeNode {
  const dirSet = new Set<string>();
  const fileSet = new Set<string>();

  for (const path of getFilesMap(doc).keys()) {
    fileSet.add(path);
    for (const dir of ancestorDirs(path)) dirSet.add(dir);
  }
  for (const path of getDirsMap(doc).keys()) {
    dirSet.add(path);
    for (const dir of ancestorDirs(`${path}/x`)) dirSet.add(dir);
  }

  const root: TreeNode = { name: "", path: "", type: "dir", children: [] };
  const nodes = new Map<string, TreeNode>([["", root]]);

  const ensureDirNode = (path: string): TreeNode => {
    const existing = nodes.get(path);
    if (existing) return existing;
    const node: TreeNode = {
      name: path.slice(path.lastIndexOf("/") + 1),
      path,
      type: "dir",
      children: [],
    };
    nodes.set(path, node);
    ensureDirNode(dirname(path)).children!.push(node);
    return node;
  };

  for (const path of [...dirSet].sort()) ensureDirNode(path);
  for (const path of fileSet) {
    ensureDirNode(dirname(path)).children!.push({
      name: path.slice(path.lastIndexOf("/") + 1),
      path,
      type: "file",
    });
  }

  sortTree(root);
  return root;
}

function sortTree(node: TreeNode): void {
  if (!node.children) return;
  node.children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const child of node.children) sortTree(child);
}
