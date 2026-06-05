"use client";

import type { Monaco } from "@monaco-editor/react";
import type { editor as MEditor } from "monaco-editor";
import { useEffect, useRef } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { Check, FilePlus2, Trash2, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { monacoLanguage } from "./lang";
import { defineDuckletThemes, themeName } from "./theme";

export interface ReviewEditorProps {
  path: string;
  /** "write" reviews a content diff; "delete" reviews a file removal. */
  kind: "write" | "delete";
  /** File contents when the edit was proposed — the diff's "before" side. */
  base: string;
  /** Proposed contents — the diff's editable "after" side (empty for delete). */
  proposed: string;
  isNew: boolean;
  isDark: boolean;
  /** Live Y.Text content now, to warn if the file moved since the proposal. */
  current: string;
  /** Applies the (possibly edited) proposed text, or removes the file. */
  onAccept: (path: string, content: string) => void;
  onReject: (path: string) => void;
}

/**
 * Reviews one pending AI edit in the main editor pane: a Monaco diff of the
 * file's current text vs. the proposal, with an Accept/Reject bar (Accept ⌘↵,
 * Reject ⌘⌫). A "write" diff is editable so the user can tweak before accepting.
 * A "delete" is shown as a full removal (everything → empty), read-only, with a
 * red destructive bar and an extra confirm since it can't be undone.
 */
export function ReviewEditor({
  path,
  kind,
  base,
  proposed,
  isNew,
  isDark,
  current,
  onAccept,
  onReject,
}: ReviewEditorProps) {
  const isDelete = kind === "delete";
  const diffRef = useRef<MEditor.IStandaloneDiffEditor | null>(null);
  // Keep the latest handlers reachable from the once-bound Monaco commands.
  const acceptRef = useRef<() => void>(() => undefined);
  const rejectRef = useRef<() => void>(() => undefined);

  // The file changed underneath us (a collaborator, or our own edits) since the
  // model proposed against `base`; a full-file write would overwrite that.
  const stale = !isDelete && current !== base;

  const accept = () => {
    if (isDelete) {
      if (!window.confirm(`Delete ${path}? This can't be undone.`)) return;
      onAccept(path, "");
      return;
    }
    const value = diffRef.current?.getModel()?.modified.getValue() ?? proposed;
    if (
      stale &&
      !window.confirm(
        `${path} changed since this edit was proposed. Accept anyway and overwrite the current version?`,
      )
    ) {
      return;
    }
    onAccept(path, value);
  };
  const reject = () => onReject(path);

  // Keep the once-bound Monaco keyboard commands pointed at the latest closures.
  useEffect(() => {
    acceptRef.current = accept;
    rejectRef.current = reject;
  });

  const handleMount = (
    editor: MEditor.IStandaloneDiffEditor,
    monaco: Monaco,
  ) => {
    diffRef.current = editor;
    defineDuckletThemes(monaco);
    const modified = editor.getModifiedEditor();
    modified.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () =>
      acceptRef.current(),
    );
    modified.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backspace, () =>
      rejectRef.current(),
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="bg-muted/30 flex items-center gap-2 border-b px-3 py-1.5">
        {isDelete ? (
          <Trash2 className="size-3.5 shrink-0 text-red-400" />
        ) : isNew ? (
          <FilePlus2 className="size-3.5 shrink-0 text-emerald-400" />
        ) : null}
        <span className="truncate font-mono text-xs">{path}</span>
        {isDelete ? (
          <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium text-red-300">
            AI proposes delete
          </span>
        ) : (
          <span className="text-primary/80 rounded bg-[#1e1e1e] px-1.5 py-0.5 text-[10px] font-medium">
            AI proposed
          </span>
        )}
        {stale && (
          <span
            className="truncate text-[11px] text-amber-400"
            title="The file changed since this edit was proposed."
          >
            changed since proposed
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {isDelete ? (
            <Button
              size="sm"
              className="h-6 gap-1 bg-red-600 px-2 text-xs text-white hover:bg-red-500"
              onClick={accept}
            >
              <Trash2 className="size-3" />
              Delete file
              <span className="ml-1 text-[10px] opacity-70">⌘↵</span>
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-6 gap-1 bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-500"
              onClick={accept}
            >
              <Check className="size-3" />
              Accept
              <span className="ml-1 text-[10px] opacity-70">⌘↵</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 px-2 text-xs"
            onClick={reject}
          >
            <X className="size-3" />
            Reject
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <DiffEditor
          height="100%"
          language={monacoLanguage(path)}
          original={base}
          modified={proposed}
          theme={themeName(isDark)}
          // Remount when switching files so each proposal gets fresh models.
          keepCurrentOriginalModel={false}
          keepCurrentModifiedModel={false}
          onMount={handleMount}
          options={{
            // Deletions aren't editable; writes are (tweak before accepting).
            readOnly: isDelete,
            originalEditable: false,
            renderSideBySide: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
