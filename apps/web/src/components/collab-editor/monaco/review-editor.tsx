"use client";

import type { Monaco } from "@monaco-editor/react";
import type { editor as MEditor } from "monaco-editor";
import { useEffect, useRef } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { Check, FilePlus2, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { monacoLanguage } from "./lang";
import { defineDuckletThemes, themeName } from "./theme";

export interface ReviewEditorProps {
  path: string;
  /** File contents when the edit was proposed — the diff's "before" side. */
  base: string;
  /** Proposed contents — the diff's editable "after" side. */
  proposed: string;
  isNew: boolean;
  isDark: boolean;
  /** Live Y.Text content now, to warn if the file moved since the proposal. */
  current: string;
  /** Applies `content` (the possibly-edited proposed text) to the file. */
  onAccept: (path: string, content: string) => void;
  onReject: (path: string) => void;
}

/**
 * Reviews one pending AI edit inside the main editor pane (instead of the chat
 * panel): a Monaco diff of the file's current text vs. the proposal, with an
 * Accept/Reject bar. The proposed side is editable, so the user can tweak before
 * accepting — Accept applies whatever is in the modified editor. Accept ⌘↵,
 * Reject ⌘⌫.
 */
export function ReviewEditor({
  path,
  base,
  proposed,
  isNew,
  isDark,
  current,
  onAccept,
  onReject,
}: ReviewEditorProps) {
  const diffRef = useRef<MEditor.IStandaloneDiffEditor | null>(null);
  // Keep the latest handlers reachable from the once-bound Monaco commands.
  const acceptRef = useRef<() => void>(() => undefined);
  const rejectRef = useRef<() => void>(() => undefined);

  // The file changed underneath us (a collaborator, or our own edits) since the
  // model proposed against `base`; a full-file accept would overwrite that.
  const stale = current !== base;

  const accept = () => {
    const value = diffRef.current?.getModel()?.modified.getValue() ?? proposed;
    if (stale) {
      const ok = window.confirm(
        `${path} changed since this edit was proposed. Accept anyway and overwrite the current version?`,
      );
      if (!ok) return;
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
        {isNew && <FilePlus2 className="size-3.5 shrink-0 text-emerald-400" />}
        <span className="truncate font-mono text-xs">{path}</span>
        <span className="text-primary/80 rounded bg-[#1e1e1e] px-1.5 py-0.5 text-[10px] font-medium">
          AI proposed
        </span>
        {stale && (
          <span
            className="truncate text-[11px] text-amber-400"
            title="The file changed since this edit was proposed."
          >
            changed since proposed
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            className="h-6 gap-1 bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-500"
            onClick={accept}
          >
            <Check className="size-3" />
            Accept
            <span className="ml-1 text-[10px] opacity-70">⌘↵</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 px-2 text-xs"
            onClick={() => onReject(path)}
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
            readOnly: false,
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
