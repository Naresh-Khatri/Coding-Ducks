"use client";

import { X } from "lucide-react";

import type { PresenceUser } from "~/lib/webcontainer/use-file-presence";
import { cn } from "~/lib/utils";
import { FileIcon } from "./file-icon";
import { PresenceAvatars } from "./presence-avatars";

export function EditorTabs({
  openPaths,
  activePath,
  onSelect,
  onClose,
  presenceByPath,
  pendingPaths,
  pendingDeletes,
  leading,
  actions,
}: {
  openPaths: string[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
  presenceByPath: Record<string, PresenceUser[]>;
  /** Files with an unreviewed AI edit — flagged with a dot (red for deletes). */
  pendingPaths?: Set<string>;
  pendingDeletes?: Set<string>;
  /** Leading content before the tabs (e.g. a Files navigator dropdown). */
  leading?: React.ReactNode;
  /** Right-pinned toolbar content (e.g. editor settings). */
  actions?: React.ReactNode;
}) {
  if (openPaths.length === 0 && !actions && !leading) return null;

  return (
    <div className="bg-muted/20 flex items-stretch border-b">
      {leading && <div className="flex shrink-0 items-stretch">{leading}</div>}
      <div className="flex items-stretch overflow-x-auto">
        {openPaths.map((path) => {
          const isActive = path === activePath;
          const name = path.slice(path.lastIndexOf("/") + 1);
          return (
            // Tab contains a nested <button> (close), so <button> nesting is invalid; role="button" is correct here
            <div
              key={path}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(path)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(path);
                }
              }}
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
              {pendingPaths?.has(path) && (
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    pendingDeletes?.has(path) ? "bg-red-400" : "bg-amber-400",
                  )}
                  title={
                    pendingDeletes?.has(path)
                      ? "Pending AI deletion"
                      : "Unreviewed AI change"
                  }
                />
              )}
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
                <X className="size-3" />
              </button>
            </div>
          );
        })}
      </div>
      {actions && (
        <div className="ml-auto flex shrink-0 items-center px-1.5">
          {actions}
        </div>
      )}
    </div>
  );
}
