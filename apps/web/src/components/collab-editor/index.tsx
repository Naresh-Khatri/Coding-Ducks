"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { syntaxTree } from "@codemirror/language";
import type { Diagnostic} from "@codemirror/lint";
import { linter, lintGutter } from "@codemirror/lint";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Extension } from "@uiw/react-codemirror";
import CodeMirror from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import { yCollab } from "y-codemirror.next";
import * as Y from "yjs";

import { useEditorSettingsExtensions } from "./use-editor-settings-extensions";

interface CollabEditorProps {
  roomId?: string;
  userId?: string;
  username?: string;
  language?: "html" | "css" | "js";
  field: string; // The Y.js text field name to bind to
  onCursorChange?: (position: { line: number; column: number }) => void;
  provider: HocuspocusProvider | null;
  ydoc: Y.Doc;
  readOnly?: boolean;
}

const languageExtensions = {
  html: () => html(),
  css: () => css(),
  js: () => javascript(),
};

// Syntax linter that extracts errors from the Lezer parse tree
const syntaxLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  const tree = syntaxTree(view.state);

  // Traverse the syntax tree to find error nodes
  tree.iterate({
    enter: (node: { type: { isError: boolean }; from: number; to: number }) => {
      if (node.type.isError) {
        const errorText = view.state.doc.sliceString(node.from, node.to);
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: "error",
          message: errorText.trim()
            ? `Syntax error: unexpected "${errorText}"`
            : "Syntax error: unexpected token",
        });
      }
    },
  });

  return diagnostics;
});

export function CollabEditor({
  language = "html",
  field,
  onCursorChange,
  provider,
  ydoc,
  readOnly = false,
}: CollabEditorProps) {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [initialValue, setInitialValue] = useState("");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  // Per-user editor preferences (font, tab size, keymap, …). These live
  // outside the collab/undo extensions so changing a setting reconfigures
  // CodeMirror without tearing down the Y.js binding.
  const { extensions: settingsExtensions, showLineNumbers } =
    useEditorSettingsExtensions();
  const allExtensions = useMemo(
    () => [...extensions, ...settingsExtensions],
    [extensions, settingsExtensions],
  );

  useEffect(() => {
    if (!ydoc || !provider) return;

    const ytext = ydoc.getText(field);

    // Get initial value before setting up collab
    setInitialValue(ytext.toString());

    const undoManager = new Y.UndoManager(ytext);
    const extensions = [
      languageExtensions[language](),
      EditorView.lineWrapping,
      yCollab(ytext, provider.awareness, { undoManager }),
      syntaxLinter, // Extracts syntax errors from parse tree
      lintGutter(), // Shows error/warning indicators in the gutter
    ];
    setExtensions(extensions);

    return () => {
      // Stop tracking changes in undo manager
      undoManager.stopCapturing();
      undoManager.destroy();
    };
  }, [ydoc, provider, field, language]);

  if (!ydoc || !provider || extensions.length === 0) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${
          isDark ? "bg-[#282c34] text-gray-400" : "bg-white text-gray-500"
        }`}
      >
        Loading editor...
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <CodeMirror
        key={field} // Force remount on field change
        className="h-full"
        height="100%"
        theme={isDark ? oneDark : "light"}
        extensions={allExtensions}
        basicSetup={{ lineNumbers: showLineNumbers }}
        value={initialValue} // Set initial value, then yCollab takes over
        readOnly={readOnly}
      />
    </div>
  );
}
