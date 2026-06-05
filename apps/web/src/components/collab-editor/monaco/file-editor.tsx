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
import { defineDuckletThemes, themeName } from "./theme";

interface FileEditorProps {
  monaco: Monaco;
  /** Model for the active file, owned by `useDuckletModels`. */
  model: MEditor.ITextModel;
  ytext: Y.Text;
  /** Null for non-collaborative (guest, read-only) editing — skips y-monaco. */
  provider: HocuspocusProvider | null;
  readOnly?: boolean;
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
}: FileEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MEditor.IStandaloneCodeEditor | null>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const settings = useEditorSettings();

  const editable = !readOnly && !!provider;

  // y-monaco ships no cursor CSS — inject per-collaborator styles ourselves.
  useRemoteCursorStyles(provider);

  // Create the editor once; it lives for the whole session and just swaps
  // models as the user changes files.
  useEffect(() => {
    if (!hostRef.current) return;
    defineDuckletThemes(monaco);
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

    // Ctrl/Cmd+S formats the document instead of opening the browser's
    // native save dialog.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      void editor.getAction("editor.action.formatDocument")?.run();
    });

    return () => {
      editor.dispose();
      editorRef.current = null;
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

  // Bind Yjs <-> the active model for collaborative editing + remote cursors.
  // Guests (no provider) read the background-synced model with no binding.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !provider) return;
    const binding = new MonacoBinding(
      ytext,
      model,
      new Set([editor]),
      provider.awareness,
    );
    return () => binding.destroy();
  }, [model, ytext, provider]);

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
      <div ref={hostRef} className="min-h-0 flex-1" />
      <div
        ref={statusRef}
        className={`bg-muted/30 text-muted-foreground px-2 font-mono text-xs ${
          settings.keymap === "vim" ? "" : "hidden"
        }`}
      />
    </div>
  );
}
