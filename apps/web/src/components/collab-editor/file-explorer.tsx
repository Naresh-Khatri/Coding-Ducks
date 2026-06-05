"use client";

import type * as Y from "yjs";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";

import type { TreeNode } from "@acme/ducklet-fs";
import {
  buildTree,
  createDir,
  createFile,
  deleteDir,
  deleteFile,
  dirname,
  getDirsMap,
  getFilesMap,
  joinPath,
  renameFile,
} from "@acme/ducklet-fs";

import type { PresenceUser } from "~/lib/webcontainer/use-file-presence";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { FileIcon } from "./file-icon";
import { PresenceAvatars } from "./presence-avatars";

interface FileExplorerProps {
  ydoc: Y.Doc;
  readOnly: boolean;
  activePath: string | null;
  onOpen: (path: string) => void;
  presenceByPath: Record<string, PresenceUser[]>;
  /** Files with an unreviewed AI edit — flagged with a dot. */
  pendingPaths?: Set<string>;
}

function collectDirs(node: TreeNode, acc: string[] = []): string[] {
  for (const child of node.children ?? []) {
    if (child.type === "dir") {
      acc.push(child.path);
      collectDirs(child, acc);
    }
  }
  return acc;
}

/** Drop dotfiles/dot-folders (and their contents) from the tree. */
function filterHidden(node: TreeNode): TreeNode {
  if (!node.children) return node;
  // The two passes (filter + map) are over a small, shallow list of filesystem
  // entries — the clarity and recursive correctness outweigh the micro-optimisation.
  return {
    ...node,
    children: node.children
      .filter((child) => !child.name.startsWith("."))
      .map(filterHidden),
  };
}

function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Merge AI-proposed paths into the tree as file nodes so pending *new* files
 * show in the explorer before they're accepted (the pending marker comes from
 * `pendingPaths` in TreeRow). Idempotent — paths already present are untouched,
 * so this only ever surfaces files that aren't in the doc yet.
 */
function withPendingFiles(root: TreeNode, pending: Set<string>): TreeNode {
  let result = root;
  for (const path of pending) result = ensureFileNode(result, path);
  return result;
}

function ensureFileNode(root: TreeNode, path: string): TreeNode {
  const segments = path.split("/").filter(Boolean);

  const insert = (node: TreeNode, depth: number): TreeNode => {
    const seg = segments[depth];
    if (seg === undefined) return node;
    const segPath = segments.slice(0, depth + 1).join("/");
    const children = node.children ?? [];

    if (depth === segments.length - 1) {
      if (children.some((c) => c.path === segPath)) return node;
      const file: TreeNode = { name: seg, path: segPath, type: "file" };
      return { ...node, children: sortNodes([...children, file]) };
    }

    const dir = children.find((c) => c.type === "dir" && c.path === segPath);
    if (dir) {
      return {
        ...node,
        children: children.map((c) => (c === dir ? insert(c, depth + 1) : c)),
      };
    }
    const created: TreeNode = {
      name: seg,
      path: segPath,
      type: "dir",
      children: [],
    };
    return {
      ...node,
      children: sortNodes([...children, insert(created, depth + 1)]),
    };
  };

  return insert(root, 0);
}

