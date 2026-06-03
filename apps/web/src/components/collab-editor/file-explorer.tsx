"use client";

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
import type * as Y from "yjs";

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

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { PresenceUser } from "~/lib/webcontainer/use-file-presence";
import { FileIcon } from "./file-icon";
import { PresenceAvatars } from "./presence-avatars";

interface FileExplorerProps {
  ydoc: Y.Doc;
  readOnly: boolean;
  activePath: string | null;
  onOpen: (path: string) => void;
  presenceByPath: Record<string, PresenceUser[]>;
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
  return {
    ...node,
    children: node.children
      .filter((child) => !child.name.startsWith("."))
      .map(filterHidden),
  };
}

export function FileExplorer({
  ydoc,
  readOnly,
  activePath,
  onOpen,
  presenceByPath,
}: FileExplorerProps) {
  const [tree, setTree] = useState<TreeNode>(() => buildTree(ydoc));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [seededExpand, setSeededExpand] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const visibleTree = useMemo(
    () => (showHidden ? tree : filterHidden(tree)),
    [tree, showHidden],
  );

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
  useEffect(() => {
    if (seededExpand) return;
    const dirs = collectDirs(tree);
    if (dirs.length > 0 || (tree.children?.length ?? 0) > 0) {
      setExpanded(new Set(dirs));
      setSeededExpand(true);
    }
  }, [tree, seededExpand]);

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
            className="h-6 w-6"
            onClick={() => setShowHidden((v) => !v)}
            title={showHidden ? "Hide hidden files" : "Show hidden files"}
          >
            {showHidden ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </Button>
          {!readOnly && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleNewFile}
                title="New file"
              >
                <FilePlus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleNewFolder}
                title="New folder"
              >
                <FolderPlus className="h-3.5 w-3.5" />
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
  readOnly: boolean;
}) {
  const isDir = node.type === "dir";
  const isOpen = expanded.has(node.path);
  const isActive = node.path === activePath;
  const watchers = presenceByPath[node.path] ?? [];

  return (
    <div>
      <div
        className={cn(
          "group hover:bg-muted/60 flex cursor-pointer items-center gap-1 py-0.5 pr-1 text-sm",
          isActive && "bg-muted text-foreground",
        )}
        style={{ paddingLeft: depth * 12 + 6 }}
        onClick={() => (isDir ? onToggle(node.path) : onOpen(node.path))}
      >
        {isDir ? (
          isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <FileIcon name={node.name} isDir={isDir} isOpen={isOpen} />
        <span className="truncate">{node.name}</span>

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
                  <Pencil className="h-3 w-3" />
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
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

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
            readOnly={readOnly}
          />
        ))}
    </div>
  );
}
