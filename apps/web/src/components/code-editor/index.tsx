"use client";

import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useCallback, useMemo } from "react";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { indentRange, indentUnit, StreamLanguage } from "@codemirror/language";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { vim } from "@replit/codemirror-vim";
import CodeMirror from "@uiw/react-codemirror";

export type Language =
  | "py"
  | "js"
  | "ts"
  | "java"
  | "cpp"
  | "c"
  | "rs"
  | "go"
  | "rb"
  | "php";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: Language;
  readOnly?: boolean;
  height?: string;
  className?: string;
  fontSize?: number;
  fontFamily?: string;
  fontLigatures?: boolean;
  tabSize?: number;
  relativeLineNumbers?: boolean;
  vimMode?: boolean;
  editorRef?: React.RefObject<ReactCodeMirrorRef | null>;
  onSave?: () => void;
  onRun?: () => void;
  onSubmit?: () => void;
}

const languageExtensions = {
  py: () => python(),
  js: () => javascript(),
  ts: () => javascript({ typescript: true }),
  java: () => java(),
  cpp: () => cpp(),
  c: () => cpp(),
  rs: () => rust(),
  go: () => go(),
  rb: () => StreamLanguage.define(ruby),
  php: () => php(),
};

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  height = "400px",
  className,
  fontSize = 14,
  fontFamily = "monospace",
  fontLigatures = false,
  tabSize = 2,
  relativeLineNumbers: relLineNums = false,
  vimMode = false,
  editorRef,
  onSave,
  onRun,
  onSubmit,
}: CodeEditorProps) {
  const extensions = useMemo(() => {
    const langExt = languageExtensions[language];
    const exts = [
      ...(vimMode ? [vim()] : []),
      langExt(),
      EditorView.lineWrapping,
      indentUnit.of(" ".repeat(tabSize)),
      EditorView.theme({
        "&": { height },
        ".cm-scroller": { overflow: "auto" },
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
      keymap.of([
        {
          key: "Mod-s",
          run: (view) => {
            const { doc } = view.state;
            const changes = indentRange(view.state, 0, doc.length);
            if (changes) view.dispatch({ changes });
            onSave?.();
            return true;
          },
        },
        {
          key: "Mod-Enter",
          run: () => {
            onRun?.();
            return true;
          },
        },
        {
          key: "Mod-Shift-Enter",
          run: () => {
            onSubmit?.();
            return true;
          },
        },
      ]),
    ];

    if (relLineNums) {
      exts.push(
        lineNumbers({
          formatNumber: (lineNo, state) => {
            const curLine = state.doc.lineAt(state.selection.main.head).number;
            if (lineNo === curLine) return String(lineNo);
            return String(Math.abs(lineNo - curLine));
          },
        }),
      );
    }

    return exts;
  }, [
    language,
    height,
    fontSize,
    fontFamily,
    fontLigatures,
    tabSize,
    relLineNums,
    vimMode,
    onSave,
    onRun,
    onSubmit,
  ]);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange],
  );

  return (
    <CodeMirror
      ref={editorRef}
      value={value}
      onChange={handleChange}
      extensions={extensions}
      theme={oneDark}
      readOnly={readOnly}
      className={className}
      basicSetup={{
        lineNumbers: !relLineNums,
        highlightActiveLineGutter: true,
        highlightActiveLine: true,
        foldGutter: true,
        autocompletion: true,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
      }}
    />
  );
}
