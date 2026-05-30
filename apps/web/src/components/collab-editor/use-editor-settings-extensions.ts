import { useMemo } from "react";
import { indentUnit } from "@codemirror/language";
import { EditorView, lineNumbers } from "@codemirror/view";
import { vim } from "@replit/codemirror-vim";
import type { Extension } from "@uiw/react-codemirror";

import { useEditorSettings } from "~/hooks/use-editor-settings";

/**
 * Translates the shared editor settings (font, tab size, keymap, …) into
 * CodeMirror extensions so the ducklet editors honour the same preferences
 * as the problem editor. Returns the extensions plus whether CodeMirror's
 * built-in (absolute) line numbers should stay on — relative line numbers
 * supply their own gutter, so the default must be disabled in that case.
 */
export function useEditorSettingsExtensions() {
  const {
    fontSize,
    fontFamily,
    fontLigatures,
    tabSize,
    relativeLineNumbers,
    keymap,
  } = useEditorSettings();

  const extensions = useMemo<Extension[]>(() => {
    const exts: Extension[] = [
      indentUnit.of(" ".repeat(tabSize)),
      EditorView.theme({
        ".cm-content": {
          fontSize: `${fontSize}px`,
          fontFamily,
          fontVariantLigatures: fontLigatures ? "normal" : "none",
        },
        ".cm-gutters": {
          fontSize: `${fontSize}px`,
          fontFamily,
        },
        ".cm-vim-panel": { display: "none" },
      }),
    ];

    // vim() must come first so its keymap takes precedence.
    if (keymap === "vim") exts.unshift(vim());

    if (relativeLineNumbers) {
      exts.push(
        lineNumbers({
          formatNumber: (lineNo, state) => {
            const curLine = state.doc.lineAt(state.selection.main.head).number;
            return lineNo === curLine
              ? String(lineNo)
              : String(Math.abs(lineNo - curLine));
          },
        }),
      );
    }

    return exts;
  }, [fontSize, fontFamily, fontLigatures, tabSize, relativeLineNumbers, keymap]);

  return { extensions, showLineNumbers: !relativeLineNumbers };
}