export function FileExplorer({
  ydoc,
  readOnly,
  activePath,
  onOpen,
  presenceByPath,
  pendingPaths,
}: FileExplorerProps) {
  const [tree, setTree] = useState<TreeNode>(() => buildTree(ydoc));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // seededExpand gates the one-time auto-expand effect and is read in the deps
  // array; it's not purely handler-side state.
  const [seededExpand, setSeededExpand] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const visibleTree = useMemo(() => {
    const base = showHidden ? tree : filterHidden(tree);
    return pendingPaths && pendingPaths.size > 0
      ? withPendingFiles(base, pendingPaths)
      : base;
  }, [tree, showHidden, pendingPaths]);

  // Recompute the tree whenever files/dirs change anywhere in the doc.
  useEffect(() => {
    const filesMap = getFilesMap(ydoc);
    const dirsMap = getDirsMap(ydoc);
    const recompute = () => setTree(buildTree(ydoc));
    recompute();
    filesMap.observe(recompute);
    dirsMap.observe(recompute);
    return () => {
      filesMap.unobserve(recompute);
      dirsMap.unobserve(recompute);
    };
  }, [ydoc]);

  // Expand all directories on first populated render so projects open ready.
  // Done during render (guarded so it runs once) rather than in an effect, so
  // the tree paints already-expanded instead of flashing collapsed first.
  if (!seededExpand) {
    const dirs = collectDirs(tree);
    if (dirs.length > 0 || (tree.children?.length ?? 0) > 0) {
      setExpanded(new Set(dirs));
      setSeededExpand(true);
    }
  }

  const selectedDir = useMemo(
    () => (activePath ? dirname(activePath) : ""),
    [activePath],
  );

  const toggle = (path: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const handleNewFile = () => {
    const input = window.prompt(
      "New file path",
      selectedDir ? `${selectedDir}/` : "",
    );
    if (!input) return;
    const path = joinPath(input);
    if (!path) return;
    createFile(ydoc, path);
    onOpen(path);
  };

  const handleNewFolder = () => {
    const input = window.prompt(
      "New folder path",
      selectedDir ? `${selectedDir}/` : "",
    );
    if (!input) return;
    const path = joinPath(input);
    if (path) createDir(ydoc, path);
  };

  const handleRename = (path: string) => {
    const input = window.prompt("Rename file to", path);
    if (!input) return;
    const next = joinPath(input);
    if (next && next !== path) {
      renameFile(ydoc, path, next);
      onOpen(next);
    }
  };

  const handleDelete = (node: TreeNode) => {
    if (!window.confirm(`Delete ${node.path}?`)) return;
    if (node.type === "dir") deleteDir(ydoc, node.path);
    else deleteFile(ydoc, node.path);
  };

  return (
    <div className="bg-muted/10 flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-2 py-1.5">
        <span className="text-muted-foreground min-w-0 truncate text-xs font-semibold tracking-wide uppercase">
          Files
        </span>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setShowHidden((v) => !v)}
            title={showHidden ? "Hide hidden files" : "Show hidden files"}
          >
            {showHidden ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
          </Button>
          {!readOnly && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={handleNewFile}
                title="New file"
              >
                <FilePlus className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={handleNewFolder}
                title="New folder"
              >
                <FolderPlus className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto py-1">
        {(visibleTree.children ?? []).map((child) => (
          <TreeRow
            key={child.path}
            node={child}
            depth={0}
            expanded={expanded}
            onToggle={toggle}
            activePath={activePath}
            onOpen={onOpen}
            onRename={handleRename}
            onDelete={handleDelete}
            presenceByPath={presenceByPath}
            pendingPaths={pendingPaths}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

function TreeRow({
  node,
  depth,
  expanded,
  onToggle,
  activePath,
  onOpen,
  onRename,
  onDelete,
  presenceByPath,
  pendingPaths,
  readOnly,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  activePath: string | null;
  onOpen: (path: string) => void;
  onRename: (path: string) => void;
  onDelete: (node: TreeNode) => void;
  presenceByPath: Record<string, PresenceUser[]>;
  pendingPaths?: Set<string>;
  readOnly: boolean;
}) {
  const isDir = node.type === "dir";
  const isOpen = expanded.has(node.path);
  const isActive = node.path === activePath;
  const watchers = presenceByPath[node.path] ?? [];
  const isPending = !isDir && (pendingPaths?.has(node.path) ?? false);

  return (
    <div>
      <button
        type="button"
        aria-label={node.name}
        className={cn(
          "group hover:bg-muted/60 flex w-full cursor-pointer items-center gap-1 py-0.5 pr-1 text-sm",
          isActive && "bg-muted text-foreground",
        )}
        style={{ paddingLeft: depth * 12 + 6 }}
        onClick={() => (isDir ? onToggle(node.path) : onOpen(node.path))}
      >
        {isDir ? (
          isOpen ? (
            <ChevronDown className="size-3.5 shrink-0 opacity-70" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 opacity-70" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <FileIcon name={node.name} isDir={isDir} isOpen={isOpen} />
        <span className={cn("truncate", isPending && "text-amber-300")}>
          {node.name}
        </span>
        {isPending && (
          <span
            className="size-1.5 shrink-0 rounded-full bg-amber-400"
            title="Unreviewed AI change"
          />
        )}

        <div className="ml-auto flex items-center gap-1 pl-1">
          <PresenceAvatars users={watchers} />
          {!readOnly && (
            <div className="hidden items-center group-hover:flex">
              {!isDir && (
                <button
                  type="button"
                  className="hover:text-foreground text-muted-foreground p-0.5"
                  title="Rename"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(node.path);
                  }}
                >
                  <Pencil className="size-3" />
                </button>
              )}
              <button
                type="button"
                className="text-muted-foreground p-0.5 hover:text-red-500"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node);
                }}
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          )}
        </div>
      </button>

      {isDir &&
        isOpen &&
        (node.children ?? []).map((child) => (
          <TreeRow
            key={child.path}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            activePath={activePath}
            onOpen={onOpen}
            onRename={onRename}
            onDelete={onDelete}
            presenceByPath={presenceByPath}
            pendingPaths={pendingPaths}
            readOnly={readOnly}
          />
        ))}
    </div>
  );
}
