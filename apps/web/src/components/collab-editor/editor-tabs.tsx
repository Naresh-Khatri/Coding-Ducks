"use client";

import { X } from "lucide-react";

import { cn } from "~/lib/utils";
import type { PresenceUser } from "~/lib/webcontainer/use-file-presence";
import { FileIcon } from "./file-icon";
import { PresenceAvatars } from "./presence-avatars";

export function EditorTabs({
  openPaths,
  activePath,
  onSelect,
  onClose,
  presenceByPath,
}: {
  openPaths: string[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
  presenceByPath: Record<string, PresenceUser[]>;
}) {
  if (openPaths.length === 0) return null;

  return (
    <div className="bg-muted/20 flex items-stretch overflow-x-auto border-b">
      {openPaths.map((path) => {
        const isActive = path === activePath;
        const name = path.slice(path.lastIndexOf("/") + 1);
        return (
          <div
            key={path}
            onClick={() => onSelect(path)}
            className={cn(
              "group flex shrink-0 cursor-pointer items-center gap-1.5 border-r px-3 py-1.5 text-xs",
              isActive
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:bg-muted/40",
            )}
            title={path}
          >
            <FileIcon name={name} />
            <span className="max-w-[12rem] truncate">{name}</span>
            <PresenceAvatars users={presenceByPath[path] ?? []} size={14} />
            <button
              type="button"
              className="hover:bg-muted ml-1 rounded p-0.5 opacity-0 group-hover:opacity-100"
              title="Close"
              onClick={(e) => {
                e.stopPropagation();
                onClose(path);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
