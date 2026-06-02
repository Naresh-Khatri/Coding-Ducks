"use client";

import { useEffect, useMemo, useState } from "react";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { syntaxTree } from "@codemirror/language";
import type { Diagnostic } from "@codemirror/lint";
import { linter, lintGutter } from "@codemirror/lint";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Extension } from "@uiw/react-codemirror";
import CodeMirror from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import { yCollab } from "y-codemirror.next";
import * as Y from "yjs";

import { extname } from "@acme/ducklet-fs";

import { aiCompletionExtension } from "./ai-completion";
import { useEditorSettingsExtensions } from "./use-editor-settings-extensions";

interface FileEditorProps {
  path: string;
  ytext: Y.Text;
  /** Null for non-collaborative (guest, read-only) editing — skips yCollab. */
  provider: HocuspocusProvider | null;
  readOnly?: boolean;
}

/** CodeMirror language extension for a file, inferred from its extension. */
function languageForPath(path: string): Extension | null {
  switch (extname(path)) {
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return javascript({ jsx: true });
    case "ts":
    case "tsx":
      return javascript({ jsx: true, typescript: true });
    case "css":
      return css();
    case "html":
    case "htm":
      return html();
    default:
      return null; // json/md/vue/svelte/etc. — plain text, still collaborative
  }
}

// Extract parser error nodes as lint diagnostics (same approach as the legacy
// editor, but applies to whichever language is active).
const syntaxLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state).iterate({
    enter: (node) => {
      if (node.type.isError) {
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: "error",
          message: "Syntax error",
        });
      }
    },
  });
  return diagnostics;
});

export function FileEditor({
  path,
  ytext,
  provider,
  readOnly = false,
}: FileEditorProps) {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [initialValue, setInitialValue] = useState("");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  const {
    extensions: settingsExtensions,
    showLineNumbers,
    aiCompletion,
  } = useEditorSettingsExtensions();

  // AI completion is editable-only (needs a provider) and toggleable. Kept out
  // of the effect below so flipping it reconfigures live without tearing down
  // the yCollab binding / undo history.
  const allExtensions = useMemo(
    () => [
      ...extensions,
      ...settingsExtensions,
      ...(provider && aiCompletion ? [aiCompletionExtension()] : []),
    ],
    [extensions, settingsExtensions, provider, aiCompletion],
  );

  useEffect(() => {
    setInitialValue(ytext.toString());

    const lang = languageForPath(path);
    // Collaborative when a provider is present; guests get a plain read-only
    // view of the snapshot (no yCollab / awareness).
    if (!provider) {
      setExtensions([
        ...(lang ? [lang] : []),
        EditorView.lineWrapping,
        EditorView.editable.of(false),
        syntaxLinter,
        lintGutter(),
      ]);
      return;
    }

    const undoManager = new Y.UndoManager(ytext);
    setExtensions([
      ...(lang ? [lang] : []),
      EditorView.lineWrapping,
      yCollab(ytext, provider.awareness, { undoManager }),
      syntaxLinter,
      lintGutter(),
    ]);

    return () => {
      undoManager.stopCapturing();
      undoManager.destroy();
    };
  }, [ytext, provider, path]);

  if (extensions.length === 0) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${
          isDark ? "bg-[#282c34] text-gray-400" : "bg-white text-gray-500"
        }`}
      >
        Loading…
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <CodeMirror
        key={path}
        className="h-full"
        height="100%"
        theme={isDark ? oneDark : "light"}
        extensions={allExtensions}
        basicSetup={{ lineNumbers: showLineNumbers }}
        // Seeds the initial document. yCollab only applies *future* deltas, so
        // without this the editor would start empty. `initialValue` is captured
        // once per mounted path (the component is keyed by `path`), so this
        // reference stays stable and never re-controls the doc mid-edit.
        value={initialValue}
        readOnly={readOnly}
      />
    </div>
  );
}
