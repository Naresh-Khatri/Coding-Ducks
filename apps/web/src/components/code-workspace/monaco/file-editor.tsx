"use client";

import { useEffect, useRef } from "react";
import type { Monaco } from "@monaco-editor/react";
import type { editor as MEditor } from "monaco-editor";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { initVimMode } from "monaco-vim";
import { useTheme } from "next-themes";
import { MonacoBinding } from "y-monaco";
import type * as Y from "yjs";

import { useEditorSettings } from "~/hooks/use-editor-settings";

import { useRemoteCursorStyles } from "./remote-cursors";
import { defineEditorThemes, themeName } from "./theme";

interface FileEditorProps {
  monaco: Monaco;
  /** Model for the active file, owned by `useEditorModels`. */
  model: MEditor.ITextModel;
  ytext: Y.Text;
  /** Null for non-collaborative (guest, read-only) editing — skips y-monaco. */
  provider: HocuspocusProvider | null;
  readOnly?: boolean;
  /**
   * Called with the editor instance once created (and `null` on dispose), so the
   * toolbar can drive imperative actions like "format document". Keep it stable.
   */
  onMount?: (editor: MEditor.IStandaloneCodeEditor | null) => void;
}

/**
 * A single persistent Monaco editor that swaps its *model* on file change
 * (instead of remounting), so view state and the language service stay warm.
 * Collaboration, type intelligence, AI ghost-text and diagnostics are all
 * configured around this one editor.
 */
export function FileEditor({
  monaco,
  model,
  ytext,
  provider,
  readOnly = false,
  onMount,
}: FileEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MEditor.IStandaloneCodeEditor | null>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const settings = useEditorSettings();

  // Editability is independent of collaboration: local-first sessions (no
  // provider, e.g. the machine-coding solve page) are still writable. The
  // provider only adds multiplayer sync + remote cursors on top.
  const editable = !readOnly;

  // Faint, theme-aware tint for the read-only diagonal hatch — light lines on
  // dark themes, dark lines on light ones, kept very low-contrast so the code
  // underneath stays fully legible.
  const hatchLine = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  // y-monaco ships no cursor CSS — inject per-collaborator styles ourselves.
  useRemoteCursorStyles(provider);

  // Create the editor once; it lives for the whole session and just swaps
  // models as the user changes files.
  useEffect(() => {
    if (!hostRef.current) return;
    defineEditorThemes(monaco);
    const editor = monaco.editor.create(hostRef.current, {
      model,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      tabSize: settings.tabSize,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      fontLigatures: settings.fontLigatures,
      lineNumbers: settings.relativeLineNumbers ? "relative" : "on",
      inlineSuggest: { enabled: true },
      fixedOverflowWidgets: true,
      readOnly: !editable,
      theme: themeName(isDark),
    });
    editorRef.current = editor;
    onMount?.(editor);

    // Ctrl/Cmd+S formats the document instead of opening the browser's
    // native save dialog.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      void editor.getAction("editor.action.formatDocument")?.run();
    });

    return () => {
      editor.dispose();
      editorRef.current = null;
      onMount?.(null);
    };
    // Created once — subsequent prop changes are handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monaco]);

  // Swap model on file change — model is a prop driven by external file selection,
  // not a user event inside this component, so the effect is the right place.
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.getModel() !== model) editor.setModel(model);
  }, [model]);

  // Bind Yjs <-> the active model so edits flow back into the Y.Doc (local
  // persistence + WebContainer sync), plus remote cursors when collaborating.
  // The only case with no binding is the read-only guest view (no provider,
  // can't edit), where useEditorModels keeps the model synced one-way.
  // Awareness only exists with a provider.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || (!provider && !editable)) return;
    const binding = new MonacoBinding(
      ytext,
      model,
      new Set([editor]),
      provider?.awareness,
    );
    return () => binding.destroy();
  }, [model, ytext, provider, editable]);

  // Theme is a global Monaco setting.
  useEffect(() => {
    monaco.editor.setTheme(themeName(isDark));
  }, [monaco, isDark]);

  // Live-apply editor settings without recreating the editor or binding.
  // model.updateOptions is a Monaco imperative API call, not passing data to parent.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.updateOptions({
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      fontLigatures: settings.fontLigatures,
      lineNumbers: settings.relativeLineNumbers ? "relative" : "on",
      readOnly: !editable,
    });
    model.updateOptions({ tabSize: settings.tabSize });
  }, [
    settings.fontSize,
    settings.fontFamily,
    settings.fontLigatures,
    settings.relativeLineNumbers,
    settings.tabSize,
    model,
    editable,
  ]);

  // Vim mode.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || settings.keymap !== "vim") return;
    const vim = initVimMode(editor, statusRef.current);
    return () => vim.dispose();
  }, [settings.keymap]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1">
        <div ref={hostRef} className="h-full w-full" />
        {/* Read-only affordance: a faint diagonal hatch over the editor so it's
            obvious the file can't be edited. Deliberately very subtle (and
            theme-aware) to keep the code legible; pointer-events-none preserves
            scrolling + text selection. */}
        {!editable && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, ${hatchLine} 0, ${hatchLine} 1px, transparent 1px, transparent 11px)`,
            }}
            aria-hidden
          />
        )}
      </div>
      <div
        ref={statusRef}
        className={`bg-muted/30 text-muted-foreground px-2 font-mono text-xs ${
          settings.keymap === "vim" ? "" : "hidden"
        }`}
      />
    </div>
  );
}
