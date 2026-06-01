"use client";

import {
  Braces,
  FileCode2,
  FileJson,
  FileText,
  FileType2,
  Folder,
  FolderOpen,
  Hash,
} from "lucide-react";

import { cn } from "~/lib/utils";

/** A small, extension-coloured glyph for a file or folder row. */
export function FileIcon({
  name,
  isDir,
  isOpen,
}: {
  name: string;
  isDir?: boolean;
  isOpen?: boolean;
}) {
  const cls = "h-3.5 w-3.5 shrink-0";

  if (isDir) {
    return isOpen ? (
      <FolderOpen className={cn(cls, "text-sky-500")} />
    ) : (
      <Folder className={cn(cls, "text-sky-500")} />
    );
  }

  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return <FileType2 className={cn(cls, "text-blue-500")} />;
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return <FileCode2 className={cn(cls, "text-yellow-500")} />;
    case "json":
      return <FileJson className={cn(cls, "text-amber-500")} />;
    case "css":
      return <Hash className={cn(cls, "text-sky-400")} />;
    case "html":
    case "htm":
      return <FileCode2 className={cn(cls, "text-orange-500")} />;
    case "vue":
      return <FileCode2 className={cn(cls, "text-emerald-500")} />;
    case "svelte":
      return <FileCode2 className={cn(cls, "text-orange-600")} />;
    case "md":
      return <FileText className={cn(cls, "text-muted-foreground")} />;
    default:
      return <Braces className={cn(cls, "text-muted-foreground")} />;
  }
}
