/**
 * Monaco editor themes. Kept minimal — built on Monaco's `vs-dark` / `vs`
 * bases with the editor background matched to the app's one-dark surface so
 * the editor blends with the surrounding chrome.
 */
import type { Monaco } from "@monaco-editor/react";

let defined = false;

export function defineEditorThemes(monaco: Monaco): void {
  if (defined) return;
  defined = true;
  monaco.editor.defineTheme("editor-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#282c34",
      "editorGutter.background": "#282c34",
    },
  });
  monaco.editor.defineTheme("editor-light", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {},
  });
}

export function themeName(isDark: boolean): string {
  return isDark ? "editor-dark" : "editor-light";
}
